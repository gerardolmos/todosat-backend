export default {
  routes: [
    {
      method: "POST",

      path:
        "/tienda/stripe/webhook",

      handler:
        "webhook-stripe-tienda.recibir",

      config: {
        /*
         * No usa sesión de usuario:
         * la autenticación es la firma
         * criptográfica de Stripe.
         */
        auth: false,

        policies: [],
      },
    },
  ],
};
