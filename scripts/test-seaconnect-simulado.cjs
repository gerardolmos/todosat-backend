"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const MODULE_PATH =
  "src/utils/seaconnect-simulado.ts";
const CONTRACT_PATH =
  "docs/tienda/contrato-seaconnect-simulado.md";

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function loadTypeScriptModule(file) {
  const source = read(file);
  const compiled = ts.transpileModule(
    source,
    {
      compilerOptions: {
        module:
          ts.ModuleKind.CommonJS,
        target:
          ts.ScriptTarget.ES2022,
        strict: true,
        esModuleInterop: true,
      },
      fileName: file,
      reportDiagnostics: true,
    },
  );

  const errors =
    (compiled.diagnostics ?? [])
      .filter(
        (diagnostic) =>
          diagnostic.category ===
          ts.DiagnosticCategory.Error,
      )
      .map(
        (diagnostic) =>
          ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n",
          ),
      );

  assert.deepEqual(errors, []);
  assert.doesNotMatch(
    compiled.outputText,
    /\binterface\s*;/,
  );

  const loadedModule = { exports: {} };
  const execute = new Function(
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

function createFictitiousOrder() {
  return {
    estado: "Pagado",
    referencia_solicitud:
      "scsim_pedido_ficticio_000001",
    nombre_cliente:
      "Persona Logística de Prueba",
    email_cliente:
      "logistica@EXAMPLE.INVALID",
    telefono_cliente:
      "+34 000 000 000",
    direccion_envio: {
      nombre_destinatario:
        "  Persona   Logística de Prueba  ",
      linea_1:
        "  Calle   Ficticia  1  ",
      linea_2:
        " Puerta de Prueba ",
      codigo_postal: " 00000 ",
      ciudad: " Ciudad de Prueba ",
      provincia:
        " Provincia Ficticia ",
      codigo_pais: "es",
    },
    lineas: [
      {
        referencia_proveedor:
          "PROVEEDOR-FICTICIO-001",
        cantidad: 2,
        requiere_envio: true,
      },
      {
        referencia_proveedor:
          "PRODUCTO-DIGITAL-FICTICIO",
        cantidad: 1,
        requiere_envio: false,
      },
    ],
  };
}

function expectCode(
  callback,
  code,
  status,
) {
  assert.throws(
    callback,
    (error) =>
      error?.code === code &&
      error?.status === status,
  );
}

const source = read(MODULE_PATH);
const contract = read(CONTRACT_PATH);
const envExample = read(".env.example");

const {
  crearSolicitudSeaconnectSimulada,
  SEACONNECT_SIMULATED_CONTRACT_VERSION,
} = loadTypeScriptModule(MODULE_PATH);

assert.equal(
  SEACONNECT_SIMULATED_CONTRACT_VERSION,
  "todosatcom-seaconnect-sim-v1",
);

const minimalRequest =
  crearSolicitudSeaconnectSimulada({
    pedido: createFictitiousOrder(),
  });

assert.deepEqual(
  minimalRequest,
  {
    contrato:
      "todosatcom-seaconnect-sim-v1",
    referencia_solicitud:
      "scsim_pedido_ficticio_000001",
    entrega: {
      destinatario:
        "Persona Logística de Prueba",
      direccion: {
        linea_1: "Calle Ficticia 1",
        linea_2: "Puerta de Prueba",
        codigo_postal: "00000",
        ciudad: "Ciudad de Prueba",
        provincia:
          "Provincia Ficticia",
        codigo_pais: "ES",
      },
    },
    lineas: [
      {
        referencia_producto:
          "PROVEEDOR-FICTICIO-001",
        cantidad: 2,
      },
    ],
  },
);

assert.equal(
  "email" in minimalRequest.entrega,
  false,
);
assert.equal(
  "telefono" in minimalRequest.entrega,
  false,
);

const withPhone =
  crearSolicitudSeaconnectSimulada({
    pedido: createFictitiousOrder(),
    opciones: {
      incluirTelefono: true,
    },
  });

assert.equal(
  withPhone.entrega.telefono,
  "+34 000 000 000",
);
assert.equal(
  "email" in withPhone.entrega,
  false,
);

const withEmail =
  crearSolicitudSeaconnectSimulada({
    pedido: createFictitiousOrder(),
    opciones: {
      incluirEmail: true,
    },
  });

assert.equal(
  withEmail.entrega.email,
  "logistica@example.invalid",
);
assert.equal(
  "telefono" in withEmail.entrega,
  false,
);

for (
  const state of [
    "Pendiente de pago",
    "Pago fallido",
    "Cancelado",
  ]
) {
  const order = createFictitiousOrder();
  order.estado = state;

  expectCode(
    () =>
      crearSolicitudSeaconnectSimulada({
        pedido: order,
      }),
    "SEACONNECT_ORDER_NOT_PAID",
    409,
  );
}

const noShipping = createFictitiousOrder();
noShipping.lineas =
  noShipping.lineas.map(
    (line) => ({
      ...line,
      requiere_envio: false,
    }),
  );

expectCode(
  () =>
    crearSolicitudSeaconnectSimulada({
      pedido: noShipping,
    }),
  "SEACONNECT_SHIPPING_LINES_MISSING",
  409,
);

const noAddress = createFictitiousOrder();
noAddress.direccion_envio = null;
expectCode(
  () =>
    crearSolicitudSeaconnectSimulada({
      pedido: noAddress,
    }),
  "SEACONNECT_ADDRESS_MISSING",
  400,
);

const badReference =
  createFictitiousOrder();
badReference.referencia_solicitud =
  "pedido-interno-1";
expectCode(
  () =>
    crearSolicitudSeaconnectSimulada({
      pedido: badReference,
    }),
  "SEACONNECT_REQUEST_REFERENCE_INVALID",
  400,
);

const badQuantity = createFictitiousOrder();
badQuantity.lineas[0].cantidad = 0;
expectCode(
  () =>
    crearSolicitudSeaconnectSimulada({
      pedido: badQuantity,
    }),
  "SEACONNECT_QUANTITY_INVALID",
  400,
);

const duplicate = createFictitiousOrder();
duplicate.lineas.push({
  referencia_proveedor:
    "PROVEEDOR-FICTICIO-001",
  cantidad: 1,
  requiere_envio: true,
});
expectCode(
  () =>
    crearSolicitudSeaconnectSimulada({
      pedido: duplicate,
    }),
  "SEACONNECT_PROVIDER_REFERENCE_DUPLICATED",
  400,
);

for (
  const forbiddenPattern of [
    /fetch\s*\(/,
    /axios/,
    /https\.request/,
    /http\.request/,
    /strapi\./,
    /\.query\s*\(/,
    /\.documents\s*\(/,
    /process\.env/,
    /console\./,
    /api[_-]?key/i,
    /authorization/i,
    /bearer/i,
  ]
) {
  assert.doesNotMatch(
    source,
    forbiddenPattern,
  );
}

for (
  const forbiddenField of [
    "stripe_checkout_session_id",
    "stripe_payment_intent_id",
    "clave_idempotencia",
    "huella_carrito",
    "numero_pedido",
    "producto_document_id",
    "notas_internas",
    "total_centimos",
    "subtotal_centimos",
    "precio_centimos",
  ]
) {
  assert.equal(
    source.includes(forbiddenField),
    false,
    `El formato no debe contener ${forbiddenField}.`,
  );
}

for (
  const text of [
    "Contrato interno simulado y no conectado",
    "no representa ni afirma reproducir la API real",
    "todosatcom-seaconnect-sim-v1",
    "Solo podrá prepararse una solicitud",
    "Datos excluidos",
    "Idempotencia futura",
    "Requisitos pendientes para una integración real",
    "SEACONNECT_EXPORT_ENABLED=false",
    "SEACONNECT_LIVE_ENABLED=false",
  ]
) {
  assert.ok(
    contract.includes(text),
    `Falta en el contrato: ${text}`,
  );
}

for (
  const flag of [
    "SEACONNECT_EXPORT_ENABLED=false",
    "SEACONNECT_LIVE_ENABLED=false",
  ]
) {
  assert.ok(
    envExample.includes(flag),
    `Falta en .env.example: ${flag}`,
  );
}

assert.doesNotMatch(
  contract,
  /https?:\/\/\S+/,
);

console.log(
  "OK: contrato simulado de Seaconnect documentado.",
);
console.log(
  "OK: solo los pedidos pagados pueden preparar solicitudes.",
);
console.log(
  "OK: las líneas sin envío quedan excluidas.",
);
console.log(
  "OK: correo y teléfono requieren activación independiente.",
);
console.log(
  "OK: no existen red, credenciales, endpoints ni persistencia.",
);
console.log(
  "OK: todos los datos utilizados son ficticios.",
);
