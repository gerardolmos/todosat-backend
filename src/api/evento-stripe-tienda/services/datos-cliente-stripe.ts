import type Stripe from "stripe";

export interface DireccionEnvioStripeNormalizada {
  nombre_destinatario: string;
  linea_1: string;
  linea_2?: string;
  codigo_postal: string;
  ciudad: string;
  provincia?: string;
  codigo_pais: string;
}

export interface DatosClienteStripeNormalizados {
  email_cliente: string;
  nombre_cliente?: string;
  telefono_cliente?: string;
  direccion_envio?:
    DireccionEnvioStripeNormalizada;
}

type CheckoutCustomerDataSession =
  Pick<
    Stripe.Checkout.Session,
    | "customer_details"
    | "collected_information"
  >;

const MAX_EMAIL_LENGTH = 320;
const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 40;
const MAX_ADDRESS_LINE_LENGTH = 180;
const MAX_POSTAL_CODE_LENGTH = 20;
const MAX_CITY_LENGTH = 100;
const MAX_PROVINCE_LENGTH = 100;

const CONTROL_CHARACTERS =
  /[\u0000-\u001F\u007F]/;

export class StripeCustomerDataNormalizationError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "StripeCustomerDataNormalizationError";

    this.code = code;
    this.status = 400;
  }
}

function fail(
  code: string,
  message: string,
): never {
  throw new
    StripeCustomerDataNormalizationError(
      code,
      message,
    );
}

function normalizeText(
  value: unknown,
  {
    required,
    maxLength,
    code,
    label,
  }: {
    required: boolean;
    maxLength: number;
    code: string;
    label: string;
  },
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    if (required) {
      return fail(
        code,
        `Stripe no ha proporcionado ${label}.`,
      );
    }

    return undefined;
  }

  /*
   * NFC evita representaciones Unicode
   * equivalentes sin alterar letras o
   * símbolos mediante normalización de
   * compatibilidad.
   */
  const normalized =
    value
      .normalize("NFC")
      .trim();

  if (!normalized) {
    if (required) {
      return fail(
        code,
        `Stripe no ha proporcionado ${label}.`,
      );
    }

    return undefined;
  }

  /*
   * No admitimos saltos de línea, tabuladores
   * ni otros caracteres de control en datos
   * destinados al pedido y la logística.
   */
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

  if (
    compact.length >
    maxLength
  ) {
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
        required: true,
        maxLength:
          MAX_EMAIL_LENGTH,
        code:
          "STRIPE_CUSTOMER_EMAIL_MISSING",
        label:
          "un correo electrónico",
      },
    )!;

  const atIndex =
    email.lastIndexOf("@");

  if (
    atIndex <= 0 ||
    atIndex !==
      email.indexOf("@") ||
    atIndex ===
      email.length - 1
  ) {
    return fail(
      "STRIPE_CUSTOMER_EMAIL_INVALID",
      "El correo proporcionado por Stripe no es válido.",
    );
  }

  const localPart =
    email.slice(
      0,
      atIndex,
    );

  const domain =
    email
      .slice(
        atIndex + 1,
      )
      .toLowerCase();

  if (
    localPart.length > 64 ||
    domain.length > 255 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return fail(
      "STRIPE_CUSTOMER_EMAIL_INVALID",
      "El correo proporcionado por Stripe no es válido.",
    );
  }

  const labels =
    domain.split(".");

  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9-]+$/.test(
          label,
        ) ||
        label.startsWith("-") ||
        label.endsWith("-"),
    )
  ) {
    return fail(
      "STRIPE_CUSTOMER_EMAIL_INVALID",
      "El correo proporcionado por Stripe no es válido.",
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
        required: true,
        maxLength:
          MAX_PHONE_LENGTH,
        code:
          "STRIPE_CUSTOMER_PHONE_MISSING",
        label:
          "un teléfono de entrega",
      },
    )!;

  if (
    !/^[+0-9(). -]+$/.test(
      phone,
    ) ||
    (
      phone.match(/\d/g) ??
      []
    ).length < 6
  ) {
    return fail(
      "STRIPE_CUSTOMER_PHONE_INVALID",
      "El teléfono proporcionado por Stripe no es válido.",
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
        required: true,
        maxLength: 2,
        code:
          "STRIPE_SHIPPING_COUNTRY_INVALID",
        label:
          "un país de entrega",
      },
    )!
      .toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      country,
    )
  ) {
    return fail(
      "STRIPE_SHIPPING_COUNTRY_INVALID",
      "El país proporcionado por Stripe no es válido.",
    );
  }

  return country;
}

export function normalizarDatosClienteStripe({
  session,
  requiresShipping,
}: {
  session:
    CheckoutCustomerDataSession;
  requiresShipping: boolean;
}): DatosClienteStripeNormalizados {
  const customerDetails =
    session.customer_details;

  if (!customerDetails) {
    return fail(
      "STRIPE_CUSTOMER_DETAILS_MISSING",
      "La sesión de Stripe no contiene datos del cliente.",
    );
  }

  const email =
    normalizeEmail(
      customerDetails.email,
    );

  /*
   * Minimización:
   * un pedido sin entrega solo necesita
   * el correo operativo. Aunque Stripe
   * incluya otros datos, no se devuelven.
   */
  if (!requiresShipping) {
    return {
      email_cliente: email,
    };
  }

  const phone =
    normalizePhone(
      customerDetails.phone,
    );

  /*
   * TodoSatcom está fijado en la API
   * 2026-06-24.dahlia. No se admite aquí
   * la estructura antigua
   * session.shipping_details.
   */
  const shippingDetails =
    session
      .collected_information
      ?.shipping_details;

  if (!shippingDetails) {
    return fail(
      "STRIPE_SHIPPING_DETAILS_MISSING",
      "La sesión de Stripe no contiene datos de envío.",
    );
  }

  const address =
    shippingDetails.address;

  if (!address) {
    return fail(
      "STRIPE_SHIPPING_ADDRESS_MISSING",
      "La sesión de Stripe no contiene una dirección de envío.",
    );
  }

  const recipientName =
    normalizeText(
      shippingDetails.name,
      {
        required: true,
        maxLength:
          MAX_NAME_LENGTH,
        code:
          "STRIPE_SHIPPING_NAME_INVALID",
        label:
          "un destinatario",
      },
    )!;

  const line1 =
    normalizeText(
      address.line1,
      {
        required: true,
        maxLength:
          MAX_ADDRESS_LINE_LENGTH,
        code:
          "STRIPE_SHIPPING_ADDRESS_INVALID",
        label:
          "la primera línea de dirección",
      },
    )!;

  const line2 =
    normalizeText(
      address.line2,
      {
        required: false,
        maxLength:
          MAX_ADDRESS_LINE_LENGTH,
        code:
          "STRIPE_SHIPPING_ADDRESS_INVALID",
        label:
          "la segunda línea de dirección",
      },
    );

  const postalCode =
    normalizeText(
      address.postal_code,
      {
        required: true,
        maxLength:
          MAX_POSTAL_CODE_LENGTH,
        code:
          "STRIPE_SHIPPING_ADDRESS_INVALID",
        label:
          "un código postal",
      },
    )!;

  const city =
    normalizeText(
      address.city,
      {
        required: true,
        maxLength:
          MAX_CITY_LENGTH,
        code:
          "STRIPE_SHIPPING_ADDRESS_INVALID",
        label:
          "una ciudad",
      },
    )!;

  const province =
    normalizeText(
      address.state,
      {
        required: false,
        maxLength:
          MAX_PROVINCE_LENGTH,
        code:
          "STRIPE_SHIPPING_ADDRESS_INVALID",
        label:
          "una provincia",
      },
    );

  const shippingAddress:
    DireccionEnvioStripeNormalizada = {
      nombre_destinatario:
        recipientName,

      linea_1:
        line1,

      codigo_postal:
        postalCode,

      ciudad:
        city,

      codigo_pais:
        normalizeCountry(
          address.country,
        ),
    };

  if (line2) {
    shippingAddress.linea_2 =
      line2;
  }

  if (province) {
    shippingAddress.provincia =
      province;
  }

  return {
    email_cliente:
      email,

    nombre_cliente:
      recipientName,

    telefono_cliente:
      phone,

    direccion_envio:
      shippingAddress,
  };
}
