const assert =
  require("node:assert/strict");

const fs =
  require("node:fs");

const os =
  require("node:os");

const path =
  require("node:path");

const vm =
  require("node:vm");

const Database =
  require("better-sqlite3");

const ts =
  require("typescript");

function loadTypeScriptModule(
  sourcePath,
) {
  const source =
    fs.readFileSync(
      sourcePath,
      "utf8",
    );

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
        },
        fileName: sourcePath,
      },
    ).outputText;

  const module = {
    exports: {},
  };

  const wrapper =
    `(function (
      exports,
      require,
      module,
      __filename,
      __dirname
    ) {
      ${compiled}
    })`;

  const execute =
    vm.runInThisContext(
      wrapper,
      {
        filename:
          `${sourcePath}.compiled.cjs`,
      },
    );

  execute(
    module.exports,
    require,
    module,
    sourcePath,
    path.dirname(sourcePath),
  );

  return module.exports;
}

async function main() {
  const root =
    path.resolve(
      __dirname,
      "..",
    );

  const rateLimitPath =
    path.join(
      root,
      "src",
      "utils",
      "rate-limit-local.ts",
    );

  const loaded =
    loadTypeScriptModule(
      rateLimitPath,
    );

  const {
    BoundedInMemoryRateLimiter,
    createLocalRateLimit,
  } = loaded;

  assert.equal(
    typeof BoundedInMemoryRateLimiter,
    "function",
  );

  assert.equal(
    typeof createLocalRateLimit,
    "function",
  );

  const limiter =
    new BoundedInMemoryRateLimiter(
      3,
    );

  assert.equal(
    limiter.consume({
      key: "client-a",
      maxRequests: 2,
      windowMs: 1000,
      now: 100,
    }).allowed,
    true,
  );

  assert.equal(
    limiter.consume({
      key: "client-a",
      maxRequests: 2,
      windowMs: 1000,
      now: 200,
    }).remaining,
    0,
  );

  const blocked =
    limiter.consume({
      key: "client-a",
      maxRequests: 2,
      windowMs: 1000,
      now: 300,
    });

  assert.equal(
    blocked.allowed,
    false,
  );

  assert.equal(
    blocked.retryAfterSeconds,
    1,
  );

  for (
    const key
    of [
      "client-b",
      "client-c",
      "client-d",
      "client-e",
    ]
  ) {
    limiter.consume({
      key,
      maxRequests: 2,
      windowMs: 1000,
      now: 400,
    });
  }

  assert.ok(
    limiter.size <= 3,
    "El mapa nunca debe superar su capacidad.",
  );

  const afterExpiry =
    limiter.consume({
      key: "client-a",
      maxRequests: 2,
      windowMs: 1000,
      now: 2000,
    });

  assert.equal(
    afterExpiry.allowed,
    true,
  );

  process.env
    .TEST_RATE_LIMIT_MAX =
    "2";

  process.env
    .TEST_RATE_LIMIT_WINDOW =
    "1000";

  process.env
    .RATE_LIMIT_MAX_ENTRIES =
    "100";

  const applyRateLimit =
    createLocalRateLimit({
      name: "test",
      maxRequestsEnv:
        "TEST_RATE_LIMIT_MAX",
      windowMsEnv:
        "TEST_RATE_LIMIT_WINDOW",
      defaultMaxRequests: 2,
      defaultWindowMs: 1000,
    });

  const headers = {};

  const context = {
    ip: "198.51.100.25",

    set(name, value) {
      headers[name] = value;
    },
  };

  assert.equal(
    applyRateLimit(context),
    true,
  );

  assert.equal(
    applyRateLimit(context),
    true,
  );

  assert.equal(
    applyRateLimit(context),
    false,
  );

  assert.equal(
    headers[
      "X-RateLimit-Limit"
    ],
    "2",
  );

  assert.ok(
    headers["Retry-After"],
  );

  const controllerPaths = [
    "checkout-tienda.ts",
    "estado-checkout-tienda.ts",
    "validacion-carrito-tienda.ts",
  ];

  for (
    const filename
    of controllerPaths
  ) {
    const content =
      fs.readFileSync(
        path.join(
          root,
          "src",
          "api",
          "pedido-tienda",
          "controllers",
          filename,
        ),
        "utf8",
      );

    assert.match(
      content,
      /createLocalRateLimit/,
    );

    assert.doesNotMatch(
      content,
      /new Map<string,\s*RateLimitEntry>/,
    );
  }

  const serverConfig =
    fs.readFileSync(
      path.join(
        root,
        "config",
        "server.ts",
      ),
      "utf8",
    );

  assert.match(
    serverConfig,
    /proxy:\s*{\s*koa:\s*env\.bool\(\s*['"]TRUST_PROXY['"],\s*false\s*,?\s*\)/s,
  );

  /*
   * La base local conserva permisos de registro
   * por defecto de Strapi. TodoSatcom no utiliza
   * cuentas de cliente, por lo que el middleware
   * global debe impedir que esas rutas lleguen al
   * plugin.
   */
  const middlewarePath =
    path.join(
      root,
      "src",
      "middlewares",
      "block-unused-user-auth.ts",
    );

  const middlewareLoaded =
    loadTypeScriptModule(
      middlewarePath,
    );

  const createMiddleware =
    middlewareLoaded.default ??
    middlewareLoaded;

  assert.equal(
    typeof createMiddleware,
    "function",
  );

  const middleware =
    createMiddleware();

  assert.equal(
    typeof middleware,
    "function",
  );

  async function execute(
    requestPath,
  ) {
    let nextCalled = false;

    const ctx = {
      path: requestPath,
      method: "POST",
      status: 200,
      body: null,

      request: {
        path: requestPath,
        url: requestPath,
      },
    };

    await middleware(
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

  for (
    const blockedPath
    of [
      "/api/auth/local",
      "/api/auth/local/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/refresh",
      "/api/auth/google/callback",
      "/api/connect/google",
    ]
  ) {
    const result =
      await execute(
        blockedPath,
      );

    assert.equal(
      result.nextCalled,
      false,
      `${blockedPath} no debe llegar al plugin de usuarios.`,
    );

    assert.ok(
      result.ctx.status >= 400,
      `${blockedPath} debe responder con un estado de rechazo.`,
    );
  }

  /*
   * /api/users pertenece a otra capa:
   * el middleware no necesita interceptarla
   * porque el rol público no debe disponer de
   * permisos user.find ni user.findOne.
   */
  const databasePath =
    path.join(
      root,
      ".tmp",
      "data.db",
    );

  const database =
    new Database(
      databasePath,
      {
        readonly: true,
        fileMustExist: true,
      },
    );

  try {
    const publicUserPermissions =
      database.prepare(`
        SELECT p.action
        FROM up_permissions AS p
        INNER JOIN
          up_permissions_role_lnk AS link
          ON link.permission_id = p.id
        INNER JOIN up_roles AS role
          ON role.id = link.role_id
        WHERE role.type = 'public'
          AND p.action LIKE
            'plugin::users-permissions.user.%'
        ORDER BY p.action
      `).all();

    assert.deepEqual(
      publicUserPermissions,
      [],
      "El rol público no debe poder consultar ni modificar usuarios.",
    );
  } finally {
    database.close();
  }

  const allowed =
    await execute(
      "/api/productos-tienda",
    );

  assert.equal(
    allowed.nextCalled,
    true,
  );

  console.log(
    "OK RATE LIMIT: mapas acotados, cabeceras y ventanas verificadas",
  );

  console.log(
    "OK PROXY: confianza desactivada por defecto",
  );

  console.log(
    "OK AUTH: autenticación bloqueada y usuarios sin permisos públicos",
  );
}

main().catch((error) => {
  console.error(
    "FALLO RATE LIMIT:",
    error,
  );

  process.exit(1);
});
