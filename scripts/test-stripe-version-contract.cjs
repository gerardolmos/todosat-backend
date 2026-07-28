"use strict";

const assert =
  require("node:assert/strict");

const fs =
  require("node:fs");

const stripeModule =
  require("stripe");

const Stripe =
  stripeModule.default ??
  stripeModule.Stripe ??
  stripeModule;

const EXPECTED_SDK_VERSION =
  "22.3.1";

const EXPECTED_API_VERSION =
  "2026-06-24.dahlia";

function read(path) {
  return fs.readFileSync(
    path,
    "utf8",
  );
}

const packageJson =
  JSON.parse(
    read("package.json"),
  );

const packageLock =
  JSON.parse(
    read("package-lock.json"),
  );

const stripeUtils =
  read(
    "src/utils/stripe.ts",
  );

const documentation =
  read(
    "docs/tienda/contrato-version-stripe.md",
  );

const envExample =
  read(".env.example");

assert.equal(
  packageJson.dependencies
    ?.stripe,
  EXPECTED_SDK_VERSION,
  "package.json debe fijar exactamente Stripe.",
);

assert.equal(
  packageLock.packages?.[""]
    ?.dependencies?.stripe,
  EXPECTED_SDK_VERSION,
  "package-lock debe fijar la dependencia raíz.",
);

assert.equal(
  packageLock.packages
    ?.["node_modules/stripe"]
    ?.version,
  EXPECTED_SDK_VERSION,
  "package-lock debe contener el SDK aprobado.",
);

assert.equal(
  Stripe.API_VERSION,
  EXPECTED_API_VERSION,
  "La API incluida en el SDK ha cambiado.",
);

assert.match(
  stripeUtils,
  /export const STRIPE_API_VERSION\s*=\s*"2026-06-24\.dahlia"\s+as const/,
);

assert.match(
  stripeUtils,
  /apiVersion:\s*STRIPE_API_VERSION/,
);

assert.match(
  stripeUtils,
  /STRIPE_SDK_API_VERSION_MISMATCH/,
);

assert.match(
  stripeUtils,
  /assertStripeSdkApiVersion\(\);/,
);

for (
  const requiredText of [
    "stripe@22.3.1",
    "2026-06-24.dahlia",
    "collected_information.shipping_details",
    "No se ha creado una cuenta de Stripe",
    "No se ha creado un endpoint webhook",
  ]
) {
  assert.ok(
    documentation.includes(
      requiredText,
    ),
    `Falta en el contrato: ${requiredText}`,
  );
}

for (
  const disabledFlag of [
    "CHECKOUT_PUBLIC_ENABLED=false",
    "CHECKOUT_LIVE_ENABLED=false",
    "CHECKOUT_STATUS_PUBLIC_ENABLED=false",
    "CHECKOUT_CUSTOMER_DATA_ENABLED=false",
  ]
) {
  assert.ok(
    envExample.includes(
      disabledFlag,
    ),
    `Falta la protección ${disabledFlag}.`,
  );
}

/*
 * La versión no debe poder alterarse mediante
 * una variable de entorno no revisada.
 */
assert.doesNotMatch(
  envExample,
  /^STRIPE_API_VERSION=/m,
);

console.log(
  "OK: stripe@22.3.1 fijado exactamente.",
);

console.log(
  "OK: API 2026-06-24.dahlia coincide con el SDK.",
);

console.log(
  "OK: el cliente declara la versión explícitamente.",
);

console.log(
  "OK: la futura versión del webhook queda documentada.",
);

console.log(
  "OK: todas las funciones públicas y reales permanecen desactivadas.",
);
