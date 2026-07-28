#!/usr/bin/env bash

set -euo pipefail

node scripts/test-customer-data-boundary.cjs
node scripts/test-checkout-customer-data-config.cjs

./node_modules/.bin/strapi console <<'STRAPI_CONSOLE'
.load scripts/test-tienda.js
STRAPI_CONSOLE

./node_modules/.bin/strapi console <<'STRAPI_CONSOLE'
.load scripts/test-webhook-lifecycle.js
STRAPI_CONSOLE
