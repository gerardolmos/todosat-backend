import type { Core } from "@strapi/strapi";
import type Stripe from "stripe";

import {
  getStripeCheckoutConfig,
} from "../../../utils/stripe";

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const EVENTO_STRIPE_TIENDA_UID =
  "api::evento-stripe-tienda.evento-stripe-tienda" as const;

const eventosStripeEnProceso =
  new Map<
    string,
    Promise<ResultadoWebhookStripe>
  >();

const SUPPORTED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

interface PedidoWebhookInterno {
  id: number;
  documentId: string;
  numero_pedido: string;
  estado: string;
  moneda: "EUR";
  total_centimos: number;
  stripe_checkout_session_id:
    | string
    | null;
  stripe_payment_intent_id:
    | string
    | null;
}

interface EventoWebhookInterno {
  id: number;
  stripe_event_id: string;
  procesado: boolean;
  intentos: number;
}

export interface ResultadoWebhookStripe {
  eventId: string;
  tipoEvento: string;
  ignorado: boolean;
  duplicado: boolean;
  accion:
    | "ignorado"
    | "esperando_pago"
    | "pedido_pagado"
    | "pedido_ya_pagado"
    | "pago_fallido"
    | "sesion_caducada"
    | "sin_cambios";
}

export class StripeWebhookProcessingError
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
      "StripeWebhookProcessingError";
    this.code = code;
    this.status = status;
  }
}

function getPaymentIntentId(
  session: Stripe.Checkout.Session,
): string | null {
  if (
    typeof session.payment_intent ===
    "string"
  ) {
    return session.payment_intent;
  }

  if (
    session.payment_intent &&
    typeof session.payment_intent ===
      "object"
  ) {
    return session.payment_intent.id;
  }

  return null;
}

function validateMode(
  event: Stripe.Event,
) {
  const expectedLiveMode =
    getStripeCheckoutConfig().mode ===
    "live";

  if (
    event.livemode !==
    expectedLiveMode
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_EVENT_MODE_MISMATCH",
      "El modo del evento no coincide con la configuración del servidor.",
      400,
    );
  }
}

function validateSessionAgainstOrder(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  order: PedidoWebhookInterno,
) {
  if (
    session.livemode !==
    event.livemode
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_SESSION_MODE_MISMATCH",
      "El modo de la sesión no coincide con el evento.",
      400,
    );
  }

  if (
    session.mode !== "payment"
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_SESSION_MODE_INVALID",
      "La sesión no es un pago único.",
      400,
    );
  }

  if (
    session.id !==
    order.stripe_checkout_session_id
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_SESSION_ID_MISMATCH",
      "La sesión no corresponde al pedido.",
      400,
    );
  }

  if (
    session.client_reference_id !==
      order.numero_pedido ||
    session.metadata
      ?.numero_pedido !==
      order.numero_pedido ||
    session.metadata
      ?.pedido_document_id !==
      order.documentId
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_ORDER_REFERENCE_MISMATCH",
      "Las referencias de Stripe no corresponden al pedido.",
      400,
    );
  }

  if (
    session.currency !== "eur" ||
    order.moneda !== "EUR"
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_CURRENCY_MISMATCH",
      "La moneda de Stripe no coincide con el pedido.",
      400,
    );
  }

  if (
    session.amount_total !==
    order.total_centimos
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_AMOUNT_MISMATCH",
      "El importe de Stripe no coincide con el pedido.",
      400,
    );
  }
}

function summarizeError(
  error: unknown,
): string {
  if (
    error instanceof
    StripeWebhookProcessingError
  ) {
    return `${error.code}: ${error.message}`
      .slice(0, 1000);
  }

  return "INTERNAL_WEBHOOK_ERROR";
}

async function getOrCreateEventRecord(
  strapi: Core.Strapi,
  event: Stripe.Event,
): Promise<EventoWebhookInterno> {
  const query = strapi.db.query(
    EVENTO_STRIPE_TIENDA_UID,
  );

  const existing =
    await query.findOne({
      where: {
        stripe_event_id:
          event.id,
      },

      select: [
        "id",
        "stripe_event_id",
        "procesado",
        "intentos",
      ],
    });

  if (existing) {
    return existing as
      EventoWebhookInterno;
  }

  try {
    return (
      await query.create({
        data: {
          stripe_event_id:
            event.id,

          tipo_evento:
            event.type,

          modo_live:
            event.livemode,

          procesado: false,

          recibido_en:
            new Date().toISOString(),

          intentos: 0,
        } as never,
      })
    ) as EventoWebhookInterno;
  } catch (error) {
    /*
     * Dos entregas simultáneas del mismo
     * evento pueden competir por la clave
     * única. En ese caso recuperamos el
     * registro creado por la otra petición.
     */
    const concurrent =
      await query.findOne({
        where: {
          stripe_event_id:
            event.id,
        },

        select: [
        "id",
        "stripe_event_id",
          "procesado",
          "intentos",
        ],
      });

    if (concurrent) {
      return concurrent as
        EventoWebhookInterno;
    }

    throw error;
  }
}

export async function
procesarEventoStripeSeguro({
  strapi,
  event,
}: {
  strapi: Core.Strapi;
  event: Stripe.Event;
}): Promise<ResultadoWebhookStripe> {
  /*
   * Dos peticiones concurrentes dentro de la
   * misma instancia comparten la promesa del
   * primer procesamiento. La segunda espera
   * su resultado y se clasifica como duplicada
   * sin repetir efectos ni intentos.
   */
  const processing =
    eventosStripeEnProceso.get(
      event.id,
    );

  if (processing) {
    await processing;

    return {
      eventId: event.id,
      tipoEvento: event.type,
      ignorado: false,
      duplicado: true,
      accion: "sin_cambios",
    };
  }

  const currentProcessing =
    procesarEventoStripeSinBloqueo({
      strapi,
      event,
    });

  eventosStripeEnProceso.set(
    event.id,
    currentProcessing,
  );

  try {
    return await currentProcessing;
  } finally {
    if (
      eventosStripeEnProceso.get(
        event.id,
      ) === currentProcessing
    ) {
      eventosStripeEnProceso.delete(
        event.id,
      );
    }
  }
}

async function
procesarEventoStripeSinBloqueo({
  strapi,
  event,
}: {
  strapi: Core.Strapi;
  event: Stripe.Event;
}): Promise<ResultadoWebhookStripe> {
  validateMode(event);

  if (
    !SUPPORTED_EVENT_TYPES.has(
      event.type,
    )
  ) {
    return {
      eventId: event.id,
      tipoEvento: event.type,
      ignorado: true,
      duplicado: false,
      accion: "ignorado",
    };
  }

  const session =
    event.data
      .object as
      Stripe.Checkout.Session;

  const orderDocumentId =
    session.metadata
      ?.pedido_document_id;

  if (
    typeof orderDocumentId !==
      "string" ||
    !orderDocumentId.trim()
  ) {
    throw new StripeWebhookProcessingError(
      "STRIPE_ORDER_METADATA_MISSING",
      "El evento no contiene la referencia interna del pedido.",
      400,
    );
  }

  const eventRecord =
    await getOrCreateEventRecord(
      strapi,
      event,
    );

  if (eventRecord.procesado) {
    return {
      eventId: event.id,
      tipoEvento: event.type,
      ignorado: false,
      duplicado: true,
      accion: "sin_cambios",
    };
  }

  const attemptNumber =
    Number(
      eventRecord.intentos ?? 0,
    ) + 1;

  try {
    return await strapi.db.transaction(
      async () => {
        const order =
          (await strapi.db
            .query(
              PEDIDO_TIENDA_UID,
            )
            .findOne({
              where: {
                documentId:
                  orderDocumentId,
              },

              select: [
                "id",
                "documentId",
                "numero_pedido",
                "estado",
                "moneda",
                "total_centimos",
                "stripe_checkout_session_id",
                "stripe_payment_intent_id",
              ],
            })) as
            | PedidoWebhookInterno
            | null;

        if (!order) {
          throw new StripeWebhookProcessingError(
            "ORDER_NOT_FOUND",
            "El pedido asociado al evento no existe.",
            404,
          );
        }

        validateSessionAgainstOrder(
          event,
          session,
          order,
        );

        const orderUpdates:
          Record<string, unknown> = {};

        let action:
          ResultadoWebhookStripe["accion"] =
            "sin_cambios";

        if (
          event.type ===
            "checkout.session.completed" ||
          event.type ===
            "checkout.session.async_payment_succeeded"
        ) {
          if (
            session.payment_status !==
            "paid"
          ) {
            if (
              event.type ===
              "checkout.session.async_payment_succeeded"
            ) {
              throw new StripeWebhookProcessingError(
                "STRIPE_PAYMENT_NOT_PAID",
                "Stripe ha enviado un éxito diferido sin pago confirmado.",
                400,
              );
            }

            action =
              "esperando_pago";
          } else {
            const paymentIntentId =
              getPaymentIntentId(
                session,
              );

            if (!paymentIntentId) {
              throw new StripeWebhookProcessingError(
                "STRIPE_PAYMENT_INTENT_MISSING",
                "El pago confirmado no contiene PaymentIntent.",
                400,
              );
            }

            if (
              order.estado ===
              "Pagado"
            ) {
              if (
                order
                  .stripe_payment_intent_id &&
                order
                  .stripe_payment_intent_id !==
                  paymentIntentId
              ) {
                throw new StripeWebhookProcessingError(
                  "STRIPE_PAYMENT_INTENT_MISMATCH",
                  "El pedido ya está asociado a otro pago.",
                  409,
                );
              }

              action =
                "pedido_ya_pagado";
            } else {
              if (
                order.estado !==
                "Pendiente de pago"
              ) {
                throw new StripeWebhookProcessingError(
                  "ORDER_STATE_INVALID_FOR_PAYMENT",
                  "El pedido no admite una confirmación de pago.",
                  409,
                );
              }

              orderUpdates.estado =
                "Pagado";

              orderUpdates
                .stripe_payment_intent_id =
                paymentIntentId;

              orderUpdates.fecha_pago =
                new Date(
                  event.created * 1000,
                ).toISOString();

              action =
                "pedido_pagado";
            }
          }
        }

        if (
          event.type ===
          "checkout.session.async_payment_failed"
        ) {
          if (
            order.estado ===
            "Pendiente de pago"
          ) {
            orderUpdates.estado =
              "Pago fallido";

            action =
              "pago_fallido";
          }
        }

        if (
          event.type ===
          "checkout.session.expired"
        ) {
          if (
            order.estado ===
            "Pendiente de pago"
          ) {
            orderUpdates.estado =
              "Cancelado";

            action =
              "sesion_caducada";
          }
        }

        if (
          Object.keys(
            orderUpdates,
          ).length > 0
        ) {
          await strapi.db
            .query(
              PEDIDO_TIENDA_UID,
            )
            .update({
              where: {
                id: order.id,
              },

              data:
                orderUpdates as never,
            });
        }

        await strapi.db
          .query(
            EVENTO_STRIPE_TIENDA_UID,
          )
          .update({
            where: {
              id: eventRecord.id,
            },

            data: {
              procesado: true,

              procesado_en:
                new Date()
                  .toISOString(),

              intentos:
                attemptNumber,

              error: null,

              pedido_tienda:
                order.id,
            } as never,
          });

        return {
          eventId: event.id,
          tipoEvento:
            event.type,
          ignorado: false,
          duplicado: false,
          accion: action,
        };
      },
    );
  } catch (error) {
    try {
      await strapi.db
        .query(
          EVENTO_STRIPE_TIENDA_UID,
        )
        .update({
          where: {
            id: eventRecord.id,
          },

          data: {
            intentos:
              attemptNumber,

            error:
              summarizeError(
                error,
              ),
          } as never,
        });
    } catch {
      /*
       * El error original debe conservarse.
       * Nunca registramos el payload completo.
       */
    }

    throw error;
  }
}
