import { factories } from "@strapi/strapi";
import type Stripe from "stripe";

import {
  getStripeClient,
  getStripeWebhookSecret,
} from "../../../utils/stripe";

const EVENTO_STRIPE_TIENDA_UID =
  "api::evento-stripe-tienda.evento-stripe-tienda" as const;

const MAX_WEBHOOK_BODY_BYTES =
  512 * 1024;

interface RequestWithRawBody {
  rawBody?: Buffer | string;
  body?: unknown;
}

function getRawBody(
  request: RequestWithRawBody,
): Buffer | string | null {
  if (
    Buffer.isBuffer(
      request.rawBody,
    ) ||
    typeof request.rawBody ===
      "string"
  ) {
    return request.rawBody;
  }

  const body = request.body;

  if (
    typeof body !== "object" ||
    body === null
  ) {
    return null;
  }

  /*
   * koa-body 6 conserva el cuerpo original
   * mediante un símbolo. Versiones posteriores
   * utilizan request.rawBody. Admitimos ambos.
   */
  for (
    const symbol of
    Object.getOwnPropertySymbols(
      body,
    )
  ) {
    const value = (
      body as Record<
        symbol,
        unknown
      >
    )[symbol];

    if (
      Buffer.isBuffer(value) ||
      typeof value === "string"
    ) {
      return value;
    }
  }

  return null;
}

export default factories.createCoreController(
  EVENTO_STRIPE_TIENDA_UID,
  ({ strapi }) => ({
    async recibir(ctx) {
      if (
        !ctx.is(
          "application/json",
        )
      ) {
        ctx.status = 415;
        ctx.body = {
          recibido: false,
        };
        return;
      }

      const signature =
        ctx.get(
          "stripe-signature",
        );

      if (!signature) {
        ctx.status = 400;
        ctx.body = {
          recibido: false,
        };
        return;
      }

      const rawBody =
        getRawBody(
          ctx.request as
            RequestWithRawBody,
        );

      if (!rawBody) {
        strapi.log.error(
          "Webhook Stripe rechazado: falta el cuerpo original",
        );

        ctx.status = 500;
        ctx.body = {
          recibido: false,
        };
        return;
      }

      const bodySize =
        typeof rawBody === "string"
          ? Buffer.byteLength(
              rawBody,
              "utf8",
            )
          : rawBody.length;

      if (
        bodySize >
        MAX_WEBHOOK_BODY_BYTES
      ) {
        ctx.status = 413;
        ctx.body = {
          recibido: false,
        };
        return;
      }

      let event: Stripe.Event;

      try {
        event =
          getStripeClient()
            .webhooks
            .constructEvent(
              rawBody,
              signature,
              getStripeWebhookSecret(),
            );
      } catch {
        /*
         * No exponemos detalles sobre la firma,
         * el cuerpo ni los secretos utilizados.
         */
        strapi.log.warn(
          "Webhook Stripe rechazado por firma inválida",
        );

        ctx.status = 400;
        ctx.body = {
          recibido: false,
        };
        return;
      }

      try {
        const service =
          strapi.service(
            EVENTO_STRIPE_TIENDA_UID,
          ) as unknown as {
            procesarEventoStripeSeguro(
              event: Stripe.Event,
            ): Promise<{
              ignorado: boolean;
              duplicado: boolean;
              accion: string;
            }>;
          };

        const result =
          await service
            .procesarEventoStripeSeguro(
              event,
            );

        ctx.status = 200;
        ctx.body = {
          recibido: true,
          ignorado:
            result.ignorado,
          duplicado:
            result.duplicado,
          accion:
            result.accion,
        };
      } catch (error) {
        const status =
          typeof (
            error as {
              status?: unknown;
            }
          )?.status ===
            "number"
            ? (
                error as {
                  status: number;
                }
              ).status
            : 500;

        strapi.log.error(
          `Webhook Stripe no procesado: ${
            (
              error as {
                code?: string;
              }
            )?.code ??
            "INTERNAL_ERROR"
          }`,
        );

        ctx.status =
          status >= 400 &&
          status < 500
            ? status
            : 500;

        ctx.body = {
          recibido: false,
        };
      }
    },
  }),
);
