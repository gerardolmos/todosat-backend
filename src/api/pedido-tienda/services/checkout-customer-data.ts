import type Stripe from "stripe";

type ShippingAddressCollection =
  NonNullable<
    Stripe.Checkout.SessionCreateParams[
      "shipping_address_collection"
    ]
  >;

type AllowedCountry =
  ShippingAddressCollection[
    "allowed_countries"
  ][number];

export type CheckoutCustomerDataParameters =
  Pick<
    Stripe.Checkout.SessionCreateParams,
    | "customer_creation"
    | "phone_number_collection"
    | "shipping_address_collection"
  >;

const MAX_ALLOWED_COUNTRIES = 25;

export class
CheckoutCustomerDataConfigurationError
  extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);

    this.name =
      "CheckoutCustomerDataConfigurationError";

    this.code = code;
    this.status = 503;
  }
}

function isCustomerDataEnabled():
  boolean {
  return (
    process.env
      .CHECKOUT_CUSTOMER_DATA_ENABLED ===
    "true"
  );
}

function normalizeAllowedCountries():
  AllowedCountry[] {
  const rawValue =
    process.env
      .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES ??
    "";

  const countries =
    Array.from(
      new Set(
        rawValue
          .split(",")
          .map((value) =>
            value
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean),
      ),
    );

  if (countries.length === 0) {
    throw new
      CheckoutCustomerDataConfigurationError(
        "CHECKOUT_SHIPPING_COUNTRIES_REQUIRED",
        "No se han configurado países de envío.",
      );
  }

  if (
    countries.length >
    MAX_ALLOWED_COUNTRIES
  ) {
    throw new
      CheckoutCustomerDataConfigurationError(
        "CHECKOUT_SHIPPING_COUNTRIES_INVALID",
        "Se han configurado demasiados países de envío.",
      );
  }

  for (const country of countries) {
    if (!/^[A-Z]{2}$/.test(country)) {
      throw new
        CheckoutCustomerDataConfigurationError(
          "CHECKOUT_SHIPPING_COUNTRIES_INVALID",
          "La configuración de países de envío no es válida.",
        );
    }
  }

  return countries as AllowedCountry[];
}

export function
getCheckoutCustomerDataParameters({
  requiresShipping,
}: {
  requiresShipping: boolean;
}): Partial<
  CheckoutCustomerDataParameters
> {
  if (!isCustomerDataEnabled()) {
    return {};
  }

  const baseParameters = {
    /*
     * Checkout seguirá funcionando como
     * compra de invitado. Stripe solo creará
     * un Customer cuando resulte obligatorio.
     */
    customer_creation:
      "if_required" as const,
  };

  if (!requiresShipping) {
    return baseParameters;
  }

  return {
    ...baseParameters,

    phone_number_collection: {
      enabled: true,
    },

    shipping_address_collection: {
      allowed_countries:
        normalizeAllowedCountries(),
    },
  };
}
