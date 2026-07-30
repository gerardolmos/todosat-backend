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

const WEBHOOK_CONTROLLER_UID =
  "api::evento-stripe-tienda.webhook-stripe-tienda";

const STATUS_CONTROLLER_UID =
  "api::pedido-tienda.estado-checkout-tienda";

const ENV_KEYS = [
  "NODE_ENV",
  "STRIPE_MODE",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CHECKOUT_SUCCESS_URL",
  "CHECKOUT_CANCEL_URL",
  "CHECKOUT_LIVE_ENABLED",
  "CHECKOUT_STATUS_PUBLIC_ENABLED",
  "CHECKOUT_STATUS_RATE_LIMIT_MAX",
  "CHECKOUT_STATUS_RATE_LIMIT_WINDOW_MS",
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

function configureLocalTestMode() {
  process.env.NODE_ENV =
    "development";

  process.env.STRIPE_MODE =
    "test";

  /*
   * Valores deliberadamente ficticios.
   * Nunca se utilizan para llamar a Stripe.
   */
  process.env.STRIPE_SECRET_KEY =
    "sk_test_webhook_lifecycle_local_no_real";

  process.env.STRIPE_WEBHOOK_SECRET =
    "whsec_webhook_lifecycle_local_no_real";

  process.env.CHECKOUT_SUCCESS_URL =
    "http://localhost:4321/tienda/compra/confirmacion?session_id={CHECKOUT_SESSION_ID}";

  process.env.CHECKOUT_CANCEL_URL =
    "http://localhost:4321/tienda/carrito?checkout=cancelado";

  process.env.CHECKOUT_LIVE_ENABLED =
    "false";

  process.env
    .CHECKOUT_STATUS_PUBLIC_ENABLED =
    "true";

  process.env
    .CHECKOUT_STATUS_RATE_LIMIT_MAX =
    "500";

  process.env
    .CHECKOUT_STATUS_RATE_LIMIT_WINDOW_MS =
    "60000";
}

function randomSuffix() {
  return randomBytes(6)
    .toString("hex");
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
          "precio_centimos",
          "moneda",
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
    "No existe un producto publicado y comprable para ejecutar la suite.",
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

async function deleteOrder(
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

async function createScenarioOrder({
  product,
  label,
  orderService,
  createdOrderIds,
}) {
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

        `wh_${label}_${Date.now()}_${randomSuffix()}`,
      );

  const sessionId =
    `cs_test_wh_${label}_${randomSuffix()}`;

  const orderQuery =
    strapi.db.query(PEDIDO_UID);

  const stored =
    await orderQuery.findOne({
      where: {
        documentId:
          order.pedidoDocumentId,
      },

      select: ["id"],
    });

  assert.ok(
    stored?.id,
    `No se encontró el pedido de ${label}.`,
  );

  await orderQuery.update({
    where: {
      id: stored.id,
    },

    data: {
      stripe_checkout_session_id:
        sessionId,
    },
  });

  createdOrderIds.add(
    order.pedidoDocumentId,
  );

  return {
    ...order,
    sessionId,
  };
}

function createEvent({
  order,
  type,
  eventId =
    `evt_test_wh_${randomSuffix()}`,
  sessionOverrides = {},
  eventOverrides = {},
}) {
  const baseMetadata = {
    pedido_document_id:
      order.pedidoDocumentId,

    numero_pedido:
      order.numeroPedido,
  };

  const session = {
    id: order.sessionId,

    object:
      "checkout.session",

    status: "complete",
    payment_status: "unpaid",
    payment_intent: null,

    mode: "payment",
    livemode: false,

    client_reference_id:
      order.numeroPedido,

    metadata:
      baseMetadata,

    currency: "eur",

    amount_subtotal:
      order.totalCentimos,

    amount_total:
      order.totalCentimos,

    ...sessionOverrides,
  };

  return {
    id: eventId,
    object: "event",
    type,
    livemode: false,

    created:
      Math.floor(
        Date.now() / 1000,
      ),

    data: {
      object: session,
    },

    ...eventOverrides,
  };
}

async function getStoredOrder(
  orderDocumentId,
) {
  return strapi.db
    .query(PEDIDO_UID)
    .findOne({
      where: {
        documentId:
          orderDocumentId,
      },

      select: [
        "estado",
        "stripe_payment_intent_id",
        "fecha_pago",
      ],
    });
}

async function getEventRecord(
  eventId,
) {
  return strapi.db
    .query(EVENTO_UID)
    .findOne({
      where: {
        stripe_event_id:
          eventId,
      },

      select: [
        "procesado",
        "intentos",
        "error",
        "tipo_evento",
      ],
    });
}

async function processTrackedEvent({
  webhookService,
  event,
  createdEventIds,
}) {
  createdEventIds.add(
    event.id,
  );

  return webhookService
    .procesarEventoStripeSeguro(
      event,
    );
}

async function expectWebhookError({
  webhookService,
  event,
  createdEventIds,
  code,
  status,
  recordExpected = true,
}) {
  createdEventIds.add(
    event.id,
  );

  await assert.rejects(
    () =>
      webhookService
        .procesarEventoStripeSeguro(
          event,
        ),

    (error) => {
      assert.equal(
        error?.code,
        code,
      );

      if (
        typeof status === "number"
      ) {
        assert.equal(
          error?.status,
          status,
        );
      }

      return true;
    },
  );

  const record =
    await getEventRecord(
      event.id,
    );

  if (!recordExpected) {
    assert.equal(
      record,
      null,
      `${code} no debería crear un registro de evento.`,
    );

    return null;
  }

  assert.ok(
    record,
    `${code} debería registrar el evento fallido.`,
  );

  assert.equal(
    record.procesado,
    false,
  );

  assert.equal(
    record.intentos,
    1,
  );

  assert.match(
    String(record.error ?? ""),
    new RegExp(`^${code}:`),
  );

  return record;
}

async function assertPublicStatus({
  statusController,
  order,
  expectedState,
  expectedConfirmed,
}) {
  const context =
    createContext({
      ip:
        `198.51.100.${
          10 +
          Math.floor(
            Math.random() * 150,
          )
        }`,

      body: {
        sessionId:
          order.sessionId,
      },
    });

  await statusController
    .consultarEstado(
      context,
    );

  assert.equal(
    context.status,
    200,
  );

  assert.equal(
    context.body.estadoDisponible,
    true,
  );

  assert.equal(
    context.body.estadoPago,
    expectedState,
  );

  assert.equal(
    context.body.pagoConfirmado,
    expectedConfirmed,
  );
}

(async () => {
  let exitCode = 0;

  const createdEventIds =
    new Set();

  const createdOrderIds =
    new Set();

  try {
    configureLocalTestMode();

    const product =
      await findPurchasableProduct();

    const orderService =
      strapi.service(PEDIDO_UID);

    const webhookService =
      strapi.service(EVENTO_UID);

    const webhookController =
      strapi.controller(
        WEBHOOK_CONTROLLER_UID,
      );

    const statusController =
      strapi.controller(
        STATUS_CONTROLLER_UID,
      );

    assert.ok(
      orderService,
      "No se ha registrado el servicio de pedidos.",
    );

    assert.ok(
      webhookService,
      "No se ha registrado el servicio del webhook.",
    );

    assert.ok(
      webhookController,
      "No se ha registrado el controlador del webhook.",
    );

    assert.ok(
      statusController,
      "No se ha registrado el controlador público de estado.",
    );

    /*
     * 1. Frontera HTTP del webhook.
     */
    const wrongContentType =
      createContext({
        contentType:
          "text/plain",

        rawBody:
          Buffer.from(
            "{}",
            "utf8",
          ),
      });

    await webhookController
      .recibir(
        wrongContentType,
      );

    assert.equal(
      wrongContentType.status,
      415,
    );

    const missingRawBody =
      createContext({
        headers: {
          "stripe-signature":
            "t=1,v1=no-utilizada",
        },
      });

    await webhookController
      .recibir(
        missingRawBody,
      );

    assert.equal(
      missingRawBody.status,
      500,
    );

    const invalidSignature =
      createContext({
        rawBody:
          Buffer.from(
            '{"id":"evt_firma_invalida"}',
            "utf8",
          ),

        headers: {
          "stripe-signature":
            "t=1,v1=firma_invalida",
        },
      });

    await webhookController
      .recibir(
        invalidSignature,
      );

    assert.equal(
      invalidSignature.status,
      400,
    );

    assert.equal(
      invalidSignature.body
        .recibido,
      false,
    );

    console.log(
      "OK WEBHOOK 1: formato, cuerpo y firma inválidos rechazados",
    );

    /*
     * 2. Los eventos ajenos a la tienda se
     * ignoran sin persistirlos.
     */
    const ignoredOrder =
      await createScenarioOrder({
        product,
        label: "ignored",
        orderService,
        createdOrderIds,
      });

    const ignoredEvent =
      createEvent({
        order: ignoredOrder,
        type:
          "customer.created",
      });

    const ignoredResult =
      await processTrackedEvent({
        webhookService,
        event: ignoredEvent,
        createdEventIds,
      });

    assert.equal(
      ignoredResult.ignorado,
      true,
    );

    assert.equal(
      ignoredResult.accion,
      "ignorado",
    );

    assert.equal(
      await getEventRecord(
        ignoredEvent.id,
      ),
      null,
    );

    console.log(
      "OK WEBHOOK 2: evento no soportado ignorado",
    );

    /*
     * 3. completed sin pago confirmado:
     * el pedido permanece pendiente.
     */
    const pendingOrder =
      await createScenarioOrder({
        product,
        label: "pending",
        orderService,
        createdOrderIds,
      });

    const pendingEvent =
      createEvent({
        order: pendingOrder,

        type:
          "checkout.session.completed",
      });

    const pendingResult =
      await processTrackedEvent({
        webhookService,
        event: pendingEvent,
        createdEventIds,
      });

    assert.equal(
      pendingResult.accion,
      "esperando_pago",
    );

    const pendingStored =
      await getStoredOrder(
        pendingOrder
          .pedidoDocumentId,
      );

    assert.equal(
      pendingStored.estado,
      "Pendiente de pago",
    );

    assert.equal(
      pendingStored
        .stripe_payment_intent_id,
      null,
    );

    const pendingRecord =
      await getEventRecord(
        pendingEvent.id,
      );

    assert.equal(
      pendingRecord.procesado,
      true,
    );

    assert.equal(
      pendingRecord.intentos,
      1,
    );

    await assertPublicStatus({
      statusController,
      order: pendingOrder,
      expectedState:
        "pendiente",
      expectedConfirmed: false,
    });

    console.log(
      "OK WEBHOOK 3: pago pendiente conservado",
    );

    /*
     * 4. Éxito diferido. Primero llega una
     * notificación incoherente y posteriormente
     * se reintenta el mismo evento correctamente.
     */
    const delayedOrder =
      await createScenarioOrder({
        product,
        label: "delayed",
        orderService,
        createdOrderIds,
      });

    const delayedEventId =
      `evt_test_wh_retry_${randomSuffix()}`;

    const delayedUnpaidEvent =
      createEvent({
        order: delayedOrder,

        eventId:
          delayedEventId,

        type:
          "checkout.session.async_payment_succeeded",
      });

    await expectWebhookError({
      webhookService,
      event:
        delayedUnpaidEvent,
      createdEventIds,
      code:
        "STRIPE_PAYMENT_NOT_PAID",
      status: 400,
    });

    const paymentIntentId =
      `pi_test_wh_${randomSuffix()}`;

    const delayedPaidEvent =
      createEvent({
        order: delayedOrder,

        eventId:
          delayedEventId,

        type:
          "checkout.session.async_payment_succeeded",

        sessionOverrides: {
          payment_status:
            "paid",

          payment_intent:
            paymentIntentId,
        },
      });

    const delayedResult =
      await webhookService
        .procesarEventoStripeSeguro(
          delayedPaidEvent,
        );

    assert.equal(
      delayedResult.accion,
      "pedido_pagado",
    );

    const delayedStored =
      await getStoredOrder(
        delayedOrder
          .pedidoDocumentId,
      );

    assert.equal(
      delayedStored.estado,
      "Pagado",
    );

    assert.equal(
      delayedStored
        .stripe_payment_intent_id,
      paymentIntentId,
    );

    assert.ok(
      delayedStored.fecha_pago,
    );

    const retriedRecord =
      await getEventRecord(
        delayedEventId,
      );

    assert.equal(
      retriedRecord.procesado,
      true,
    );

    assert.equal(
      retriedRecord.intentos,
      2,
    );

    assert.equal(
      retriedRecord.error,
      null,
    );

    await assertPublicStatus({
      statusController,
      order: delayedOrder,
      expectedState:
        "confirmado",
      expectedConfirmed: true,
    });

    console.log(
      "OK WEBHOOK 4: éxito diferido reintentado y confirmado",
    );

    /*
     * 5. Un segundo evento con el mismo pago
     * no modifica el pedido ya pagado.
     */
    const samePaymentEvent =
      createEvent({
        order: delayedOrder,

        type:
          "checkout.session.async_payment_succeeded",

        sessionOverrides: {
          payment_status:
            "paid",

          payment_intent:
            paymentIntentId,
        },
      });

    const samePaymentResult =
      await processTrackedEvent({
        webhookService,
        event:
          samePaymentEvent,
        createdEventIds,
      });

    assert.equal(
      samePaymentResult.accion,
      "pedido_ya_pagado",
    );

    const conflictingPaymentEvent =
      createEvent({
        order: delayedOrder,

        type:
          "checkout.session.async_payment_succeeded",

        sessionOverrides: {
          payment_status:
            "paid",

          payment_intent:
            `pi_test_conflict_${randomSuffix()}`,
        },
      });

    await expectWebhookError({
      webhookService,
      event:
        conflictingPaymentEvent,
      createdEventIds,
      code:
        "STRIPE_PAYMENT_INTENT_MISMATCH",
      status: 409,
    });

    const delayedAfterConflict =
      await getStoredOrder(
        delayedOrder
          .pedidoDocumentId,
      );

    assert.equal(
      delayedAfterConflict.estado,
      "Pagado",
    );

    assert.equal(
      delayedAfterConflict
        .stripe_payment_intent_id,
      paymentIntentId,
    );

    console.log(
      "OK WEBHOOK 5: pago confirmado protegido frente a conflictos",
    );

    /*
     * 6. Fallo de pago.
     */
    const failedOrder =
      await createScenarioOrder({
        product,
        label: "failed",
        orderService,
        createdOrderIds,
      });

    const failedEvent =
      createEvent({
        order: failedOrder,

        type:
          "checkout.session.async_payment_failed",
      });

    const failedResult =
      await processTrackedEvent({
        webhookService,
        event: failedEvent,
        createdEventIds,
      });

    assert.equal(
      failedResult.accion,
      "pago_fallido",
    );

    const failedStored =
      await getStoredOrder(
        failedOrder
          .pedidoDocumentId,
      );

    assert.equal(
      failedStored.estado,
      "Pago fallido",
    );

    await assertPublicStatus({
      statusController,
      order: failedOrder,
      expectedState:
        "fallido",
      expectedConfirmed: false,
    });

    const paymentAfterFailure =
      createEvent({
        order: failedOrder,

        type:
          "checkout.session.completed",

        sessionOverrides: {
          payment_status:
            "paid",

          payment_intent:
            `pi_test_after_failure_${randomSuffix()}`,
        },
      });

    await expectWebhookError({
      webhookService,
      event:
        paymentAfterFailure,
      createdEventIds,
      code:
        "ORDER_STATE_INVALID_FOR_PAYMENT",
      status: 409,
    });

    assert.equal(
      (
        await getStoredOrder(
          failedOrder
            .pedidoDocumentId,
        )
      ).estado,
      "Pago fallido",
    );

    console.log(
      "OK WEBHOOK 6: pago fallido registrado y protegido",
    );

    /*
     * 7. Caducidad de la sesión.
     */
    const expiredOrder =
      await createScenarioOrder({
        product,
        label: "expired",
        orderService,
        createdOrderIds,
      });

    const expiredEvent =
      createEvent({
        order: expiredOrder,

        type:
          "checkout.session.expired",
      });

    const expiredResult =
      await processTrackedEvent({
        webhookService,
        event: expiredEvent,
        createdEventIds,
      });

    assert.equal(
      expiredResult.accion,
      "sesion_caducada",
    );

    assert.equal(
      (
        await getStoredOrder(
          expiredOrder
            .pedidoDocumentId,
        )
      ).estado,
      "Cancelado",
    );

    await assertPublicStatus({
      statusController,
      order: expiredOrder,
      expectedState:
        "cancelado",
      expectedConfirmed: false,
    });

    const failureAfterExpiry =
      createEvent({
        order: expiredOrder,

        type:
          "checkout.session.async_payment_failed",
      });

    const noChangeResult =
      await processTrackedEvent({
        webhookService,
        event:
          failureAfterExpiry,
        createdEventIds,
      });

    assert.equal(
      noChangeResult.accion,
      "sin_cambios",
    );

    assert.equal(
      (
        await getStoredOrder(
          expiredOrder
            .pedidoDocumentId,
        )
      ).estado,
      "Cancelado",
    );

    console.log(
      "OK WEBHOOK 7: sesión caducada sin transiciones regresivas",
    );

    /*
     * 8. Matriz de rechazos de seguridad.
     */
    const securityOrder =
      await createScenarioOrder({
        product,
        label: "security",
        orderService,
        createdOrderIds,
      });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          eventOverrides: {
            livemode: true,
          },

          sessionOverrides: {
            livemode: true,
          },
        }),

      createdEventIds,

      code:
        "STRIPE_EVENT_MODE_MISMATCH",

      status: 400,
      recordExpected: false,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            metadata: {
              numero_pedido:
                securityOrder
                  .numeroPedido,
            },
          },
        }),

      createdEventIds,

      code:
        "STRIPE_ORDER_METADATA_MISSING",

      status: 400,
      recordExpected: false,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            livemode: true,
          },
        }),

      createdEventIds,

      code:
        "STRIPE_SESSION_MODE_MISMATCH",

      status: 400,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            mode:
              "subscription",
          },
        }),

      createdEventIds,

      code:
        "STRIPE_SESSION_MODE_INVALID",

      status: 400,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            id:
              `cs_test_wrong_${randomSuffix()}`,
          },
        }),

      createdEventIds,

      code:
        "STRIPE_SESSION_ID_MISMATCH",

      status: 400,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            client_reference_id:
              "PEDIDO-MANIPULADO",
          },
        }),

      createdEventIds,

      code:
        "STRIPE_ORDER_REFERENCE_MISMATCH",

      status: 400,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            currency: "usd",
          },
        }),

      createdEventIds,

      code:
        "STRIPE_CURRENCY_MISMATCH",

      status: 400,
    });

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            securityOrder,

          type:
            "checkout.session.completed",

          sessionOverrides: {
            payment_status:
              "paid",

            payment_intent:
              null,
          },
        }),

      createdEventIds,

      code:
        "STRIPE_PAYMENT_INTENT_MISSING",

      status: 400,
    });

    const missingOrder = {
      pedidoDocumentId:
        `pedido_inexistente_${randomSuffix()}`,

      numeroPedido:
        `TS-NO-${randomSuffix()}`,

      sessionId:
        `cs_test_missing_${randomSuffix()}`,

      totalCentimos:
        1000,
    };

    await expectWebhookError({
      webhookService,

      event:
        createEvent({
          order:
            missingOrder,

          type:
            "checkout.session.completed",
        }),

      createdEventIds,

      code:
        "ORDER_NOT_FOUND",

      status: 404,
    });

    assert.equal(
      (
        await getStoredOrder(
          securityOrder
            .pedidoDocumentId,
        )
      ).estado,
      "Pendiente de pago",
    );

    console.log(
      "OK WEBHOOK 8: matriz de manipulaciones rechazada",
    );

    /*
     * 9. Dos entregas simultáneas dentro de
     * la misma instancia solo pueden ejecutar
     * una vez los efectos del evento.
     */
    const concurrentOrder =
      await createScenarioOrder({
        product,
        label: "concurrent",
        orderService,
        createdOrderIds,
      });

    const concurrentPaymentIntentId =
      `pi_test_concurrent_${randomSuffix()}`;

    const concurrentEvent =
      createEvent({
        order: concurrentOrder,

        type:
          "checkout.session.completed",

        sessionOverrides: {
          payment_status:
            "paid",

          payment_intent:
            concurrentPaymentIntentId,
        },
      });

    createdEventIds.add(
      concurrentEvent.id,
    );

    const concurrentResults =
      await Promise.all([
        webhookService
          .procesarEventoStripeSeguro(
            concurrentEvent,
          ),

        webhookService
          .procesarEventoStripeSeguro(
            concurrentEvent,
          ),
      ]);

    const primaryResults =
      concurrentResults.filter(
        (result) =>
          result.duplicado ===
          false,
      );

    const duplicateResults =
      concurrentResults.filter(
        (result) =>
          result.duplicado ===
          true,
      );

    assert.equal(
      primaryResults.length,
      1,
      "Solo una entrega debe procesar el evento.",
    );

    assert.equal(
      duplicateResults.length,
      1,
      "La segunda entrega debe clasificarse como duplicada.",
    );

    assert.equal(
      primaryResults[0].accion,
      "pedido_pagado",
    );

    assert.equal(
      duplicateResults[0].accion,
      "sin_cambios",
    );

    const concurrentStored =
      await getStoredOrder(
        concurrentOrder
          .pedidoDocumentId,
      );

    assert.equal(
      concurrentStored.estado,
      "Pagado",
    );

    assert.equal(
      concurrentStored
        .stripe_payment_intent_id,
      concurrentPaymentIntentId,
    );

    const concurrentRecord =
      await getEventRecord(
        concurrentEvent.id,
      );

    assert.equal(
      concurrentRecord.procesado,
      true,
    );

    assert.equal(
      concurrentRecord.intentos,
      1,
      "La entrega duplicada no debe crear otro intento.",
    );

    assert.equal(
      concurrentRecord.error,
      null,
    );

    console.log(
      "OK WEBHOOK 9: concurrencia local serializada",
    );

    console.log(
      "\nRESULTADO: CICLO DE VIDA DEL WEBHOOK SUPERADO",
    );

    console.log(
      "No se ha realizado ninguna conexión ni cobro real con Stripe.",
    );
  } catch (error) {
    exitCode = 1;

    console.error(
      "\nFALLO EN CICLO DE VIDA DEL WEBHOOK:",
      error,
    );

    console.error(
      error?.stack ?? "",
    );
  } finally {
    try {
      for (
        const eventId of
        createdEventIds
      ) {
        await deleteEventByStripeId(
          eventId,
        );
      }

      for (
        const orderDocumentId of
        Array.from(
          createdOrderIds,
        ).reverse()
      ) {
        await deleteOrder(
          orderDocumentId,
        );
      }

      for (
        const orderDocumentId of
        createdOrderIds
      ) {
        const remaining =
          await strapi.db
            .query(PEDIDO_UID)
            .findOne({
              where: {
                documentId:
                  orderDocumentId,
              },

              select: ["id"],
            });

        assert.equal(
          remaining,
          null,
          `No se eliminó el pedido técnico ${orderDocumentId}.`,
        );
      }

      console.log(
        "Limpieza: pedidos y eventos técnicos eliminados.",
      );
    } catch (cleanupError) {
      exitCode = 1;

      console.error(
        "\nFALLO EN LA LIMPIEZA DEL WEBHOOK:",
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
