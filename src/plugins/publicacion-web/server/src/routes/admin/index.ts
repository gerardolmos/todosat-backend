export default () => ({
  type: "admin",
  routes: [
    {
      method: "POST",
      path: "/publish",
      handler: "controller.publish",
      config: {
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "admin::hasPermissions",
            config: {
              actions: [
                "plugin::publicacion-web.publish",
              ],
            },
          },
        ],
      },
    },
  ],
});
