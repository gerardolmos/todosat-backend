const assert =
  require("node:assert/strict");

const {
  randomBytes,
} = require("node:crypto");

const PRODUCTO_UID =
  "api::producto-tienda.producto-tienda";

const PEDIDO_UID =
  "api::pedido-tienda.pedido-tienda";

const LINEA_UID =
  "api::linea-pedido-tienda.linea-pedido-tienda";

const EVENTO_UID =
  "api::evento-stripe-tienda.evento-stripe-tienda";

const VALIDACION_CONTROLLER_UID =
  "api::pedido-tienda.validacion-carrito-tienda";

const CHECKOUT_CONTROLLER_UID =
  "api::pedido-tienda.checkout-tienda";

const WEBHOOK_CONTROLLER_UID =
  "api::evento-stripe-tienda.webhook-stripe-tienda";

const ENV_KEYS = [
  "NODE_ENV",
  "STRIPE_MODE",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CHECKOUT_SUCCESS_URL",
  "CHECKOUT_CANCEL_URL",
  "CHECKOUT_PUBLIC_ENABLED",
  "CHECKOUT_LIVE_ENABLED",
  "CHECKOUT_RATE_LIMIT_MAX",
  "CHECKOUT_RATE_LIMIT_WINDOW_MS",
  "CART_VALIDATION_PUBLIC_ENABLED",
  "CART_VALIDATION_RATE_LIMIT_MAX",
  "CART_VALIDATION_RATE_LIMIT_WINDOW_MS",
];

const previousEnvironment =
  Object.fromEntries(
    ENV_KEYS.map((key) => [
      key,
      process.env[key],
    ]),
  );

function restoreEnvironment() {
  for (const key of ENV_KEYS) {
    const previousValue =
      previousEnvironment[key];

    if (
      typeof previousValue ===
      "undefined"
    ) {
      delete process.env[key];
    } else {
      process.env[key] =
        previousValue;
    }
  }
}

function configureFakeStripeTestMode() {
  process.env.NODE_ENV =
    "development";

  process.env.STRIPE_MODE =
    "test";

  process.env.STRIPE_SECRET_KEY =
    "sk_test_regression_local_no_real";

  process.env.STRIPE_WEBHOOK_SECRET =
    "whsec_regression_local_no_real";

  process.env.CHECKOUT_SUCCESS_URL =
    "http://localhost:4321/tienda/pago-correcto?session_id={CHECKOUT_SESSION_ID}";

  process.env.CHECKOUT_CANCEL_URL =
    "http://localhost:4321/tienda/carrito";

  process.env.CHECKOUT_LIVE_ENABLED =
    "false";
}

function createContext({
  body = {},
  rawBody,
  contentType =
    "application/json",
  ip = "127.0.0.1",
  headers = {},
} = {}) {
  const responseHeaders = {};

  const requestHeaders =
    Object.fromEntries(
      Object.entries(headers).map(
        ([name, value]) => [
          name.toLowerCase(),
          value,
        ],
      ),
    );

  return {
    ip,

    request: {
      body,
      rawBody,
    },

    status: 0,
    body: null,

    is(type) {
      return type === contentType
        ? type
        : null;
    },

    set(name, value) {
      responseHeaders[name] =
        value;
    },

    get(name) {
      return (
        requestHeaders[
          name.toLowerCase()
        ] ?? ""
      );
    },

    responseHeaders,
  };
}

async function findPurchasableProduct() {
  const products =
    await strapi
      .documents(PRODUCTO_UID)
      .findMany({
        status: "published",

        filters: {
          activo: true,
          estado_venta:
            "Disponible",
        },

        fields: [
          "nombre",
          "sku",
          "referencia_proveedor",
          "tipo_producto",
          "precio_centimos",
          "moneda",
          "requiere_envio",
        ],
      });

  const product =
    products.find(
      (candidate) =>
        candidate.documentId &&
        candidate.nombre?.trim() &&
        candidate.sku?.trim() &&
        candidate
          .referencia_proveedor
          ?.trim() &&
        candidate.moneda === "EUR" &&
        Number.isSafeInteger(
          Number(
            candidate
              .precio_centimos,
          ),
        ) &&
        Number(
          candidate
            .precio_centimos,
        ) > 0,
    );

  assert.ok(
    product,
    "No existe un producto publicado y comprable para ejecutar las pruebas.",
  );

  return product;
}

async function deleteEventByStripeId(
  stripeEventId,
) {
  const query =
    strapi.db.query(EVENTO_UID);

  const record =
    await query.findOne({
      where: {
        stripe_event_id:
          stripeEventId,
      },

      select: ["id"],
    });

  if (record?.id) {
    await query.delete({
      where: {
        id: record.id,
      },
    });
  }
}

async function deleteTestOrder(
  orderDocumentId,
) {
  if (!orderDocumentId) {
    return;
  }

  const orderQuery =
    strapi.db.query(PEDIDO_UID);

  const order =
    await orderQuery.findOne({
      where: {
        documentId:
          orderDocumentId,
      },

      select: [
        "id",
        "documentId",
      ],
    });

  if (!order?.id) {
    return;
  }

  const lineQuery =
    strapi.db.query(LINEA_UID);

  const lines =
    await lineQuery.findMany({
      where: {
        pedido_tienda: {
          id: order.id,
        },
      },

      select: ["id"],
    });

  for (const line of lines) {
    await lineQuery.delete({
      where: {
        id: line.id,
      },
    });
  }

  await orderQuery.delete({
    where: {
      id: order.id,
    },
  });
}

(async () => {
  let exitCode = 0;

  let testOrderDocumentId = null;

  const createdEventIds = [];

  try {
    configureFakeStripeTestMode();

    const product =
      await findPurchasableProduct();

    const unitPrice =
      Number(
        product.precio_centimos,
      );

    const validationController =
      strapi.controller(
        VALIDACION_CONTROLLER_UID,
      );

    const checkoutController =
      strapi.controller(
        CHECKOUT_CONTROLLER_UID,
      );

    const webhookController =
      strapi.controller(
        WEBHOOK_CONTROLLER_UID,
      );

    assert.ok(
      validationController,
      "No se ha registrado el controlador de validación.",
    );

    assert.ok(
      checkoutController,
      "No se ha registrado el controlador de checkout.",
    );

    assert.ok(
      webhookController,
      "No se ha registrado el controlador del webhook.",
    );

    process.env
      .CART_VALIDATION_PUBLIC_ENABLED =
      "false";

    const validationDisabled =
      createContext({
        body: {
          items: [],
        },
      });

    await validationController
      .validarCarrito(
        validationDisabled,
      );

    assert.equal(
      validationDisabled.status,
      503,
    );

    assert.equal(
      validationDisabled.body.codigo,
      "CART_VALIDATION_DISABLED",
    );

    assert.equal(
      validationDisabled
        .responseHeaders[
          "Cache-Control"
        ],
      "no-store",
    );

    console.log(
      "OK 1: validación pública desactivada por defecto",
    );

    process.env
      .CART_VALIDATION_PUBLIC_ENABLED =
      "true";

    process.env
      .CART_VALIDATION_RATE_LIMIT_MAX =
      "30";

    process.env
      .CART_VALIDATION_RATE_LIMIT_WINDOW_MS =
      "60000";

    const validatedContext =
      createContext({
        ip: "198.51.100.10",

        body: {
          items: [
            {
              documentId:
                product.documentId,

              cantidad: 1,

              precioCentimos: 1,
              nombre:
                "Producto manipulado",
              moneda: "USD",
            },

            {
              documentId:
                product.documentId,

              cantidad: 1,

              precioCentimos: 1,
            },
          ],
        },
      });

    await validationController
      .validarCarrito(
        validatedContext,
      );

    assert.equal(
      validatedContext.status,
      200,
    );

    assert.equal(
      validatedContext.body
        .carritoValidado,
      true,
    );

    assert.equal(
      validatedContext.body
        .pagosRealesBloqueados,
      true,
    );

    assert.equal(
      validatedContext.body
        .cantidadTotal,
      2,
    );

    assert.equal(
      validatedContext.body
        .subtotalProductosCentimos,
      unitPrice * 2,
    );

    assert.equal(
      validatedContext.body
        .lineas.length,
      1,
    );

    const validatedLine =
      validatedContext.body
        .lineas[0];

    assert.equal(
      validatedLine.cantidad,
      2,
    );

    assert.equal(
      validatedLine
        .precioUnitarioCentimos,
      unitPrice,
    );

    assert.equal(
      validatedLine.nombre,
      product.nombre,
    );

    assert.equal(
      validatedLine.moneda,
      "EUR",
    );

    assert.equal(
      "referenciaProveedor" in
        validatedLine,
      false,
    );

    assert.equal(
      "productoId" in
        validatedLine,
      false,
    );

    console.log(
      "OK 2: carrito recalculado y datos internos ocultos",
    );

    const invalidProductContext =
      createContext({
        ip: "198.51.100.11",

        body: {
          items: [
            {
              documentId:
                "producto-inexistente-regresion",

              cantidad: 1,
            },
          ],
        },
      });

    await validationController
      .validarCarrito(
        invalidProductContext,
      );

    assert.equal(
      invalidProductContext.status,
      400,
    );

    assert.equal(
      invalidProductContext.body
        .codigo,
      "PRODUCT_NOT_PURCHASABLE",
    );

    console.log(
      "OK 3: producto inexistente rechazado",
    );

    process.env
      .CART_VALIDATION_RATE_LIMIT_MAX =
      "2";

    const rateLimitIp =
      "198.51.100.12";

    for (
      let attempt = 0;
      attempt < 2;
      attempt += 1
    ) {
      const allowedContext =
        createContext({
          ip: rateLimitIp,

          body: {
            items: [
              {
                documentId:
                  product.documentId,

                cantidad: 1,
              },
            ],
          },
        });

      await validationController
        .validarCarrito(
          allowedContext,
        );

      assert.equal(
        allowedContext.status,
        200,
      );
    }

    const blockedContext =
      createContext({
        ip: rateLimitIp,

        body: {
          items: [
            {
              documentId:
                product.documentId,

              cantidad: 1,
            },
          ],
        },
      });

    await validationController
      .validarCarrito(
        blockedContext,
      );

    assert.equal(
      blockedContext.status,
      429,
    );

    assert.equal(
      blockedContext.body.codigo,
      "RATE_LIMIT_EXCEEDED",
    );

    assert.ok(
      blockedContext
        .responseHeaders[
          "Retry-After"
        ],
    );

    console.log(
      "OK 4: límite de frecuencia aplicado",
    );

    process.env
      .CHECKOUT_PUBLIC_ENABLED =
      "false";

    const checkoutDisabled =
      createContext({
        headers: {
          "idempotency-key":
            "regression_disabled_123456789",
        },

        body: {
          items: [
            {
              documentId:
                product.documentId,

              cantidad: 1,
            },
          ],
        },
      });

    await checkoutController
      .crearCheckout(
        checkoutDisabled,
      );

    assert.equal(
      checkoutDisabled.status,
      503,
    );

    assert.equal(
      checkoutDisabled.body.codigo,
      "CHECKOUT_DISABLED",
    );

    console.log(
      "OK 5: checkout público desactivado",
    );

    process.env
      .CHECKOUT_PUBLIC_ENABLED =
      "true";

    process.env.STRIPE_MODE =
      "live";

    process.env.NODE_ENV =
      "development";

    process.env
      .CHECKOUT_LIVE_ENABLED =
      "false";

    const liveBlocked =
      createContext({
        ip: "198.51.100.20",

        headers: {
          "idempotency-key":
            "regression_live_blocked_123456789",
        },

        body: {
          items: [
            {
              documentId:
                product.documentId,

              cantidad: 1,
            },
          ],
        },
      });

    await checkoutController
      .crearCheckout(
        liveBlocked,
      );

    assert.equal(
      liveBlocked.status,
      503,
    );

    assert.equal(
      liveBlocked.body
        .checkoutCreado,
      false,
    );

    console.log(
      "OK 6: Stripe real bloqueado fuera de producción",
    );

    configureFakeStripeTestMode();

    process.env
      .CHECKOUT_PUBLIC_ENABLED =
      "false";

    const missingSignature =
      createContext({
        rawBody:
          Buffer.from(
            '{"id":"evt_fake"}',
            "utf8",
          ),
      });

    await webhookController
      .recibir(
        missingSignature,
      );

    assert.equal(
      missingSignature.status,
      400,
    );

    assert.equal(
      missingSignature.body
        .recibido,
      false,
    );

    console.log(
      "OK 7: webhook sin firma rechazado",
    );

    const oversizedWebhook =
      createContext({
        rawBody:
          Buffer.alloc(
            512 * 1024 + 1,
            0,
          ),

        headers: {
          "stripe-signature":
            "firma-no-utilizada",
        },
      });

    await webhookController
      .recibir(
        oversizedWebhook,
      );

    assert.equal(
      oversizedWebhook.status,
      413,
    );

    console.log(
      "OK 8: webhook sobredimensionado rechazado",
    );

    const orderService =
      strapi.service(PEDIDO_UID);

    const idempotencyKey =
      `regression_${Date.now()}_${randomBytes(
        8,
      ).toString("hex")}`;

    const order =
      await orderService
        .crearPedidoProvisionalSeguro(
          [
            {
              documentId:
                product.documentId,

              cantidad: 1,
            },
          ],

          idempotencyKey,
        );

    testOrderDocumentId =
      order.pedidoDocumentId;

    assert.equal(
      order.reutilizado,
      false,
    );

    assert.equal(
      order.estado,
      "Pendiente de pago",
    );

    assert.equal(
      order.subtotalCentimos,
      unitPrice,
    );

    assert.equal(
      order.impuestosCentimos,
      0,
    );

    assert.equal(
      order.envioCentimos,
      0,
    );

    assert.equal(
      order.totalCentimos,
      unitPrice,
    );

    const reusedOrder =
      await orderService
        .crearPedidoProvisionalSeguro(
          [
            {
              documentId:
                product.documentId,

              cantidad: 1,
            },
          ],

          idempotencyKey,
        );

    assert.equal(
      reusedOrder
        .pedidoDocumentId,
      order.pedidoDocumentId,
    );

    assert.equal(
      reusedOrder.reutilizado,
      true,
    );

    await assert.rejects(
      () =>
        orderService
          .crearPedidoProvisionalSeguro(
            [
              {
                documentId:
                  product.documentId,

                cantidad: 2,
              },
            ],

            idempotencyKey,
          ),

      (error) =>
        error?.code ===
        "IDEMPOTENCY_KEY_REUSED",
    );

    console.log(
      "OK 9: pedido provisional idempotente",
    );

    const sessionId =
      `cs_test_regression_${randomBytes(
        8,
      ).toString("hex")}`;

    let createCalls = 0;
    let retrieveCalls = 0;
    let capturedCreateParameters;
    let capturedCreateOptions;

    const fakeSession = {
      id: sessionId,

      object:
        "checkout.session",

      url:
        "https://checkout.stripe.test/regression",

      status: "open",

      payment_status:
        "unpaid",

      mode: "payment",

      livemode: false,

      client_reference_id:
        order.numeroPedido,

      metadata: {
        pedido_document_id:
          order.pedidoDocumentId,

        numero_pedido:
          order.numeroPedido,
      },

      currency: "eur",

      amount_subtotal:
        order.totalCentimos,

      amount_total:
        order.totalCentimos,

      expires_at:
        Math.floor(
          Date.now() / 1000,
        ) + 1800,

      payment_intent: null,
    };

    const fakeStripeClient = {
      checkout: {
        sessions: {
          async create(
            parameters,
            options,
          ) {
            createCalls += 1;

            capturedCreateParameters =
              parameters;

            capturedCreateOptions =
              options;

            return fakeSession;
          },

          async retrieve(id) {
            retrieveCalls += 1;

            assert.equal(
              id,
              sessionId,
            );

            return fakeSession;
          },
        },
      },
    };

    const checkoutSession =
      await orderService
        .crearSesionCheckoutStripeSegura(
          order.pedidoDocumentId,
          fakeStripeClient,
        );

    assert.equal(
      createCalls,
      1,
    );

    assert.equal(
      checkoutSession.checkoutUrl,
      fakeSession.url,
    );

    assert.equal(
      checkoutSession.totalCentimos,
      order.totalCentimos,
    );

    assert.equal(
      checkoutSession.moneda,
      "EUR",
    );

    assert.equal(
      capturedCreateOptions
        ?.idempotencyKey,
      `checkout:${order.pedidoDocumentId}`,
    );

    assert.ok(
      Array.isArray(
        capturedCreateParameters
          ?.line_items,
      ),
    );

    const reusedSession =
      await orderService
        .crearSesionCheckoutStripeSegura(
          order.pedidoDocumentId,
          fakeStripeClient,
        );

    assert.equal(
      createCalls,
      1,
    );

    assert.equal(
      retrieveCalls,
      1,
    );

    assert.equal(
      reusedSession.reutilizada,
      true,
    );

    console.log(
      "OK 10: sesión Stripe simulada e idempotente",
    );

    const webhookService =
      strapi.service(EVENTO_UID);

    const tamperedEventId =
      `evt_test_tampered_${randomBytes(
        8,
      ).toString("hex")}`;

    createdEventIds.push(
      tamperedEventId,
    );

    const paidSession = {
      ...fakeSession,

      payment_status:
        "paid",

      payment_intent:
        `pi_test_regression_${randomBytes(
          8,
        ).toString("hex")}`,
    };

    await assert.rejects(
      () =>
        webhookService
          .procesarEventoStripeSeguro(
            {
              id: tamperedEventId,

              object: "event",

              type:
                "checkout.session.completed",

              livemode: false,

              created:
                Math.floor(
                  Date.now() / 1000,
                ),

              data: {
                object: {
                  ...paidSession,

                  amount_total:
                    order
                      .totalCentimos +
                    1,
                },
              },
            },
          ),

      (error) =>
        error?.code ===
        "STRIPE_AMOUNT_MISMATCH",
    );

    const validEventId =
      `evt_test_valid_${randomBytes(
        8,
      ).toString("hex")}`;

    createdEventIds.push(
      validEventId,
    );

    const validEvent = {
      id: validEventId,

      object: "event",

      type:
        "checkout.session.completed",

      livemode: false,

      created:
        Math.floor(
          Date.now() / 1000,
        ),

      data: {
        object:
          paidSession,
      },
    };

    const webhookResult =
      await webhookService
        .procesarEventoStripeSeguro(
          validEvent,
        );

    assert.equal(
      webhookResult.accion,
      "pedido_pagado",
    );

    assert.equal(
      webhookResult.duplicado,
      false,
    );

    const duplicatedResult =
      await webhookService
        .procesarEventoStripeSeguro(
          validEvent,
        );

    assert.equal(
      duplicatedResult.duplicado,
      true,
    );

    const storedOrder =
      await strapi.db
        .query(PEDIDO_UID)
        .findOne({
          where: {
            documentId:
              order
                .pedidoDocumentId,
          },

          select: [
            "estado",
            "stripe_payment_intent_id",
          ],
        });

    assert.equal(
      storedOrder.estado,
      "Pagado",
    );

    assert.equal(
      storedOrder
        .stripe_payment_intent_id,
      paidSession
        .payment_intent,
    );

    console.log(
      "OK 11: webhook seguro, importe validado y duplicados ignorados",
    );

    console.log(
      "\nRESULTADO: PRUEBAS DE TIENDA SUPERADAS",
    );

    console.log(
      "No se ha realizado ninguna conexión ni cobro real con Stripe.",
    );
  } catch (error) {
    exitCode = 1;

    console.error(
      "\nFALLO EN PRUEBAS DE TIENDA:",
      error,
    );

    console.error(
      error?.stack ?? "",
    );
  } finally {
    try {
      for (
        const eventId
        of createdEventIds
      ) {
        await deleteEventByStripeId(
          eventId,
        );
      }

      await deleteTestOrder(
        testOrderDocumentId,
      );

      if (testOrderDocumentId) {
        const remainingOrder =
          await strapi.db
            .query(PEDIDO_UID)
            .findOne({
              where: {
                documentId:
                  testOrderDocumentId,
              },

              select: ["id"],
            });

        assert.equal(
          remainingOrder,
          null,
          "El pedido técnico de prueba no se eliminó.",
        );

        console.log(
          "Limpieza: pedido y eventos técnicos eliminados.",
        );
      }
    } catch (cleanupError) {
      exitCode = 1;

      console.error(
        "\nFALLO EN LA LIMPIEZA:",
        cleanupError,
      );
    }

    restoreEnvironment();

    try {
      await strapi.destroy();
    } catch {}

    process.exit(exitCode);
  }
})();
