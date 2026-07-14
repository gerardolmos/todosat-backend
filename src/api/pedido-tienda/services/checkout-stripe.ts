import type { Core } from "@strapi/strapi";
import type Stripe from "stripe";

import {
  getStripeCheckoutConfig,
  getStripeClient,
} from "../../../utils/stripe";

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const MIN_STRIPE_WINDOW_MS =
  31 * 60 * 1000;

const MAX_STRIPE_WINDOW_MS =
  24 * 60 * 60 * 1000;

interface LineaPedidoStripe {
  producto_document_id: string;
  sku: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario_centimos: number;
  subtotal_centimos: number;
  impuestos_centimos: number;
  total_centimos: number;
  moneda: "EUR";
}

interface PedidoStripeInterno {
  documentId: string;
  numero_pedido: string;
  estado: string;
  moneda: "EUR";
  subtotal_centimos: number;
  impuestos_centimos: number;
  envio_centimos: number;
  total_centimos: number;
  caduca_en: string;
  stripe_checkout_session_id?: string | null;
  lineas_pedido_tienda?: LineaPedidoStripe[];
}

export interface ResultadoSesionCheckout {
  pedidoDocumentId: string;
  numeroPedido: string;
  stripeCheckoutSessionId: string;
  checkoutUrl: string;
  totalCentimos: number;
  moneda: "EUR";
  caducaEn: string;
  reutilizada: boolean;
}

export class StripeCheckoutOrderError
  extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
  ) {
    super(message);
    this.name =
      "StripeCheckoutOrderError";
    this.code = code;
    this.status = status;
  }
}

function normalizeDocumentId(
  value: unknown,
): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > 255
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_DOCUMENT_ID_INVALID",
      "El identificador del pedido no es válido.",
    );
  }

  return value.trim();
}

function validateStoredOrder(
  order: PedidoStripeInterno | null,
): asserts order is PedidoStripeInterno {
  if (!order) {
    throw new StripeCheckoutOrderError(
      "ORDER_NOT_FOUND",
      "El pedido no existe.",
      404,
    );
  }

  if (
    order.estado !==
    "Pendiente de pago"
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_NOT_PENDING",
      "El pedido ya no está pendiente de pago.",
      409,
    );
  }

  if (order.moneda !== "EUR") {
    throw new StripeCheckoutOrderError(
      "ORDER_CURRENCY_INVALID",
      "La moneda del pedido no es válida.",
      500,
    );
  }

  if (
    !Number.isSafeInteger(
      order.subtotal_centimos,
    ) ||
    !Number.isSafeInteger(
      order.impuestos_centimos,
    ) ||
    !Number.isSafeInteger(
      order.envio_centimos,
    ) ||
    !Number.isSafeInteger(
      order.total_centimos,
    ) ||
    order.total_centimos <= 0
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_TOTAL_INVALID",
      "Los importes guardados del pedido no son válidos.",
      500,
    );
  }

  /*
   * En esta fase todavía no existen
   * reglas definitivas de impuestos
   * ni de portes.
   */
  if (
    order.impuestos_centimos !== 0 ||
    order.envio_centimos !== 0 ||
    order.total_centimos !==
      order.subtotal_centimos
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_PRICING_NOT_READY",
      "El cálculo fiscal o logístico del pedido todavía no está preparado.",
      409,
    );
  }

  const lines =
    order.lineas_pedido_tienda ?? [];

  if (lines.length === 0) {
    throw new StripeCheckoutOrderError(
      "ORDER_LINES_MISSING",
      "El pedido no contiene líneas de producto.",
      500,
    );
  }

  let calculatedSubtotal = 0;

  for (const line of lines) {
    if (
      !line.sku?.trim() ||
      !line.nombre_producto?.trim() ||
      !line.producto_document_id?.trim() ||
      !Number.isSafeInteger(
        line.cantidad,
      ) ||
      line.cantidad < 1 ||
      line.cantidad > 20 ||
      !Number.isSafeInteger(
        line.precio_unitario_centimos,
      ) ||
      line.precio_unitario_centimos <= 0 ||
      line.moneda !== "EUR"
    ) {
      throw new StripeCheckoutOrderError(
        "ORDER_LINE_INVALID",
        "Una línea guardada del pedido no es válida.",
        500,
      );
    }

    const expectedSubtotal =
      line.precio_unitario_centimos *
      line.cantidad;

    if (
      !Number.isSafeInteger(
        expectedSubtotal,
      ) ||
      line.subtotal_centimos !==
        expectedSubtotal ||
      line.impuestos_centimos !== 0 ||
      line.total_centimos !==
        expectedSubtotal
    ) {
      throw new StripeCheckoutOrderError(
        "ORDER_LINE_TOTAL_INVALID",
        "Los importes de una línea no coinciden.",
        500,
      );
    }

    calculatedSubtotal +=
      expectedSubtotal;
  }

  if (
    !Number.isSafeInteger(
      calculatedSubtotal,
    ) ||
    calculatedSubtotal !==
      order.subtotal_centimos
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_TOTAL_MISMATCH",
      "El total del pedido no coincide con sus líneas.",
      500,
    );
  }

  const expiryTime =
    new Date(order.caduca_en).getTime();

  const now = Date.now();

  if (
    !Number.isFinite(expiryTime) ||
    expiryTime - now <
      MIN_STRIPE_WINDOW_MS
  ) {
    throw new StripeCheckoutOrderError(
      "ORDER_CHECKOUT_WINDOW_INVALID",
      "El pedido está caducado o no dispone de tiempo suficiente para iniciar el pago.",
      409,
    );
  }
}

function validateStripeSession(
  session: Stripe.Checkout.Session,
  order: PedidoStripeInterno,
) {
  if (
    session.client_reference_id !==
      order.numero_pedido ||
    session.metadata
      ?.pedido_document_id !==
      order.documentId ||
    session.metadata
      ?.numero_pedido !==
      order.numero_pedido
  ) {
    throw new StripeCheckoutOrderError(
      "STRIPE_SESSION_MISMATCH",
      "La sesión de Stripe no corresponde al pedido.",
      500,
    );
  }

  if (
    session.amount_total !== null &&
    session.amount_total !==
      order.total_centimos
  ) {
    throw new StripeCheckoutOrderError(
      "STRIPE_AMOUNT_MISMATCH",
      "El importe de Stripe no coincide con el pedido.",
      500,
    );
  }

  if (
    session.currency &&
    session.currency !== "eur"
  ) {
    throw new StripeCheckoutOrderError(
      "STRIPE_CURRENCY_MISMATCH",
      "La moneda de Stripe no coincide con el pedido.",
      500,
    );
  }
}

export async function
crearSesionCheckoutStripeInterna({
  strapi,
  pedidoDocumentId,
  stripeClient,
}: {
  strapi: Core.Strapi;
  pedidoDocumentId: unknown;
  stripeClient?: Stripe;
}): Promise<ResultadoSesionCheckout> {
  const documentId =
    normalizeDocumentId(
      pedidoDocumentId,
    );

  /*
   * Los datos del pedido y sus líneas son
   * privados. La Query Engine se utiliza
   * exclusivamente dentro del backend para
   * recuperarlos sin hacerlos públicos en
   * REST ni en el Document Service.
   */
  const storedOrder =
    await strapi.db
      .query(PEDIDO_TIENDA_UID)
      .findOne({
        where: {
          documentId,
        },

        select: [
          "numero_pedido",
          "estado",
          "moneda",
          "subtotal_centimos",
          "impuestos_centimos",
          "envio_centimos",
          "total_centimos",
          "caduca_en",
          "stripe_checkout_session_id",
        ],

        populate: {
          lineas_pedido_tienda: {
            select: [
              "producto_document_id",
              "sku",
              "nombre_producto",
              "cantidad",
              "precio_unitario_centimos",
              "subtotal_centimos",
              "impuestos_centimos",
              "total_centimos",
              "moneda",
            ],
          },
        },
      });

  const order = storedOrder
    ? ({
        ...storedOrder,
        documentId,
      } as unknown as PedidoStripeInterno)
    : null;

  validateStoredOrder(order);

  const stripe =
    stripeClient ??
    getStripeClient();

  if (
    order.stripe_checkout_session_id
  ) {
    const existingSession =
      await stripe.checkout.sessions.retrieve(
        order.stripe_checkout_session_id,
      );

    validateStripeSession(
      existingSession,
      order,
    );

    if (
      existingSession.status !==
        "open" ||
      !existingSession.url
    ) {
      throw new StripeCheckoutOrderError(
        "STRIPE_SESSION_NOT_OPEN",
        "La sesión de pago ya no está disponible.",
        409,
      );
    }

    return {
      pedidoDocumentId:
        order.documentId,
      numeroPedido:
        order.numero_pedido,
      stripeCheckoutSessionId:
        existingSession.id,
      checkoutUrl:
        existingSession.url,
      totalCentimos:
        order.total_centimos,
      moneda: "EUR",
      caducaEn:
        order.caduca_en,
      reutilizada: true,
    };
  }

  const checkoutConfig =
    getStripeCheckoutConfig();

  const expiryTime =
    new Date(
      order.caduca_en,
    ).getTime();

  const expiresAt = Math.floor(
    Math.min(
      expiryTime,
      Date.now() +
        MAX_STRIPE_WINDOW_MS,
    ) / 1000,
  );

  const metadata = {
    pedido_document_id:
      order.documentId,
    numero_pedido:
      order.numero_pedido,
  };

  const session =
    await stripe.checkout.sessions.create(
      {
        mode: "payment",

        client_reference_id:
          order.numero_pedido,

        success_url:
          checkoutConfig.successUrl,

        cancel_url:
          checkoutConfig.cancelUrl,

        expires_at:
          expiresAt,

        locale: "es",

        line_items:
          order.lineas_pedido_tienda!.map(
            (line) => ({
              quantity:
                line.cantidad,

              price_data: {
                currency: "eur",

                unit_amount:
                  line
                    .precio_unitario_centimos,

                product_data: {
                  name:
                    line
                      .nombre_producto,

                  metadata: {
                    sku:
                      line.sku,

                    producto_document_id:
                      line
                        .producto_document_id,
                  },
                },
              },
            }),
          ),

        metadata,

        payment_intent_data: {
          metadata,
        },
      },
      {
        /*
         * No contiene email, nombre,
         * dirección ni ningún otro dato
         * personal.
         */
        idempotencyKey:
          `checkout:${order.documentId}`,
      },
    );

  validateStripeSession(
    session,
    order,
  );

  if (
    !session.id ||
    !session.url ||
    session.status !== "open"
  ) {
    throw new StripeCheckoutOrderError(
      "STRIPE_SESSION_INVALID",
      "Stripe no ha devuelto una sesión de pago válida.",
      502,
    );
  }

  if (
    checkoutConfig.mode === "test" &&
    !session.id.startsWith(
      "cs_test_",
    )
  ) {
    throw new StripeCheckoutOrderError(
      "STRIPE_TEST_SESSION_REQUIRED",
      "La sesión creada no pertenece al modo de prueba.",
      500,
    );
  }

  await strapi
    .documents(
      PEDIDO_TIENDA_UID,
    )
    .update({
      documentId:
        order.documentId,

      data: {
        stripe_checkout_session_id:
          session.id,
      },
    });

  return {
    pedidoDocumentId:
      order.documentId,
    numeroPedido:
      order.numero_pedido,
    stripeCheckoutSessionId:
      session.id,
    checkoutUrl:
      session.url,
    totalCentimos:
      order.total_centimos,
    moneda: "EUR",
    caducaEn:
      order.caduca_en,
    reutilizada: false,
  };
}
