import { factories } from "@strapi/strapi";

import {
  createLocalRateLimit,
} from "../../../utils/rate-limit-local";

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const DEFAULT_RATE_LIMIT_MAX = 10;
const DEFAULT_RATE_LIMIT_WINDOW_MS =
  5 * 60 * 1000;

interface CheckoutRequestBody {
  items?: unknown;
}




function isCheckoutPublicEnabled(): boolean {
  return (
    process.env.CHECKOUT_PUBLIC_ENABLED ===
    "true"
  );
}

function validateLiveModeIsBlocked() {
  const stripeMode =
    process.env.STRIPE_MODE?.trim() ||
    "test";

  if (stripeMode !== "live") {
    return;
  }

  const productionReady =
    process.env.NODE_ENV ===
      "production" &&
    process.env.CHECKOUT_LIVE_ENABLED ===
      "true";

  if (!productionReady) {
    const error = new Error(
      "El checkout real está bloqueado.",
    ) as Error & {
      code: string;
      status: number;
    };

    error.code =
      "LIVE_CHECKOUT_BLOCKED";

    error.status = 503;

    throw error;
  }
}

const applyRateLimit =
  createLocalRateLimit({
    name: "checkout",
    maxRequestsEnv:
      "CHECKOUT_RATE_LIMIT_MAX",
    windowMsEnv:
      "CHECKOUT_RATE_LIMIT_WINDOW_MS",
    defaultMaxRequests:
      DEFAULT_RATE_LIMIT_MAX,
    defaultWindowMs:
      DEFAULT_RATE_LIMIT_WINDOW_MS,
  });

function safeErrorCode(
  error: unknown,
): string {
  const code = (
    error as {
      code?: unknown;
    }
  )?.code;

  if (
    typeof code === "string" &&
    /^[A-Z0-9_]{3,80}$/.test(code)
  ) {
    return code;
  }

  return "CHECKOUT_INTERNAL_ERROR";
}

function safeErrorStatus(
  error: unknown,
): number {
  const status = (
    error as {
      status?: unknown;
    }
  )?.status;

  if (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= 400 &&
    status < 500
  ) {
    return status;
  }

  if (status === 503) {
    return 503;
  }

  return 500;
}

export default factories.createCoreController(
  PEDIDO_TIENDA_UID,
  ({ strapi }) => ({
    async crearCheckout(ctx) {
      ctx.set(
        "Cache-Control",
        "no-store",
      );

      if (
        !isCheckoutPublicEnabled()
      ) {
        ctx.status = 503;

        ctx.body = {
          checkoutCreado: false,
          codigo:
            "CHECKOUT_DISABLED",
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
          checkoutCreado: false,
          codigo:
            "CONTENT_TYPE_INVALID",
        };

        return;
      }

      if (
        !applyRateLimit(ctx)
      ) {
        ctx.status = 429;

        ctx.body = {
          checkoutCreado: false,
          codigo:
            "RATE_LIMIT_EXCEEDED",
        };

        return;
      }

      const idempotencyKey =
        ctx.get(
          "idempotency-key",
        );

      if (!idempotencyKey) {
        ctx.status = 400;

        ctx.body = {
          checkoutCreado: false,
          codigo:
            "IDEMPOTENCY_KEY_REQUIRED",
        };

        return;
      }

      const body =
        ctx.request.body as
          | CheckoutRequestBody
          | undefined;

      try {
        validateLiveModeIsBlocked();

        const service =
          strapi.service(
            PEDIDO_TIENDA_UID,
          ) as unknown as {
            crearPedidoProvisionalSeguro(
              items: unknown,
              idempotencyKey: string,
            ): Promise<{
              pedidoDocumentId: string;
              reutilizado: boolean;
            }>;

            crearSesionCheckoutStripeSegura(
              pedidoDocumentId: string,
            ): Promise<{
              numeroPedido: string;
              checkoutUrl: string;
              totalCentimos: number;
              moneda: "EUR";
              caducaEn: string;
              reutilizada: boolean;
            }>;
          };

        const provisional =
          await service
            .crearPedidoProvisionalSeguro(
              body?.items,
              idempotencyKey,
            );

        const checkout =
          await service
            .crearSesionCheckoutStripeSegura(
              provisional
                .pedidoDocumentId,
            );

        ctx.status =
          provisional.reutilizado ||
          checkout.reutilizada
            ? 200
            : 201;

        ctx.body = {
          checkoutCreado: true,

          numeroPedido:
            checkout.numeroPedido,

          checkoutUrl:
            checkout.checkoutUrl,

          totalCentimos:
            checkout.totalCentimos,

          moneda:
            checkout.moneda,

          caducaEn:
            checkout.caducaEn,

          reutilizado:
            provisional.reutilizado ||
            checkout.reutilizada,
        };
      } catch (error) {
        const status =
          safeErrorStatus(error);

        const code =
          safeErrorCode(error);

        strapi.log[
          status >= 500
            ? "error"
            : "warn"
        ](
          `Checkout rechazado: ${code}`,
        );

        ctx.status = status;

        ctx.body = {
          checkoutCreado: false,

          codigo:
            status >= 500
              ? "CHECKOUT_INTERNAL_ERROR"
              : code,
        };
      }
    },
  }),
);
