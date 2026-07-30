import { factories } from "@strapi/strapi";

import {
  createLocalRateLimit,
} from "../../../utils/rate-limit-local";

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const DEFAULT_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_WINDOW_MS =
  5 * 60 * 1000;

interface StatusRequestBody {
  sessionId?: unknown;
}


type PublicPaymentState =
  | "pendiente"
  | "confirmado"
  | "fallido"
  | "cancelado"
  | "reembolsado"
  | "reembolso_parcial"
  | "no_disponible";

interface PublicStatus {
  estadoPago: PublicPaymentState;
  pagoConfirmado: boolean;
}



function isStatusPublicEnabled(): boolean {
  return (
    process.env
      .CHECKOUT_STATUS_PUBLIC_ENABLED ===
    "true"
  );
}

const applyRateLimit =
  createLocalRateLimit({
    name: "checkout-status",
    maxRequestsEnv:
      "CHECKOUT_STATUS_RATE_LIMIT_MAX",
    windowMsEnv:
      "CHECKOUT_STATUS_RATE_LIMIT_WINDOW_MS",
    defaultMaxRequests:
      DEFAULT_RATE_LIMIT_MAX,
    defaultWindowMs:
      DEFAULT_RATE_LIMIT_WINDOW_MS,
  });

function normalizeSessionId(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const sessionId = value.trim();

  if (
    sessionId.length < 20 ||
    sessionId.length > 255 ||
    !/^cs_(?:test|live)_[A-Za-z0-9_]+$/.test(
      sessionId,
    )
  ) {
    return null;
  }

  return sessionId;
}

function mapStoredState(
  value: unknown,
): PublicStatus {
  switch (value) {
    case "Pendiente de pago":
      return {
        estadoPago: "pendiente",
        pagoConfirmado: false,
      };

    case "Pagado":
    case "En preparación":
    case "Enviado":
    case "Entregado":
      return {
        estadoPago: "confirmado",
        pagoConfirmado: true,
      };

    case "Pago fallido":
      return {
        estadoPago: "fallido",
        pagoConfirmado: false,
      };

    case "Cancelado":
      return {
        estadoPago: "cancelado",
        pagoConfirmado: false,
      };

    case "Reembolsado":
      return {
        estadoPago: "reembolsado",
        pagoConfirmado: true,
      };

    case "Reembolso parcial":
      return {
        estadoPago:
          "reembolso_parcial",

        pagoConfirmado: true,
      };

    default:
      return {
        estadoPago: "no_disponible",
        pagoConfirmado: false,
      };
  }
}

export default factories.createCoreController(
  PEDIDO_TIENDA_UID,
  ({ strapi }) => ({
    async consultarEstado(ctx) {
      ctx.set(
        "Cache-Control",
        "no-store",
      );

      ctx.set(
        "Pragma",
        "no-cache",
      );

      if (!isStatusPublicEnabled()) {
        ctx.status = 503;

        ctx.body = {
          estadoDisponible: false,
          codigo:
            "CHECKOUT_STATUS_DISABLED",
        };

        return;
      }

      if (
        !ctx.is(
          "application/json",
        )
      ) {
        ctx.status = 415;

        ctx.body = {
          estadoDisponible: false,
          codigo:
            "CONTENT_TYPE_INVALID",
        };

        return;
      }

      if (!applyRateLimit(ctx)) {
        ctx.status = 429;

        ctx.body = {
          estadoDisponible: false,
          codigo:
            "RATE_LIMIT_EXCEEDED",
        };

        return;
      }

      const body =
        ctx.request.body as
          | StatusRequestBody
          | undefined;

      const sessionId =
        normalizeSessionId(
          body?.sessionId,
        );

      if (!sessionId) {
        ctx.status = 400;

        ctx.body = {
          estadoDisponible: false,
          codigo:
            "CHECKOUT_SESSION_INVALID",
        };

        return;
      }

      /*
       * Consulta exclusivamente la base de datos
       * local. No se realiza ninguna llamada a
       * Stripe desde este endpoint.
       */
      const storedOrder =
        await strapi.db
          .query(PEDIDO_TIENDA_UID)
          .findOne({
            where: {
              stripe_checkout_session_id:
                sessionId,
            },

            select: [
              "estado",
            ],
          }) as {
            estado?: unknown;
          } | null;

      if (!storedOrder) {
        /*
         * No diferenciamos públicamente entre
         * una referencia desconocida, expirada
         * o que todavía no ha sido procesada.
         */
        ctx.status = 200;

        ctx.body = {
          estadoDisponible: false,
          estadoPago:
            "no_disponible",

          pagoConfirmado: false,
        };

        return;
      }

      const publicStatus =
        mapStoredState(
          storedOrder.estado,
        );

      ctx.status = 200;

      ctx.body = {
        estadoDisponible:
          publicStatus.estadoPago !==
          "no_disponible",

        ...publicStatus,
      };
    },
  }),
);
