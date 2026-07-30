export const SEACONNECT_SIMULATED_CONTRACT_VERSION =
  "todosatcom-seaconnect-sim-v1" as const;

export interface DireccionSeaconnectSimulada {
  linea_1: string;
  linea_2?: string;
  codigo_postal: string;
  ciudad: string;
  provincia?: string;
  codigo_pais: string;
}

export interface LineaPedidoParaSeaconnect {
  referencia_proveedor: unknown;
  cantidad: unknown;
  requiere_envio: unknown;
}

export interface PedidoParaSeaconnectSimulado {
  estado: unknown;
  referencia_solicitud: unknown;
  nombre_cliente: unknown;
  email_cliente?: unknown;
  telefono_cliente?: unknown;
  direccion_envio?: {
    nombre_destinatario?: unknown;
    linea_1?: unknown;
    linea_2?: unknown;
    codigo_postal?: unknown;
    ciudad?: unknown;
    provincia?: unknown;
    codigo_pais?: unknown;
  } | null;
  lineas: unknown;
}

export interface OpcionesContactoSeaconnect {
  incluirEmail?: boolean;
  incluirTelefono?: boolean;
}

export interface SolicitudSeaconnectSimulada {
  contrato:
    typeof SEACONNECT_SIMULATED_CONTRACT_VERSION;
  referencia_solicitud: string;
  entrega: {
    destinatario: string;
    direccion:
      DireccionSeaconnectSimulada;
    email?: string;
    telefono?: string;
  };
  lineas: Array<{
    referencia_producto: string;
    cantidad: number;
  }>;
}

const CONTROL_CHARACTERS =
  /[\u0000-\u001F\u007F]/;

export class SeaconnectSimulatedContractError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status = 400,
  ) {
    super(message);
    this.name =
      "SeaconnectSimulatedContractError";
    this.code = code;
    this.status = status;
  }
}

function fail(
  code: string,
  message: string,
  status = 400,
): never {
  throw new SeaconnectSimulatedContractError(
    code,
    message,
    status,
  );
}

function normalizeText(
  value: unknown,
  {
    code,
    label,
    maxLength,
    required,
  }: {
    code: string;
    label: string;
    maxLength: number;
    required: boolean;
  },
): string | undefined {
  if (typeof value !== "string") {
    if (required) {
      return fail(
        code,
        `Falta ${label}.`,
      );
    }

    return undefined;
  }

  const normalized =
    value
      .normalize("NFC")
      .trim();

  if (!normalized) {
    if (required) {
      return fail(
        code,
        `Falta ${label}.`,
      );
    }

    return undefined;
  }

  if (
    CONTROL_CHARACTERS.test(
      normalized,
    )
  ) {
    return fail(
      code,
      `${label} contiene caracteres no válidos.`,
    );
  }

  const compact =
    normalized.replace(
      /\s+/g,
      " ",
    );

  if (compact.length > maxLength) {
    return fail(
      code,
      `${label} supera la longitud permitida.`,
    );
  }

  return compact;
}

function normalizeEmail(
  value: unknown,
): string {
  const email =
    normalizeText(
      value,
      {
        code:
          "SEACONNECT_EMAIL_INVALID",
        label:
          "el correo de entrega",
        maxLength: 320,
        required: true,
      },
    )!;

  const atIndex =
    email.lastIndexOf("@");

  if (
    atIndex <= 0 ||
    atIndex !== email.indexOf("@") ||
    atIndex === email.length - 1
  ) {
    return fail(
      "SEACONNECT_EMAIL_INVALID",
      "El correo de entrega no es válido.",
    );
  }

  const localPart =
    email.slice(0, atIndex);

  const domain =
    email
      .slice(atIndex + 1)
      .toLowerCase();

  const labels = domain.split(".");

  if (
    localPart.length > 64 ||
    domain.length > 255 ||
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9-]+$/.test(label) ||
        label.startsWith("-") ||
        label.endsWith("-"),
    )
  ) {
    return fail(
      "SEACONNECT_EMAIL_INVALID",
      "El correo de entrega no es válido.",
    );
  }

  return `${localPart}@${domain}`;
}

function normalizePhone(
  value: unknown,
): string {
  const phone =
    normalizeText(
      value,
      {
        code:
          "SEACONNECT_PHONE_INVALID",
        label:
          "el teléfono de entrega",
        maxLength: 40,
        required: true,
      },
    )!;

  if (
    !/^[+0-9(). -]+$/.test(phone) ||
    (
      phone.match(/\d/g) ??
      []
    ).length < 6
  ) {
    return fail(
      "SEACONNECT_PHONE_INVALID",
      "El teléfono de entrega no es válido.",
    );
  }

  return phone;
}

function normalizeCountry(
  value: unknown,
): string {
  const country =
    normalizeText(
      value,
      {
        code:
          "SEACONNECT_COUNTRY_INVALID",
        label:
          "el país de entrega",
        maxLength: 2,
        required: true,
      },
    )!
      .toUpperCase();

  if (!/^[A-Z]{2}$/.test(country)) {
    return fail(
      "SEACONNECT_COUNTRY_INVALID",
      "El país de entrega no es válido.",
    );
  }

  return country;
}

function normalizeRequestReference(
  value: unknown,
): string {
  const reference =
    normalizeText(
      value,
      {
        code:
          "SEACONNECT_REQUEST_REFERENCE_INVALID",
        label:
          "la referencia opaca de solicitud",
        maxLength: 86,
        required: true,
      },
    )!;

  if (
    !/^scsim_[a-z0-9][a-z0-9_-]{15,79}$/.test(
      reference,
    )
  ) {
    return fail(
      "SEACONNECT_REQUEST_REFERENCE_INVALID",
      "La referencia opaca de solicitud no es válida.",
    );
  }

  return reference;
}

function normalizeLines(
  value: unknown,
): SolicitudSeaconnectSimulada["lineas"] {
  if (!Array.isArray(value)) {
    return fail(
      "SEACONNECT_LINES_INVALID",
      "Las líneas del pedido no son válidas.",
    );
  }

  const shippingLines =
    value.filter(
      (
        line,
      ): line is
        LineaPedidoParaSeaconnect =>
        Boolean(
          line &&
          typeof line === "object" &&
          (
            line as
              LineaPedidoParaSeaconnect
          ).requiere_envio === true,
        ),
    );

  if (shippingLines.length === 0) {
    return fail(
      "SEACONNECT_SHIPPING_LINES_MISSING",
      "El pedido no contiene líneas que requieran envío.",
      409,
    );
  }

  const seenReferences =
    new Set<string>();

  return shippingLines.map(
    (line) => {
      const providerReference =
        normalizeText(
          line.referencia_proveedor,
          {
            code:
              "SEACONNECT_PROVIDER_REFERENCE_INVALID",
            label:
              "la referencia del producto del proveedor",
            maxLength: 160,
            required: true,
          },
        )!;

      if (
        seenReferences.has(
          providerReference,
        )
      ) {
        return fail(
          "SEACONNECT_PROVIDER_REFERENCE_DUPLICATED",
          "La solicitud contiene una referencia de proveedor duplicada.",
        );
      }

      seenReferences.add(
        providerReference,
      );

      if (
        !Number.isSafeInteger(
          line.cantidad,
        ) ||
        Number(line.cantidad) < 1 ||
        Number(line.cantidad) > 20
      ) {
        return fail(
          "SEACONNECT_QUANTITY_INVALID",
          "La cantidad de una línea no es válida.",
        );
      }

      return {
        referencia_producto:
          providerReference,
        cantidad:
          Number(line.cantidad),
      };
    },
  );
}

export function crearSolicitudSeaconnectSimulada({
  pedido,
  opciones = {},
}: {
  pedido:
    PedidoParaSeaconnectSimulado;
  opciones?:
    OpcionesContactoSeaconnect;
}): SolicitudSeaconnectSimulada {
  if (pedido.estado !== "Pagado") {
    return fail(
      "SEACONNECT_ORDER_NOT_PAID",
      "Solo un pedido pagado puede preparar una solicitud logística.",
      409,
    );
  }

  if (!pedido.direccion_envio) {
    return fail(
      "SEACONNECT_ADDRESS_MISSING",
      "El pedido pagado no contiene dirección de envío.",
    );
  }

  const recipient =
    normalizeText(
      pedido
        .direccion_envio
        .nombre_destinatario ??
      pedido.nombre_cliente,
      {
        code:
          "SEACONNECT_RECIPIENT_INVALID",
        label:
          "el destinatario",
        maxLength: 120,
        required: true,
      },
    )!;

  const line2 =
    normalizeText(
      pedido.direccion_envio.linea_2,
      {
        code:
          "SEACONNECT_ADDRESS_INVALID",
        label:
          "la segunda línea de dirección",
        maxLength: 180,
        required: false,
      },
    );

  const province =
    normalizeText(
      pedido.direccion_envio.provincia,
      {
        code:
          "SEACONNECT_ADDRESS_INVALID",
        label:
          "la provincia",
        maxLength: 100,
        required: false,
      },
    );

  const address:
    DireccionSeaconnectSimulada = {
      linea_1:
        normalizeText(
          pedido.direccion_envio.linea_1,
          {
            code:
              "SEACONNECT_ADDRESS_INVALID",
            label:
              "la primera línea de dirección",
            maxLength: 180,
            required: true,
          },
        )!,
      codigo_postal:
        normalizeText(
          pedido
            .direccion_envio
            .codigo_postal,
          {
            code:
              "SEACONNECT_ADDRESS_INVALID",
            label:
              "el código postal",
            maxLength: 20,
            required: true,
          },
        )!,
      ciudad:
        normalizeText(
          pedido.direccion_envio.ciudad,
          {
            code:
              "SEACONNECT_ADDRESS_INVALID",
            label:
              "la ciudad",
            maxLength: 100,
            required: true,
          },
        )!,
      codigo_pais:
        normalizeCountry(
          pedido
            .direccion_envio
            .codigo_pais,
        ),
    };

  if (line2) {
    address.linea_2 = line2;
  }

  if (province) {
    address.provincia = province;
  }

  const delivery:
    SolicitudSeaconnectSimulada["entrega"] = {
      destinatario: recipient,
      direccion: address,
    };

  if (opciones.incluirEmail === true) {
    delivery.email =
      normalizeEmail(
        pedido.email_cliente,
      );
  }

  if (
    opciones.incluirTelefono === true
  ) {
    delivery.telefono =
      normalizePhone(
        pedido.telefono_cliente,
      );
  }

  return {
    contrato:
      SEACONNECT_SIMULATED_CONTRACT_VERSION,
    referencia_solicitud:
      normalizeRequestReference(
        pedido.referencia_solicitud,
      ),
    entrega: delivery,
    lineas:
      normalizeLines(pedido.lineas),
  };
}
