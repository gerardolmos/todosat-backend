export default {
  routes: [
    {
      method: "POST",

      path:
        "/tienda/carrito/validar",

      handler:
        "validacion-carrito-tienda.validarCarrito",

      config: {
        /*
         * Ruta sin cuenta de cliente.
         * Solo valida identificadores y
         * cantidades contra Strapi.
         */
        auth: false,
        policies: [],
      },
    },
  ],
};
