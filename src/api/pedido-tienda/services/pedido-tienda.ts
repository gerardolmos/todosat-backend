import {
  createHash,
  randomBytes,
} from "node:crypto";

import { factories } from "@strapi/strapi";

const PRODUCTO_TIENDA_UID =
  "api::producto-tienda.producto-tienda" as const;

const PEDIDO_TIENDA_UID =
  "api::pedido-tienda.pedido-tienda" as const;

const LINEA_PEDIDO_TIENDA_UID =
  "api::linea-pedido-tienda.linea-pedido-tienda" as const;

const MIN_IDEMPOTENCY_KEY_LENGTH = 20;
const MAX_IDEMPOTENCY_KEY_LENGTH = 120;
const DEFAULT_ORDER_EXPIRY_MINUTES = 30;
const MAX_ORDER_EXPIRY_MINUTES = 1440;

const MAX_LINEAS_PEDIDO = 20;
const MAX_CANTIDAD_POR_LINEA = 20;
const MAX_UNIDADES_PEDIDO = 50;
const TOTAL_MAXIMO_PREDETERMINADO_CENTIMOS =
  10_000_000;

type MonedaTienda = "EUR";

type TipoProductoTienda =
  | "Producto principal"
  | "Accesorio";

interface ItemCarritoEntrada {
  documentId: string;
  cantidad: number;
}

interface ProductoCompra {
  id: number;
  documentId: string;
  nombre: string;
  sku: string;
  referencia_proveedor: string;
  tipo_producto: TipoProductoTienda;
  precio_centimos: number | null;
  moneda: MonedaTienda;
  estado_venta:
    | "Disponible"
    | "Bajo consulta"
    | "Agotado"
    | "Próximamente"
    | "Descatalogado";
  activo: boolean;
  requiere_envio: boolean;
}

export interface LineaCarritoValidada {
  productoId: number;
  productoDocumentId: string;
  sku: string;
  referenciaProveedor: string;
  nombreProducto: string;
  tipoProducto: TipoProductoTienda;
  cantidad: number;
  precioUnitarioCentimos: number;
  subtotalCentimos: number;
  moneda: MonedaTienda;
  requiereEnvio: boolean;
}

export interface CarritoValidado {
  lineas: LineaCarritoValidada[];
  cantidadTotal: number;
  subtotalProductosCentimos: number;
  moneda: MonedaTienda;
  requiereEnvio: boolean;
}

interface PedidoTiendaInterno {
  documentId: string;
  numero_pedido: string;
  clave_idempotencia: string;
  huella_carrito: string;
  estado: string;
  moneda: MonedaTienda;
  subtotal_centimos: number;
  impuestos_centimos: number;
  envio_centimos: number;
  total_centimos: number;
  caduca_en: string;
}

interface PedidoTiendaServiceInterno {
  reconstruirCarritoSeguro(
    rawItems: unknown,
  ): Promise<CarritoValidado>;
}

export interface PedidoProvisionalSeguro {
  pedidoDocumentId: string;
  numeroPedido: string;
  estado: string;
  moneda: MonedaTienda;
  subtotalCentimos: number;
  impuestosCentimos: number;
  envioCentimos: number;
  totalCentimos: number;
  caducaEn: string;
  cantidadLineas: number;
  cantidadTotal: number;
  requiereEnvio: boolean;
  reutilizado: boolean;
}

export class CheckoutValidationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
  ) {
    super(message);
    this.name = "CheckoutValidationError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeIdempotencyKey(
  rawKey: unknown,
): string {
  if (typeof rawKey !== "string") {
    throw new CheckoutValidationError(
      "IDEMPOTENCY_KEY_INVALID",
      "La clave de idempotencia no es válida.",
    );
  }

  const key = rawKey.trim();

  if (
    key.length < MIN_IDEMPOTENCY_KEY_LENGTH ||
    key.length > MAX_IDEMPOTENCY_KEY_LENGTH ||
    !/^[A-Za-z0-9:_-]+$/.test(key)
  ) {
    throw new CheckoutValidationError(
      "IDEMPOTENCY_KEY_INVALID",
      "La clave de idempotencia no es válida.",
    );
  }

  return key;
}

function createCartFingerprint(
  items: ItemCarritoEntrada[],
): string {
  const canonicalCart = items
    .map(
      (item) =>
        `${item.documentId}:${item.cantidad}`,
    )
    .join("|");

  return createHash("sha256")
    .update(canonicalCart, "utf8")
    .digest("hex");
}

function createOrderNumber(): string {
  const now = new Date();

  const datePart = [
    now.getUTCFullYear(),
    String(
      now.getUTCMonth() + 1,
    ).padStart(2, "0"),
    String(
      now.getUTCDate(),
    ).padStart(2, "0"),
  ].join("");

  const timePart = [
    String(
      now.getUTCHours(),
    ).padStart(2, "0"),
    String(
      now.getUTCMinutes(),
    ).padStart(2, "0"),
    String(
      now.getUTCSeconds(),
    ).padStart(2, "0"),
  ].join("");

  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `TS-${datePart}-${timePart}-${randomPart}`;
}

function getOrderExpiryMinutes(): number {
  const configuredValue = Number(
    process.env
      .CHECKOUT_ORDER_EXPIRY_MINUTES,
  );

  if (
    Number.isSafeInteger(configuredValue) &&
    configuredValue >= 30 &&
    configuredValue <=
      MAX_ORDER_EXPIRY_MINUTES
  ) {
    return configuredValue;
  }

  return DEFAULT_ORDER_EXPIRY_MINUTES;
}

function createOrderExpiryDate(): string {
  const expiryDate = new Date(
    Date.now() +
      getOrderExpiryMinutes() *
        60 *
        1000,
  );

  return expiryDate.toISOString();
}

function createOrderSummary(
  order: PedidoTiendaInterno,
  cart: CarritoValidado,
  reused: boolean,
): PedidoProvisionalSeguro {
  return {
    pedidoDocumentId:
      order.documentId,
    numeroPedido:
      order.numero_pedido,
    estado: order.estado,
    moneda: order.moneda,
    subtotalCentimos:
      order.subtotal_centimos,
    impuestosCentimos:
      order.impuestos_centimos,
    envioCentimos:
      order.envio_centimos,
    totalCentimos:
      order.total_centimos,
    caducaEn: order.caduca_en,
    cantidadLineas:
      cart.lineas.length,
    cantidadTotal:
      cart.cantidadTotal,
    requiereEnvio:
      cart.requiereEnvio,
    reutilizado: reused,
  };
}

function getTotalMaximoCentimos() {
  const configuredValue = Number(
    process.env.CHECKOUT_MAX_TOTAL_CENTIMOS,
  );

  if (
    Number.isSafeInteger(configuredValue) &&
    configuredValue > 0
  ) {
    return configuredValue;
  }

  return TOTAL_MAXIMO_PREDETERMINADO_CENTIMOS;
}

function normalizeCartItems(
  rawItems: unknown,
): ItemCarritoEntrada[] {
  if (
    !Array.isArray(rawItems) ||
    rawItems.length === 0
  ) {
    throw new CheckoutValidationError(
      "CHECKOUT_ITEMS_INVALID",
      "El carrito está vacío o no es válido.",
    );
  }

  if (rawItems.length > MAX_LINEAS_PEDIDO) {
    throw new CheckoutValidationError(
      "CHECKOUT_TOO_MANY_LINES",
      "El carrito contiene demasiados productos distintos.",
    );
  }

  const quantitiesByDocumentId =
    new Map<string, number>();

  for (const rawItem of rawItems) {
    if (!isRecord(rawItem)) {
      throw new CheckoutValidationError(
        "CHECKOUT_ITEM_INVALID",
        "Uno de los productos del carrito no es válido.",
      );
    }

    const documentId =
      typeof rawItem.documentId === "string"
        ? rawItem.documentId.trim()
        : "";

    const quantity = rawItem.cantidad;

    if (
      !documentId ||
      documentId.length > 255 ||
      !Number.isInteger(quantity) ||
      Number(quantity) < 1
    ) {
      throw new CheckoutValidationError(
        "CHECKOUT_ITEM_INVALID",
        "Uno de los productos del carrito no es válido.",
      );
    }

    const previousQuantity =
      quantitiesByDocumentId.get(documentId) ?? 0;

    const combinedQuantity =
      previousQuantity + Number(quantity);

    if (
      combinedQuantity >
      MAX_CANTIDAD_POR_LINEA
    ) {
      throw new CheckoutValidationError(
        "CHECKOUT_QUANTITY_INVALID",
        "La cantidad solicitada de un producto supera el máximo permitido.",
      );
    }

    quantitiesByDocumentId.set(
      documentId,
      combinedQuantity,
    );
  }

  if (
    quantitiesByDocumentId.size >
    MAX_LINEAS_PEDIDO
  ) {
    throw new CheckoutValidationError(
      "CHECKOUT_TOO_MANY_LINES",
      "El carrito contiene demasiados productos distintos.",
    );
  }

  const normalizedItems =
    Array.from(
      quantitiesByDocumentId.entries(),
    )
      .map(([documentId, cantidad]) => ({
        documentId,
        cantidad,
      }))
      .sort((a, b) =>
        a.documentId.localeCompare(b.documentId),
      );

  const totalUnits = normalizedItems.reduce(
    (total, item) =>
      total + item.cantidad,
    0,
  );

  if (totalUnits > MAX_UNIDADES_PEDIDO) {
    throw new CheckoutValidationError(
      "CHECKOUT_TOO_MANY_UNITS",
      "El carrito supera el número máximo de unidades permitido.",
    );
  }

  return normalizedItems;
}

export default factories.createCoreService(
  "api::pedido-tienda.pedido-tienda",
  ({ strapi }) => ({
    async reconstruirCarritoSeguro(
      rawItems: unknown,
    ): Promise<CarritoValidado> {
      const items =
        normalizeCartItems(rawItems);

      const lines = await Promise.all(
        items.map(async (item) => {
          const product =
            (await strapi
              .documents(PRODUCTO_TIENDA_UID)
              .findOne({
                documentId:
                  item.documentId,
                status: "published",
                fields: [
                  "nombre",
                  "sku",
                  "referencia_proveedor",
                  "tipo_producto",
                  "precio_centimos",
                  "moneda",
                  "estado_venta",
                  "activo",
                  "requiere_envio",
                ],
              })) as ProductoCompra | null;

          if (
            !product ||
            !product.activo ||
            product.estado_venta !==
              "Disponible"
          ) {
            throw new CheckoutValidationError(
              "PRODUCT_NOT_PURCHASABLE",
              "Uno de los productos ya no está disponible para compra.",
            );
          }

          if (
            !Number.isSafeInteger(
              product.precio_centimos,
            ) ||
            Number(
              product.precio_centimos,
            ) <= 0 ||
            product.moneda !== "EUR"
          ) {
            throw new CheckoutValidationError(
              "PRODUCT_PRICE_INVALID",
              "Uno de los productos no tiene un precio válido.",
            );
          }

          if (
            !product.sku?.trim() ||
            !product.referencia_proveedor?.trim() ||
            !product.nombre?.trim()
          ) {
            strapi.log.error(
              `Producto de tienda mal configurado para checkout: ${product.documentId}`,
            );

            throw new CheckoutValidationError(
              "PRODUCT_CONFIGURATION_INVALID",
              "Uno de los productos no está correctamente configurado.",
              500,
            );
          }

          const unitPrice =
            Number(
              product.precio_centimos,
            );

          const subtotal =
            unitPrice * item.cantidad;

          if (
            !Number.isSafeInteger(subtotal)
          ) {
            throw new CheckoutValidationError(
              "ORDER_AMOUNT_INVALID",
              "No se ha podido calcular correctamente el pedido.",
            );
          }

          return {
            productoId: product.id,
            productoDocumentId:
              product.documentId,
            sku: product.sku,
            referenciaProveedor:
              product.referencia_proveedor,
            nombreProducto:
              product.nombre,
            tipoProducto:
              product.tipo_producto,
            cantidad: item.cantidad,
            precioUnitarioCentimos:
              unitPrice,
            subtotalCentimos:
              subtotal,
            moneda: product.moneda,
            requiereEnvio:
              product.requiere_envio,
          } satisfies LineaCarritoValidada;
        }),
      );

      const subtotalProductosCentimos =
        lines.reduce(
          (total, line) =>
            total +
            line.subtotalCentimos,
          0,
        );

      if (
        !Number.isSafeInteger(
          subtotalProductosCentimos,
        ) ||
        subtotalProductosCentimos <= 0 ||
        subtotalProductosCentimos >
          getTotalMaximoCentimos()
      ) {
        throw new CheckoutValidationError(
          "ORDER_AMOUNT_INVALID",
          "El importe del pedido no es válido o supera el máximo permitido.",
        );
      }

      return {
        lineas: lines,
        cantidadTotal: lines.reduce(
          (total, line) =>
            total + line.cantidad,
          0,
        ),
        subtotalProductosCentimos,
        moneda: "EUR",
        requiereEnvio: lines.some(
          (line) =>
            line.requiereEnvio,
        ),
      };
    },

    async crearPedidoProvisionalSeguro(
      rawItems: unknown,
      rawIdempotencyKey: unknown,
    ): Promise<PedidoProvisionalSeguro> {
      const normalizedItems =
        normalizeCartItems(rawItems);

      const idempotencyKey =
        normalizeIdempotencyKey(
          rawIdempotencyKey,
        );

      const cartFingerprint =
        createCartFingerprint(
          normalizedItems,
        );

      const secureService =
        strapi.service(
          PEDIDO_TIENDA_UID,
        ) as unknown as
          PedidoTiendaServiceInterno;

      const findExistingOrder =
        async () =>
          (await strapi
            .documents(
              PEDIDO_TIENDA_UID,
            )
            .findFirst({
              filters: {
                clave_idempotencia:
                  idempotencyKey,
              },
              fields: [
                "numero_pedido",
                "clave_idempotencia",
                "huella_carrito",
                "estado",
                "moneda",
                "subtotal_centimos",
                "impuestos_centimos",
                "envio_centimos",
                "total_centimos",
                "caduca_en",
              ],
            })) as
            | PedidoTiendaInterno
            | null;

      const resolveExistingOrder =
        async (
          existingOrder:
            PedidoTiendaInterno,
        ) => {
          if (
            existingOrder
              .huella_carrito !==
            cartFingerprint
          ) {
            throw new CheckoutValidationError(
              "IDEMPOTENCY_KEY_REUSED",
              "La misma clave de operación se ha utilizado con un carrito diferente.",
              409,
            );
          }

          const cart =
            await secureService
              .reconstruirCarritoSeguro(
                normalizedItems,
              );

          return createOrderSummary(
            existingOrder,
            cart,
            true,
          );
        };

      const existingOrder =
        await findExistingOrder();

      if (existingOrder) {
        return resolveExistingOrder(
          existingOrder,
        );
      }

      try {
        return await strapi.db.transaction(
          async () => {
            /*
             * Repetimos la comprobación dentro
             * de la transacción para reducir
             * carreras entre peticiones.
             */
            const concurrentOrder =
              await findExistingOrder();

            if (concurrentOrder) {
              return resolveExistingOrder(
                concurrentOrder,
              );
            }

            const cart =
              await secureService
                .reconstruirCarritoSeguro(
                  normalizedItems,
                );

            /*
             * Impuestos y envío permanecen
             * expresamente a cero hasta cerrar
             * las reglas fiscales y logísticas.
             * Todavía no existe ningún cobro.
             */
            const order =
              (await strapi
                .documents(
                  PEDIDO_TIENDA_UID,
                )
                .create({
                  data: {
                    numero_pedido:
                      createOrderNumber(),
                    clave_idempotencia:
                      idempotencyKey,
                    huella_carrito:
                      cartFingerprint,
                    estado:
                      "Pendiente de pago",
                    moneda:
                      cart.moneda,
                    subtotal_centimos:
                      cart
                        .subtotalProductosCentimos,
                    impuestos_centimos: 0,
                    envio_centimos: 0,
                    total_centimos:
                      cart
                        .subtotalProductosCentimos,
                    caduca_en:
                      createOrderExpiryDate(),
                  },
                })) as PedidoTiendaInterno;

            for (
              const line of cart.lineas
            ) {
              /*
               * Los documentId se usan para
               * conectar las relaciones.
               * El cast compensa una limitación
               * conocida de los tipos de Strapi.
               */
              const lineData = {
                pedido_tienda:
                  order.documentId,

                producto_tienda: {
                  connect: [
                    {
                      documentId:
                        line
                          .productoDocumentId,
                      status:
                        "published",
                    },
                  ],
                },

                producto_document_id:
                  line
                    .productoDocumentId,

                sku: line.sku,

                referencia_proveedor:
                  line
                    .referenciaProveedor,

                nombre_producto:
                  line.nombreProducto,

                tipo_producto:
                  line.tipoProducto,

                cantidad:
                  line.cantidad,

                precio_unitario_centimos:
                  line
                    .precioUnitarioCentimos,

                subtotal_centimos:
                  line
                    .subtotalCentimos,

                impuestos_centimos: 0,

                total_centimos:
                  line
                    .subtotalCentimos,

                moneda:
                  line.moneda,

                requiere_envio:
                  line.requiereEnvio,
              };

              await strapi
                .documents(
                  LINEA_PEDIDO_TIENDA_UID,
                )
                .create({
                  data:
                    lineData as never,
                });
            }

            return createOrderSummary(
              order,
              cart,
              false,
            );
          },
        );
      } catch (error) {
        /*
         * Si dos peticiones simultáneas
         * compiten por la clave única, una
         * puede haber creado ya el pedido.
         */
        const orderCreatedConcurrently =
          await findExistingOrder();

        if (
          orderCreatedConcurrently
        ) {
          return resolveExistingOrder(
            orderCreatedConcurrently,
          );
        }

        throw error;
      }
    },
  }),
);
