export default {
  routes: [
    {
      method: "POST",

      path:
        "/tienda/checkout/estado",

      handler:
        "estado-checkout-tienda.consultarEstado",

      config: {
        /*
         * No requiere una cuenta de cliente.
         *
         * El identificador de sesión actúa como
         * referencia de capacidad y el endpoint
         * solo devuelve un estado muy limitado.
         *
         * Nunca consulta Stripe ni expone datos
         * personales, importes o datos del pedido.
         */
        auth: false,

        policies: [],
      },
    },
  ],
};
