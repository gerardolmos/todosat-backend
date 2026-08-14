const REQUEST_TIMEOUT_MS = 10_000;
const COOLDOWN_MS = 30_000;

let isTriggering = false;
let lastTriggeredAt = 0;

const controller = () => ({
  async publish(ctx) {
    const hookUrl =
      process.env.NETLIFY_BUILD_HOOK_URL?.trim();

    if (!hookUrl) {
      ctx.status = 503;
      ctx.body = {
        data: null,
        error: {
          status: 503,
          name: "ServiceUnavailableError",
          message:
            "La publicación web todavía no está configurada.",
        },
      };

      return;
    }

    let parsedHookUrl: URL;

    try {
      parsedHookUrl = new URL(hookUrl);
    } catch {
      ctx.status = 500;
      ctx.body = {
        data: null,
        error: {
          status: 500,
          name: "ConfigurationError",
          message:
            "La configuración de publicación no es válida.",
        },
      };

      return;
    }

    const isLocalDevelopment =
      process.env.NODE_ENV !== "production" &&
      (
        parsedHookUrl.hostname === "127.0.0.1" ||
        parsedHookUrl.hostname === "localhost"
      );

    if (
      parsedHookUrl.protocol !== "https:" &&
      !isLocalDevelopment
    ) {
      ctx.status = 500;
      ctx.body = {
        data: null,
        error: {
          status: 500,
          name: "ConfigurationError",
          message:
            "La configuración de publicación no es válida.",
        },
      };

      return;
    }

    if (isTriggering) {
      ctx.status = 409;
      ctx.body = {
        data: null,
        error: {
          status: 409,
          name: "ConflictError",
          message:
            "Ya hay una solicitud de publicación en curso.",
        },
      };

      return;
    }

    const elapsed = Date.now() - lastTriggeredAt;

    if (
      lastTriggeredAt > 0 &&
      elapsed < COOLDOWN_MS
    ) {
      ctx.status = 429;
      ctx.body = {
        data: null,
        error: {
          status: 429,
          name: "TooManyRequestsError",
          message:
            "La web acaba de enviarse a publicar. Espera unos segundos antes de volver a intentarlo.",
        },
      };

      return;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      REQUEST_TIMEOUT_MS,
    );

    isTriggering = true;

    try {
      const response = await fetch(parsedHookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{}",
        signal: abortController.signal,
      });

      if (!response.ok) {
        ctx.status = 502;
        ctx.body = {
          data: null,
          error: {
            status: 502,
            name: "BadGatewayError",
            message:
              "Netlify no ha aceptado la solicitud de publicación.",
          },
        };

        return;
      }

      lastTriggeredAt = Date.now();

      ctx.status = 200;
      ctx.body = {
        data: {
          triggered: true,
        },
      };
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        error.name === "AbortError";

      ctx.status = timedOut ? 504 : 502;

      ctx.body = {
        data: null,
        error: {
          status: ctx.status,
          name: timedOut
            ? "GatewayTimeoutError"
            : "BadGatewayError",
          message: timedOut
            ? "Netlify ha tardado demasiado en responder."
            : "No se ha podido contactar con Netlify.",
        },
      };
    } finally {
      clearTimeout(timeout);
      isTriggering = false;
    }
  },
});

export default controller;
