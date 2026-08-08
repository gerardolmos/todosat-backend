/*
 * TodoSatcom Info se desplegará antes que la tienda.
 *
 * Fail-closed:
 * la API comercial solo existe públicamente cuando
 * STORE_ENABLED vale exactamente "true".
 *
 * No afecta al panel /admin ni elimina Content Types,
 * campos, relaciones o arquitectura de la tienda.
 */

const STORE_API_PATTERN =
  /^\/api\/(?:tienda(?:\/|$)|[^/]*tienda(?:\/|$))/;

export function isStorePublicApiPath(
  path: string,
): boolean {
  return STORE_API_PATTERN.test(path);
}

interface MiddlewareContext {
  path: string;
  status: number;
  body: unknown;
}

type Next = () => Promise<unknown>;

export default () => {
  return async function blockStorePublicApi(
    ctx: MiddlewareContext,
    next: Next,
  ): Promise<void> {
    const storeEnabled =
      process.env.STORE_ENABLED === "true";

    if (
      storeEnabled ||
      !isStorePublicApiPath(ctx.path)
    ) {
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
