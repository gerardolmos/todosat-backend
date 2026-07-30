#!/usr/bin/env bash

set -euo pipefail

node scripts/test-customer-data-boundary.cjs
node scripts/test-checkout-customer-data-config.cjs
node scripts/test-stripe-version-contract.cjs
node scripts/test-checkout-customer-data-normalizer.cjs
node scripts/test-seaconnect-simulado.cjs

./node_modules/.bin/strapi console <<'STRAPI_CONSOLE'
.load scripts/test-tienda.js
STRAPI_CONSOLE

./node_modules/.bin/strapi console <<'STRAPI_CONSOLE'
.load scripts/test-webhook-lifecycle.js
STRAPI_CONSOLE

echo "Comprobando rate limiting, proxy y rutas de autenticación…"
node scripts/test-rate-limit-local.cjs
