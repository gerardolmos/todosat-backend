/*
 * Cabeceras adicionales de seguridad.
 *
 * La CSP, HSTS, frameguard y nosniff
 * continúan gestionados por strapi::security.
 */

export const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "camera=()",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");

interface MiddlewareContext {
  set(
    name: string,
    value: string,
  ): void;

  remove(name: string): void;
}

type Next = () => Promise<unknown>;

export default () => {
  return async function securityResponseHeaders(
    ctx: MiddlewareContext,
    next: Next,
  ): Promise<void> {
    try {
      await next();
    } finally {
      /*
       * Evita revelar la tecnología aunque
       * otra capa intente añadir la cabecera.
       */
      ctx.remove("X-Powered-By");

      ctx.set(
        "Permissions-Policy",
        PERMISSIONS_POLICY,
      );
    }
  };
};
