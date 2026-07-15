export default {
  routes: [
    {
      method: "POST",

      path:
        "/tienda/checkout",

      handler:
        "checkout-tienda.crearCheckout",

      config: {
        /*
         * No requiere una cuenta de cliente.
         * La operación se protege mediante:
         * - validación del carrito en servidor;
         * - clave de idempotencia;
         * - limitación de frecuencia;
         * - feature flag;
         * - Stripe Checkout alojado.
         */
        auth: false,

        policies: [],
      },
    },
  ],
};
