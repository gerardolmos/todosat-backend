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

    ctx.status = 501;
    ctx.body = {
      data: null,
      error: {
        status: 501,
        name: "NotImplementedError",
        message:
          "La conexión con Netlify todavía no está activada.",
      },
    };
  },
});

export default controller;
