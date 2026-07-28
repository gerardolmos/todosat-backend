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

const route = read(
  "src/api/pedido-tienda/routes/estado-checkout-tienda.ts",
);

const controller = read(
  "src/api/pedido-tienda/controllers/estado-checkout-tienda.ts",
);

const envExample =
  read(".env.example");

assert.match(
  route,
  /POST/,
);

assert.match(
  route,
  /\/tienda\/checkout\/estado/,
);

assert.match(
  route,
  /auth:\s*false/,
);

assert.match(
  controller,
  /CHECKOUT_STATUS_PUBLIC_ENABLED/,
);

assert.match(
  controller,
  /Cache-Control/,
);

assert.match(
  controller,
  /no-store/,
);

assert.match(
  controller,
  /stripe_checkout_session_id/,
);

assert.match(
  controller,
  /select:\s*\[\s*"estado"/,
);

assert.match(
  controller,
  /estadoPago/,
);

assert.match(
  controller,
  /pagoConfirmado/,
);

assert.doesNotMatch(
  controller,
  /getStripeClient|checkout\.sessions|from\s+["']stripe["']/,
);

assert.doesNotMatch(
  controller,
  /email_cliente|nombre_cliente|telefono_cliente|direccion_envio/,
);

assert.doesNotMatch(
  controller,
  /numero_pedido|total_centimos|subtotal_centimos/,
);

assert.match(
  envExample,
  /^CHECKOUT_STATUS_PUBLIC_ENABLED=false$/m,
);

console.log(
  "OK: endpoint público mínimo probado.",
);

console.log(
  "OK: no consulta Stripe.",
);

console.log(
  "OK: no expone datos personales ni importes.",
);
