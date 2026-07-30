import { factories } from "@strapi/strapi";

import {
  createLocalRateLimit,
} from "../../../utils/rate-limit-local";

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const DEFAULT_RATE_LIMIT_MAX = 30;
const DEFAULT_RATE_LIMIT_WINDOW_MS =
  5 * 60 * 1000;

interface ValidationRequestBody {
  items?: unknown;
}

interface PublicValidatedLine {
  documentId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitarioCentimos: number;
  subtotalCentimos: number;
  moneda: "EUR";
  requiereEnvio: boolean;
}

interface PublicValidatedCart {
  lineas: PublicValidatedLine[];
  cantidadTotal: number;
  subtotalProductosCentimos: number;
  moneda: "EUR";
  requiereEnvio: boolean;
}




function isValidationEnabled() {
  return (
    process.env
      .CART_VALIDATION_PUBLIC_ENABLED ===
    "true"
  );
}

const applyRateLimit =
  createLocalRateLimit({
    name: "cart-validation",
    maxRequestsEnv:
      "CART_VALIDATION_RATE_LIMIT_MAX",
    windowMsEnv:
      "CART_VALIDATION_RATE_LIMIT_WINDOW_MS",
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

  return "CART_VALIDATION_INTERNAL_ERROR";
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

  return 500;
}

export default factories.createCoreController(
  PEDIDO_TIENDA_UID,
  ({ strapi }) => ({
    async validarCarrito(ctx) {
      ctx.set(
        "Cache-Control",
        "no-store",
      );

      if (!isValidationEnabled()) {
        ctx.status = 503;

        ctx.body = {
          carritoValidado: false,
          codigo:
            "CART_VALIDATION_DISABLED",
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
          carritoValidado: false,
          codigo:
            "CONTENT_TYPE_INVALID",
        };

        return;
      }

      if (!applyRateLimit(ctx)) {
        ctx.status = 429;

        ctx.body = {
          carritoValidado: false,
          codigo:
            "RATE_LIMIT_EXCEEDED",
        };

        return;
      }

      const body =
        ctx.request.body as
          | ValidationRequestBody
          | undefined;

      try {
        const service =
          strapi.service(
            PEDIDO_TIENDA_UID,
          ) as unknown as {
            reconstruirCarritoSeguro(
              items: unknown,
            ): Promise<{
              lineas: Array<{
                productoDocumentId:
                  string;
                sku: string;
                nombreProducto: string;
                cantidad: number;
                precioUnitarioCentimos:
                  number;
                subtotalCentimos:
                  number;
                moneda: "EUR";
                requiereEnvio:
                  boolean;
              }>;
              cantidadTotal: number;
              subtotalProductosCentimos:
                number;
              moneda: "EUR";
              requiereEnvio: boolean;
            }>;
          };

        const validated =
          await service
            .reconstruirCarritoSeguro(
              body?.items,
            );

        const publicCart:
          PublicValidatedCart = {
          lineas:
            validated.lineas.map(
              (line) => ({
                documentId:
                  line
                    .productoDocumentId,

                sku:
                  line.sku,

                nombre:
                  line
                    .nombreProducto,

                cantidad:
                  line.cantidad,

                precioUnitarioCentimos:
                  line
                    .precioUnitarioCentimos,

                subtotalCentimos:
                  line
                    .subtotalCentimos,

                moneda:
                  line.moneda,

                requiereEnvio:
                  line
                    .requiereEnvio,
              }),
            ),

          cantidadTotal:
            validated.cantidadTotal,

          subtotalProductosCentimos:
            validated
              .subtotalProductosCentimos,

          moneda:
            validated.moneda,

          requiereEnvio:
            validated.requiereEnvio,
        };

        ctx.status = 200;

        ctx.body = {
          carritoValidado: true,
          ...publicCart,

          /*
           * Recordatorio explícito:
           * validar el carrito no habilita
           * ni inicia ningún pago.
           */
          pagosRealesBloqueados: true,
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
          `Validación de carrito rechazada: ${code}`,
        );

        ctx.status = status;

        ctx.body = {
          carritoValidado: false,

          codigo:
            status >= 500
              ? "CART_VALIDATION_INTERNAL_ERROR"
              : code,
        };
      }
    },
  }),
);
