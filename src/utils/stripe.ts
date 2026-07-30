import Stripe from "stripe";

export const STRIPE_API_VERSION =
  "2026-06-24.dahlia" as const;

export type StripeMode =
  | "test"
  | "live";

interface StripeRuntimeConfig {
  mode: StripeMode;
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
}

export class StripeConfigurationError
  extends Error {
  readonly code: string;

  constructor(
    code: string,
    message: string,
  ) {
    super(message);
    this.name =
      "StripeConfigurationError";
    this.code = code;
  }
}

const CHECKOUT_SESSION_PLACEHOLDER =
  "{CHECKOUT_SESSION_ID}";

let cachedClient:
  | {
      secretKey: string;
      client: Stripe;
    }
  | undefined;

function readRequiredEnvironmentVariable(
  name: string,
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new StripeConfigurationError(
      "STRIPE_CONFIGURATION_MISSING",
      `Falta la variable de entorno ${name}.`,
    );
  }

  return value;
}

function readStripeMode(): StripeMode {
  const mode =
    (
      process.env.STRIPE_MODE ??
      "test"
    )
      .trim()
      .toLowerCase();

  if (
    mode !== "test" &&
    mode !== "live"
  ) {
    throw new StripeConfigurationError(
      "STRIPE_MODE_INVALID",
      "STRIPE_MODE debe ser test o live.",
    );
  }

  return mode;
}

function assertStripeModeAllowed(
  mode: StripeMode,
) {
  if (mode !== "live") {
    return;
  }

  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    throw new StripeConfigurationError(
      "STRIPE_LIVE_ENVIRONMENT_FORBIDDEN",
      "Stripe real solo puede utilizarse en producción.",
    );
  }

  const liveEnabled =
    (
      process.env
        .CHECKOUT_LIVE_ENABLED ??
      ""
    )
      .trim()
      .toLowerCase() === "true";

  if (!liveEnabled) {
    throw new StripeConfigurationError(
      "STRIPE_LIVE_DISABLED",
      "Los pagos reales están bloqueados mediante CHECKOUT_LIVE_ENABLED.",
    );
  }
}

function readValidatedStripeMode():
StripeMode {
  const mode = readStripeMode();

  assertStripeModeAllowed(mode);

  return mode;
}

function readCheckoutUrl(
  variableName: string,
  mode: StripeMode,
): string {
  const value =
    readRequiredEnvironmentVariable(
      variableName,
    );

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new StripeConfigurationError(
      "STRIPE_URL_INVALID",
      `${variableName} no contiene una URL válida.`,
    );
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new StripeConfigurationError(
      "STRIPE_URL_INVALID",
      `${variableName} debe utilizar HTTP o HTTPS.`,
    );
  }

  if (
    mode === "live" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new StripeConfigurationError(
      "STRIPE_LIVE_HTTPS_REQUIRED",
      `${variableName} debe utilizar HTTPS en modo real.`,
    );
  }

  if (
    variableName ===
      "CHECKOUT_SUCCESS_URL" &&
    !value.includes(
      CHECKOUT_SESSION_PLACEHOLDER,
    )
  ) {
    throw new StripeConfigurationError(
      "STRIPE_SUCCESS_URL_INVALID",
      `CHECKOUT_SUCCESS_URL debe contener ${CHECKOUT_SESSION_PLACEHOLDER}.`,
    );
  }

  return value;
}

function readRuntimeConfig():
StripeRuntimeConfig {
  const mode =
    readValidatedStripeMode();

  const secretKey =
    readRequiredEnvironmentVariable(
      "STRIPE_SECRET_KEY",
    );

  const expectedPrefix =
    mode === "live"
      ? "sk_live_"
      : "sk_test_";

  if (
    !secretKey.startsWith(
      expectedPrefix,
    )
  ) {
    throw new StripeConfigurationError(
      "STRIPE_KEY_MODE_MISMATCH",
      `La clave de Stripe no corresponde al modo ${mode}.`,
    );
  }

  return {
    mode,
    secretKey,
    successUrl: readCheckoutUrl(
      "CHECKOUT_SUCCESS_URL",
      mode,
    ),
    cancelUrl: readCheckoutUrl(
      "CHECKOUT_CANCEL_URL",
      mode,
    ),
  };
}

function assertStripeSdkApiVersion() {
  const runtimeApiVersion =
    (
      Stripe as unknown as {
        API_VERSION?: unknown;
      }
    ).API_VERSION;

  if (
    runtimeApiVersion !==
    STRIPE_API_VERSION
  ) {
    throw new StripeConfigurationError(
      "STRIPE_SDK_API_VERSION_MISMATCH",
      "La versión de API del SDK de Stripe no coincide con la versión aprobada por TodoSatcom.",
    );
  }
}

export function getStripeClient():
Stripe {
  assertStripeSdkApiVersion();

  const config =
    readRuntimeConfig();

  if (
    !cachedClient ||
    cachedClient.secretKey !==
      config.secretKey
  ) {
    cachedClient = {
      secretKey: config.secretKey,
      client: new Stripe(
        config.secretKey,
        {
          /*
           * Debe coincidir con la versión
           * incluida en stripe@22.3.1 y con
           * la futura versión del endpoint
           * webhook.
           */
          apiVersion:
            STRIPE_API_VERSION,

          appInfo: {
            name: "TodoSatcom",
            version: "0.1.0",
          },
        },
      ),
    };
  }

  return cachedClient.client;
}

export function getStripeMode():
StripeMode {
  return readValidatedStripeMode();
}

export function getStripeCheckoutConfig() {
  const config =
    readRuntimeConfig();

  return {
    mode: config.mode,

    apiVersion:
      STRIPE_API_VERSION,

    successUrl:
      config.successUrl,
    cancelUrl:
      config.cancelUrl,
  };
}

export function getStripeWebhookSecret():
string {
  const webhookSecret =
    readRequiredEnvironmentVariable(
      "STRIPE_WEBHOOK_SECRET",
    );

  if (
    !webhookSecret.startsWith(
      "whsec_",
    )
  ) {
    throw new StripeConfigurationError(
      "STRIPE_WEBHOOK_SECRET_INVALID",
      "El secreto del webhook de Stripe no tiene el formato esperado.",
    );
  }

  return webhookSecret;
}
