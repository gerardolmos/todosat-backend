"use strict";

const assert =
  require("node:assert/strict");

const fs =
  require("node:fs");

const path =
  require("node:path");

const ts =
  require("typescript");

function read(file) {
  return fs.readFileSync(
    file,
    "utf8",
  );
}

function loadTypeScriptModule(file) {
  const source = read(file);

  const compiled =
    ts.transpileModule(
      source,
      {
        compilerOptions: {
          module:
            ts.ModuleKind.CommonJS,

          target:
            ts.ScriptTarget.ES2022,

          esModuleInterop: true,

          strict: true,
        },

        fileName: file,
      },
    );

  const loadedModule = {
    exports: {},
  };

  const execute =
    new Function(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      compiled.outputText,
    );

  execute(
    loadedModule.exports,
    require,
    loadedModule,
    file,
    path.dirname(file),
  );

  return loadedModule.exports;
}

const envKeys = [
  "CHECKOUT_CUSTOMER_DATA_ENABLED",
  "CHECKOUT_SHIPPING_ALLOWED_COUNTRIES",
];

const previousEnvironment =
  Object.fromEntries(
    envKeys.map((key) => [
      key,
      process.env[key],
    ]),
  );

function restoreEnvironment() {
  for (const key of envKeys) {
    const previous =
      previousEnvironment[key];

    if (
      typeof previous ===
      "undefined"
    ) {
      delete process.env[key];
    } else {
      process.env[key] =
        previous;
    }
  }
}

try {
  const modulePath =
    "src/api/pedido-tienda/services/checkout-customer-data.ts";

  const source =
    read(modulePath);

  const checkoutService =
    read(
      "src/api/pedido-tienda/services/checkout-stripe.ts",
    );

  const envExample =
    read(".env.example");

  const {
    getCheckoutCustomerDataParameters,
  } =
    loadTypeScriptModule(
      modulePath,
    );

  assert.equal(
    typeof
      getCheckoutCustomerDataParameters,
    "function",
  );

  /*
   * Desactivado: ni siquiera una
   * configuración incorrecta debe tener
   * efecto sobre la sesión.
   */
  process.env
    .CHECKOUT_CUSTOMER_DATA_ENABLED =
    "false";

  process.env
    .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES =
    "VALOR-INVALIDO";

  assert.deepEqual(
    getCheckoutCustomerDataParameters({
      requiresShipping: true,
    }),
    {},
  );

  /*
   * Pedido sin envío: compra invitada,
   * sin teléfono ni dirección.
   */
  process.env
    .CHECKOUT_CUSTOMER_DATA_ENABLED =
    "true";

  process.env
    .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES =
    "";

  assert.deepEqual(
    getCheckoutCustomerDataParameters({
      requiresShipping: false,
    }),
    {
      customer_creation:
        "if_required",
    },
  );

  /*
   * Pedido con envío: países
   * normalizados y sin duplicados.
   */
  process.env
    .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES =
    "ES, pt,ES";

  assert.deepEqual(
    getCheckoutCustomerDataParameters({
      requiresShipping: true,
    }),
    {
      customer_creation:
        "if_required",

      phone_number_collection: {
        enabled: true,
      },

      shipping_address_collection: {
        allowed_countries: [
          "ES",
          "PT",
        ],
      },
    },
  );

  process.env
    .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES =
    "";

  assert.throws(
    () =>
      getCheckoutCustomerDataParameters({
        requiresShipping: true,
      }),

    (error) =>
      error?.code ===
      "CHECKOUT_SHIPPING_COUNTRIES_REQUIRED",
  );

  process.env
    .CHECKOUT_SHIPPING_ALLOWED_COUNTRIES =
    "ESP";

  assert.throws(
    () =>
      getCheckoutCustomerDataParameters({
        requiresShipping: true,
      }),

    (error) =>
      error?.code ===
      "CHECKOUT_SHIPPING_COUNTRIES_INVALID",
  );

  assert.match(
    envExample,
    /^CHECKOUT_CUSTOMER_DATA_ENABLED=false$/m,
  );

  assert.match(
    envExample,
    /^CHECKOUT_SHIPPING_ALLOWED_COUNTRIES=$/m,
  );

  assert.match(
    checkoutService,
    /getCheckoutCustomerDataParameters/,
  );

  assert.match(
    checkoutService,
    /requiere_envio/,
  );

  assert.match(
    checkoutService,
    /\.\.\.customerDataParameters/,
  );

  /*
   * Todavía no se preenvían datos
   * personales desde TodoSatcom.
   */
  for (
    const forbiddenField of [
      "customer_email",
      "customer_details",
      "shipping_details",
      "email_cliente",
      "nombre_cliente",
      "telefono_cliente",
      "direccion_envio",
    ]
  ) {
    assert.doesNotMatch(
      checkoutService,
      new RegExp(
        `\\b${forbiddenField}\\b`,
      ),
    );
  }

  /*
   * No se habilitan características
   * ajenas a la ejecución del pedido.
   */
  for (
    const forbiddenParameter of [
      "tax_id_collection",
      "consent_collection",
      "custom_fields",
      "setup_future_usage",
    ]
  ) {
    assert.doesNotMatch(
      source,
      new RegExp(
        `\\b${forbiddenParameter}\\b`,
      ),
    );
  }

  console.log(
    "OK: recogida de datos desactivada por defecto.",
  );

  console.log(
    "OK: pedidos sin envío no solicitan teléfono ni dirección.",
  );

  console.log(
    "OK: pedidos con envío preparan países y teléfono.",
  );

  console.log(
    "OK: TodoSatcom todavía no preenvía ni copia datos personales.",
  );
} finally {
  restoreEnvironment();
}
