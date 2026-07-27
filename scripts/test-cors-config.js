"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const compiledCandidates = [
  path.resolve(
    "dist/config/middlewares.js",
  ),
  path.resolve(
    "dist/config/middlewares/index.js",
  ),
];

const compiledPath =
  compiledCandidates.find(
    (candidate) =>
      fs.existsSync(candidate),
  );

if (!compiledPath) {
  console.error(
    "No se encontró la configuración compilada.",
  );

  process.exit(1);
}

const loaded = require(compiledPath);
const createConfig =
  loaded.default ?? loaded;

function createEnv({
  nodeEnv,
  corsOrigins,
}) {
  const env = (name, fallback) => {
    if (name === "NODE_ENV") {
      return nodeEnv;
    }

    return fallback;
  };

  env.array = (name, fallback) => {
    if (
      name === "CORS_ALLOWED_ORIGINS" &&
      Array.isArray(corsOrigins)
    ) {
      return corsOrigins;
    }

    return fallback;
  };

  return env;
}

function getCorsConfig(options) {
  const middlewares =
    createConfig({
      env: createEnv(options),
    });

  const cors = middlewares.find(
    (middleware) =>
      typeof middleware === "object" &&
      middleware.name ===
        "strapi::cors",
  );

  assert.ok(
    cors,
    "Debe existir strapi::cors.",
  );

  return cors.config;
}

function originResult(
  cors,
  origin,
) {
  return cors.origin({
    request: {
      header: {
        origin,
      },
    },
  });
}

const development =
  getCorsConfig({
    nodeEnv: "development",
  });

assert.equal(
  originResult(
    development,
    "http://localhost:4321",
  ),
  "http://localhost:4321",
);

assert.equal(
  originResult(
    development,
    "http://127.0.0.1:4321",
  ),
  "http://127.0.0.1:4321",
);

assert.equal(
  originResult(
    development,
    "https://evil.example",
  ),
  "",
);

const production =
  getCorsConfig({
    nodeEnv: "production",
  });

assert.equal(
  originResult(
    production,
    "https://todosatcom.com",
  ),
  "https://todosatcom.com",
);

assert.equal(
  originResult(
    production,
    "https://www.todosatcom.com",
  ),
  "https://www.todosatcom.com",
);

assert.equal(
  originResult(
    production,
    "http://localhost:4321",
  ),
  "",
);

assert.equal(
  production.credentials,
  false,
);

assert.deepEqual(
  production.methods,
  [
    "GET",
    "POST",
    "HEAD",
    "OPTIONS",
  ],
);

assert.ok(
  production.headers.includes(
    "Idempotency-Key",
  ),
);

const overridden =
  getCorsConfig({
    nodeEnv: "production",
    corsOrigins: [
      "https://preview.example",
    ],
  });

assert.equal(
  originResult(
    overridden,
    "https://preview.example",
  ),
  "https://preview.example",
);

assert.equal(
  originResult(
    overridden,
    "https://todosatcom.com",
  ),
  "",
);

console.log(
  "OK: configuración CORS compilada y probada.",
);
