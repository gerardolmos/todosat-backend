/*
 * TodoSatcom no utiliza cuentas públicas
 * de clientes.
 *
 * Este middleware cierra las rutas públicas
 * de autenticación de Users & Permissions.
 *
 * El administrador de Strapi utiliza /admin
 * y no queda afectado.
 */

const BLOCKED_PREFIXES = [
  "/api/auth",
  "/api/connect",
] as const;

export function isBlockedPath(
  path: string,
): boolean {
  return BLOCKED_PREFIXES.some(
    (prefix) =>
      path === prefix ||
      path.startsWith(`${prefix}/`),
  );
}

interface MiddlewareContext {
  path: string;
  status: number;
  body: unknown;
}

type Next = () => Promise<unknown>;

export default () => {
  return async function blockUnusedUserAuth(
    ctx: MiddlewareContext,
    next: Next,
  ): Promise<void> {
    if (!isBlockedPath(ctx.path)) {
      await next();
      return;
    }

    ctx.status = 404;

    ctx.body = {
      data: null,
      error: {
        status: 404,
        name: "NotFoundError",
        message: "Not Found",
        details: {},
      },
    };
  };
};
