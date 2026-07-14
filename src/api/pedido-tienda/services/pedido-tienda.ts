import { factories } from "@strapi/strapi";

const PRODUCTO_TIENDA_UID =
  "api::producto-tienda.producto-tienda" as const;

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
  }),
);
