import type { Core } from "@strapi/strapi";

const register = async ({
  strapi,
}: {
  strapi: Core.Strapi;
}) => {
  await strapi
    .service("admin::permission")
    .actionProvider.registerMany([
      {
        section: "plugins",
        displayName: "Publicar cambios en la web",
        uid: "publish",
        pluginName: "publicacion-web",
      },
    ]);
};

export default register;
