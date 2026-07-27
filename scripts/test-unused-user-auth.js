"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const candidates = [
  path.resolve(
    "dist/src/middlewares/"
      + "block-unused-user-auth.js",
  ),
  path.resolve(
    "dist/middlewares/"
      + "block-unused-user-auth.js",
  ),
];

const compiledPath = candidates.find(
  (candidate) => fs.existsSync(candidate),
);

if (!compiledPath) {
  console.error(
    "No se ha encontrado el middleware compilado.",
  );

  console.error("Rutas comprobadas:");

  for (const candidate of candidates) {
    console.error("-", candidate);
  }

  process.exit(1);
}

const loaded = require(compiledPath);

const createMiddleware =
  loaded.default ?? loaded;

assert.equal(
  typeof createMiddleware,
  "function",
  "El middleware compilado debe exportar una función.",
);

async function execute(requestPath) {
  let nextCalled = false;

  const ctx = {
    path: requestPath,
    status: 200,
    body: null,
  };

  await createMiddleware()(
    ctx,
    async () => {
      nextCalled = true;
    },
  );

  return {
    ctx,
    nextCalled,
  };
}

async function main() {
  const blockedPaths = [
    "/api/auth",
    "/api/auth/local",
    "/api/auth/local/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/email-confirmation",
    "/api/auth/send-email-confirmation",
    "/api/auth/refresh",
    "/api/connect",
    "/api/connect/google",
  ];

  for (const requestPath of blockedPaths) {
    const result =
      await execute(requestPath);

    assert.equal(
      result.ctx.status,
      404,
      `${requestPath} debe devolver 404`,
    );

    assert.equal(
      result.nextCalled,
      false,
      `${requestPath} no debe llegar a Strapi`,
    );
  }

  const allowedPaths = [
    "/admin",
    "/api/authentication",
    "/api/connected",
    "/api/producto-tiendas",
    "/api/categoria-producto-tiendas",
    "/api/tienda/carrito/validar",
    "/api/tienda/checkout",
    "/api/tienda/stripe/webhook",
  ];

  for (const requestPath of allowedPaths) {
    const result =
      await execute(requestPath);

    assert.equal(
      result.nextCalled,
      true,
      `${requestPath} no debe bloquearse`,
    );
  }

  console.log(
    "OK: middleware TypeScript compilado y probado.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
