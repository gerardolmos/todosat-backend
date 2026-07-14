import { factories } from "@strapi/strapi";
import type Stripe from "stripe";

import {
  procesarEventoStripeSeguro,
} from "./webhook-stripe";

export default factories.createCoreService(
  "api::evento-stripe-tienda.evento-stripe-tienda",
  ({ strapi }) => ({
    async procesarEventoStripeSeguro(
      event: Stripe.Event,
    ) {
      return procesarEventoStripeSeguro({
        strapi,
        event,
      });
    },
  }),
);
