"use strict";

const assert =
  require("node:assert/strict");

const fs =
  require("node:fs");

const path =
  require("node:path");

const ts =
  require("typescript");

const MODULE_PATH =
  "src/api/evento-stripe-tienda/services/datos-cliente-stripe.ts";

function read(file) {
  return fs.readFileSync(
    file,
    "utf8",
  );
}

function loadTypeScriptModule(
  file,
) {
  const source =
    read(file);

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

function createFictitiousSession() {
  return {
    customer_details: {
      email:
        "Cliente.Prueba@EXAMPLE.INVALID",

      phone:
        "  +34  000  000  000  ",
    },

    collected_information: {
      individual_name:
        "Persona de Prueba",

      shipping_details: {
        name:
          "  Persona   de Prueba  ",

        address: {
          line1:
            "  Calle   Ficticia  1  ",

          line2:
            "  Puerta   A  ",

          postal_code:
            "  00000  ",

          city:
            "  Ciudad   de Prueba  ",

          state:
            "  Provincia   Ficticia  ",

          country:
            "es",
        },
      },
    },
  };
}

function expectCode(
  callback,
  expectedCode,
) {
  assert.throws(
    callback,

    (error) =>
      error?.code ===
        expectedCode &&
      error?.status === 400,
  );
}

const source =
  read(MODULE_PATH);

const {
  normalizarDatosClienteStripe,
} =
  loadTypeScriptModule(
    MODULE_PATH,
  );

assert.equal(
  typeof normalizarDatosClienteStripe,
  "function",
);

/*
 * 1. Pedido sin envío:
 * solo se conserva el correo, aunque la
 * sesión contenga otros datos.
 */
const digitalResult =
  normalizarDatosClienteStripe({
    session:
      createFictitiousSession(),

    requiresShipping: false,
  });

assert.deepEqual(
  digitalResult,
  {
    email_cliente:
      "Cliente.Prueba@example.invalid",
  },
);

/*
 * La ausencia de teléfono o envío no debe
 * bloquear un pedido que no requiera entrega.
 */
const minimalDigitalSession =
  createFictitiousSession();

minimalDigitalSession
  .customer_details
  .phone = null;

minimalDigitalSession
  .collected_information = null;

assert.deepEqual(
  normalizarDatosClienteStripe({
    session:
      minimalDigitalSession,

    requiresShipping: false,
  }),
  {
    email_cliente:
      "Cliente.Prueba@example.invalid",
  },
);

/*
 * 2. Pedido con envío:
 * se normalizan exclusivamente los campos
 * previstos en el modelo privado.
 */
const shippingResult =
  normalizarDatosClienteStripe({
    session:
      createFictitiousSession(),

    requiresShipping: true,
  });

assert.deepEqual(
  shippingResult,
  {
    email_cliente:
      "Cliente.Prueba@example.invalid",

    nombre_cliente:
      "Persona de Prueba",

    telefono_cliente:
      "+34 000 000 000",

    direccion_envio: {
      nombre_destinatario:
        "Persona de Prueba",

      linea_1:
        "Calle Ficticia 1",

      linea_2:
        "Puerta A",

      codigo_postal:
        "00000",

      ciudad:
        "Ciudad de Prueba",

      provincia:
        "Provincia Ficticia",

      codigo_pais:
        "ES",
    },
  },
);

/*
 * 3. Campos opcionales:
 * no se crean propiedades vacías.
 */
const optionalSession =
  createFictitiousSession();

optionalSession
  .collected_information
  .shipping_details
  .address
  .line2 = null;

optionalSession
  .collected_information
  .shipping_details
  .address
  .state = null;

const optionalResult =
  normalizarDatosClienteStripe({
    session:
      optionalSession,

    requiresShipping: true,
  });

assert.equal(
  "linea_2" in
    optionalResult
      .direccion_envio,
  false,
);

assert.equal(
  "provincia" in
    optionalResult
      .direccion_envio,
  false,
);

/*
 * 4. Rechazos de datos incompletos o
 * incompatibles con el modelo.
 */
expectCode(
  () =>
    normalizarDatosClienteStripe({
      session: {
        customer_details:
          null,

        collected_information:
          null,
      },

      requiresShipping:
        false,
    }),

  "STRIPE_CUSTOMER_DETAILS_MISSING",
);

const missingEmail =
  createFictitiousSession();

missingEmail
  .customer_details
  .email = null;

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        missingEmail,

      requiresShipping:
        false,
    }),

  "STRIPE_CUSTOMER_EMAIL_MISSING",
);

const invalidEmail =
  createFictitiousSession();

invalidEmail
  .customer_details
  .email =
    "correo-invalido";

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        invalidEmail,

      requiresShipping:
        false,
    }),

  "STRIPE_CUSTOMER_EMAIL_INVALID",
);

const missingPhone =
  createFictitiousSession();

missingPhone
  .customer_details
  .phone = null;

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        missingPhone,

      requiresShipping:
        true,
    }),

  "STRIPE_CUSTOMER_PHONE_MISSING",
);

const invalidPhone =
  createFictitiousSession();

invalidPhone
  .customer_details
  .phone =
    "teléfono ficticio";

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        invalidPhone,

      requiresShipping:
        true,
    }),

  "STRIPE_CUSTOMER_PHONE_INVALID",
);

const missingShipping =
  createFictitiousSession();

missingShipping
  .collected_information =
    null;

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        missingShipping,

      requiresShipping:
        true,
    }),

  "STRIPE_SHIPPING_DETAILS_MISSING",
);

const longName =
  createFictitiousSession();

longName
  .collected_information
  .shipping_details
  .name =
    "X".repeat(121);

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        longName,

      requiresShipping:
        true,
    }),

  "STRIPE_SHIPPING_NAME_INVALID",
);

const controlCharacter =
  createFictitiousSession();

controlCharacter
  .collected_information
  .shipping_details
  .address
  .line1 =
    "Calle Ficticia\n1";

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        controlCharacter,

      requiresShipping:
        true,
    }),

  "STRIPE_SHIPPING_ADDRESS_INVALID",
);

const invalidCountry =
  createFictitiousSession();

invalidCountry
  .collected_information
  .shipping_details
  .address
  .country =
    "ESP";

expectCode(
  () =>
    normalizarDatosClienteStripe({
      session:
        invalidCountry,

      requiresShipping:
        true,
    }),

  "STRIPE_SHIPPING_COUNTRY_INVALID",
);

/*
 * 5. Contrato estructural:
 * solo API moderna, sin persistencia,
 * logs ni acceso al entorno.
 */
assert.match(
  source,
  /session\s*\.collected_information/,
);

assert.match(
  source,
  /session\.customer_details/,
);

const parsedSource =
  ts.createSourceFile(
    MODULE_PATH,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

let usesLegacyShippingDetails =
  false;

function inspectNode(node) {
  if (
    ts.isPropertyAccessExpression(
      node,
    ) &&
    node.name.text ===
      "shipping_details" &&
    node.expression.getText(
      parsedSource,
    ) === "session"
  ) {
    usesLegacyShippingDetails =
      true;
  }

  if (
    ts.isElementAccessExpression(
      node,
    ) &&
    node.expression.getText(
      parsedSource,
    ) === "session" &&
    ts.isStringLiteralLike(
      node.argumentExpression,
    ) &&
    node.argumentExpression.text ===
      "shipping_details"
  ) {
    usesLegacyShippingDetails =
      true;
  }

  ts.forEachChild(
    node,
    inspectNode,
  );
}

inspectNode(
  parsedSource,
);

assert.equal(
  usesLegacyShippingDetails,
  false,
  "No debe accederse a session.shipping_details.",
);

assert.doesNotMatch(
  source,
  /strapi\.|documents\(|\.query\(|transaction\(/,
);

assert.doesNotMatch(
  source,
  /console\.|process\.env/,
);

assert.doesNotMatch(
  source,
  /fetch\s*\(|axios|https\.request|checkout\.sessions/,
);

console.log(
  "OK: pedido sin envío conserva únicamente el correo.",
);

console.log(
  "OK: pedido con envío normaliza los datos mínimos.",
);

console.log(
  "OK: límites y caracteres de control protegidos.",
);

console.log(
  "OK: solo se utiliza collected_information.shipping_details.",
);

console.log(
  "OK: no existe persistencia, logging ni conexión externa.",
);
