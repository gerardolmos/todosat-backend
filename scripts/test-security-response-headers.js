"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const candidates = [
  path.resolve(
    "dist/src/middlewares/"
      + "security-response-headers.js",
  ),
  path.resolve(
    "dist/middlewares/"
      + "security-response-headers.js",
  ),
];

const compiledPath =
  candidates.find(
    (candidate) =>
      fs.existsSync(candidate),
  );

if (!compiledPath) {
  console.error(
    "No se encontró el middleware compilado.",
  );

  for (const candidate of candidates) {
    console.error("-", candidate);
  }

  process.exit(1);
}

const loaded = require(compiledPath);

const createMiddleware =
  loaded.default ?? loaded;

const expectedPolicy =
  loaded.PERMISSIONS_POLICY;

assert.equal(
  typeof createMiddleware,
  "function",
);

assert.equal(
  typeof expectedPolicy,
  "string",
);

assert.match(
  expectedPolicy,
  /camera=\(\)/,
);

async function execute({
  throwError = false,
} = {}) {
  const headers = new Map();
  let nextCalled = false;

  const ctx = {
    set(name, value) {
      headers.set(
        name.toLowerCase(),
        value,
      );
    },

    remove(name) {
      headers.delete(
        name.toLowerCase(),
      );
    },
  };

  let thrown = null;

  try {
    await createMiddleware()(
      ctx,
      async () => {
        nextCalled = true;

        ctx.set(
          "X-Powered-By",
          "Strapi <strapi.io>",
        );

        if (throwError) {
          throw new Error(
            "error de prueba",
          );
        }
      },
    );
  } catch (error) {
    thrown = error;
  }

  return {
    headers,
    nextCalled,
    thrown,
  };
}

async function main() {
  const normal = await execute();

  assert.equal(
    normal.nextCalled,
    true,
  );

  assert.equal(
    normal.headers.has(
      "x-powered-by",
    ),
    false,
  );

  assert.equal(
    normal.headers.get(
      "permissions-policy",
    ),
    expectedPolicy,
  );

  const failed = await execute({
    throwError: true,
  });

  assert.ok(failed.thrown);

  assert.equal(
    failed.headers.has(
      "x-powered-by",
    ),
    false,
  );

  assert.equal(
    failed.headers.get(
      "permissions-policy",
    ),
    expectedPolicy,
  );

  console.log(
    "OK: cabeceras adicionales probadas.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
