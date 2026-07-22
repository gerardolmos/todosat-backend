#!/usr/bin/env bash

set -euo pipefail

./node_modules/.bin/strapi console <<'STRAPI_CONSOLE'
.load scripts/test-tienda.js
STRAPI_CONSOLE
