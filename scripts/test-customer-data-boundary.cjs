"use strict";

const assert =
  require("node:assert/strict");

const fs =
  require("node:fs");

function read(path) {
  return fs.readFileSync(
    path,
    "utf8",
  );
}

const document =
  read(
    "docs/tienda/contrato-datos-cliente.md",
  );

const checkoutService =
  read(
    "src/api/pedido-tienda/services/checkout-stripe.ts",
  );

const webhookService =
  read(
    "src/api/evento-stripe-tienda/services/webhook-stripe.ts",
  );

const envExample =
  read(".env.example");

const orderSchema =
  JSON.parse(
    read(
      "src/api/pedido-tienda/content-types/pedido-tienda/schema.json",
    ),
  );

const addressSchema =
  JSON.parse(
    read(
      "src/components/tienda/direccion-envio.json",
    ),
  );

for (
  const requiredText of [
    "El frontend no mantendrá formularios propios",
    "Stripe Checkout alojado",
    "Pago pendiente",
    "No se copiarán datos personales a Strapi",
    "No existe todavía un contrato técnico implementado con Seaconnect",
    "No se establece un plazo concreto",
    "aceptacion_condiciones_en",
    "CHECKOUT_PUBLIC_ENABLED=false",
    "no se habilitarán ventas",
  ]
) {
  assert.ok(
    document.includes(
      requiredText,
    ),
    `Falta en el contrato: ${requiredText}`,
  );
}

/*
 * Mientras no se implemente la siguiente fase,
 * la sesión de Checkout no debe activar todavía
 * ningún mecanismo de recogida de datos.
 */
for (
  const forbiddenParameter of [
    "customer_email",
    "customer_creation",
    "shipping_address_collection",
    "phone_number_collection",
    "name_collection",
    "billing_address_collection",
    "tax_id_collection",
    "consent_collection",
    "custom_fields",
  ]
) {
  assert.doesNotMatch(
    checkoutService,
    new RegExp(
      `\\b${forbiddenParameter}\\b`,
    ),
    `Checkout ya contiene ${forbiddenParameter}.`,
  );
}

/*
 * El webhook todavía no debe leer ni copiar
 * información personal procedente de Stripe.
 */
for (
  const forbiddenWebhookField of [
    "customer_details",
    "collected_information",
    "shipping_details",
    "email_cliente",
    "nombre_cliente",
    "telefono_cliente",
    "direccion_envio",
  ]
) {
  assert.doesNotMatch(
    webhookService,
    new RegExp(
      `\\b${forbiddenWebhookField}\\b`,
    ),
    `Webhook ya contiene ${forbiddenWebhookField}.`,
  );
}

for (
  const field of [
    "email_cliente",
    "nombre_cliente",
    "telefono_cliente",
    "direccion_envio",
    "aceptacion_condiciones_en",
  ]
) {
  assert.equal(
    orderSchema
      .attributes[field]
      ?.private,
    true,
    `${field} debe seguir siendo privado.`,
  );
}

for (
  const field of [
    "nombre_destinatario",
    "linea_1",
    "linea_2",
    "codigo_postal",
    "ciudad",
    "provincia",
    "codigo_pais",
  ]
) {
  assert.equal(
    addressSchema
      .attributes[field]
      ?.private,
    true,
    `${field} debe seguir siendo privado.`,
  );
}

for (
  const disabledFlag of [
    "CHECKOUT_PUBLIC_ENABLED=false",
    "CHECKOUT_LIVE_ENABLED=false",
    "CHECKOUT_STATUS_PUBLIC_ENABLED=false",
  ]
) {
  assert.ok(
    envExample.includes(
      disabledFlag,
    ),
    `Falta la desactivación ${disabledFlag}.`,
  );
}

console.log(
  "OK: contrato de datos documentado.",
);

console.log(
  "OK: Checkout todavía no recoge datos personales.",
);

console.log(
  "OK: el webhook todavía no copia datos personales.",
);

console.log(
  "OK: todos los campos personales permanecen privados.",
);

console.log(
  "OK: checkout, estado público y modo real continúan desactivados.",
);
