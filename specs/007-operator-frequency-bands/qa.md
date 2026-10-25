# QA — 007-operator-frequency-bands
## Pareja exacta y diff validado
Backend base `6a626c9728bedacd35748cf1102ffd1df3fd0b0d`, frontend base `7f41814d299781c01b83c2163a4a979a55791899` más archivos identificados abajo (working tree antes de commits). No revisiones productivas inferidas. Pruebas conjuntas 006/007 por contrato y build; sin reabrir documentación 001–004.

## Fases SDD
SPECIFY/CLARIFY 16/16: sin ambigüedad imprescindible, dependencias externas explícitas. PLAN y TASKS locales con SPEC global backend/referencia hash frontend. ANALYZE PASS para trabajo local: 3 FR y 2 SC; esquema/validator opcional, render y build presencia/ausencia/escape, diff conserva otras métricas. Cero contradicciones constitucionales; ninguna tarea operativa productiva autorizada por estos artefactos. Presets locales y scripts oficiales utilizados; sin hooks.

## Pruebas ejecutadas
- Backend: 4/4 tests PASS mediante entity-validator real Strapi 5.51.0, modelo de atributos afectados, DB prohibida en stub. Default false, true/false explícitos, updates omiten campo, bandas opcionales/null/texto. RED previo: fallos por default true y campo ausente; GREEN después. No arranque Strapi ni prueba de persistencia SQL.
- Frontend: 7/7 tests PASS: selección, orden, límite siete, dedup, vacío sin fallback; redirects exactos/paginación/orden, preservación de rutas antiguas/reglas existentes y colisión de artículo con slug destino.
- Build Astro completo y postbuild PASS en copia temporal sin .env real, HOME temporal y API de fixtures mediante fetch interceptado. Conexiones TCP bloqueadas por guard de Node verificado antes del build; ninguna API real consultada, ningún servidor abierto. Se comprobó HTML final Home destacados 1–7 excluyendo ordinaria 0 y destacada 8; recomendación independiente/archivo conservados; rutas regulacion/defensa, paginación y detalle; redirects sin Hardware.
- HTML de operadores: bandas presentes escapadas (incluido texto <script> ficticio); omitidas para ausencia/null/blancos; Cobertura/Satélites/Velocidad/Latencia/Tipo de órbita presentes. No modifica imagen ni descripciones.
- Backend TypeScript: tsc --noEmit --incremental false PASS; tipos generados afectados alineados. No build/admin Strapi ni conexión DB, no afirmación de migración acreditada.
- git diff --check PASS. Revisión diff: Hardware/schema/tienda/publicacion-web sin cambios; postbuild añade generador después de lógica tienda existente, sin alterarla. No Chrome/zoom ni nuevas pruebas visuales.
- Laboratorio build eliminado al finalizar; no proceso persistente. No nuevas dependencias ni cambios de variables/secretos.

## Límites y producción
Campo nuevo nullable requiere deploy backend y sincronización de esquema autorizados; no ejecutados. Frontend tolera campo ausente. Edición manual futura de Carlos, sin poblar registros existentes. No prueba SQL ni CMS administrativo real.

## CONVERGE local
Evaluación de intención/código: 3 FR, 2 SC, 1 historia y decisiones del PLAN verificadas contra diff y evidencia. 0 missing, 0 partial, 0 contradicts, 0 unrequested para alcance local autorizado; dependencias externas señaladas, no se declara cierre productivo. Tareas completadas bajo IMPLEMENT antes de CONVERGE; CONVERGE no cambia tasks.md. Sin autorización de push/deploy/operaciones de datos. Commits locales exclusivos autorizados por encargo.

## Identificación de archivos validados
- backend/src/api/noticia/content-types/noticia/schema.json: `04b64356e43b1d5547dffa072dff9f36a00b1573f8d64bbb9416448a25724a24`
- backend/src/api/operador/content-types/operador/schema.json: `ee41053cfa45383f240b3b89d39734fe85b26e62b6416851bfbcb5d371b17d9a`
- backend/types/generated/contentTypes.d.ts: `de8e8f7962c173ecde96c5b0b13ccd086cbc581c91ea213b59cf238b7616b2fc`
- backend/tests/editorial-news/default.test.cjs: `01c79e920656340a592947c339617d2d274194651522eaebe8d8c0df0d807289`
- backend/tests/operator-frequency/schema.test.cjs: `f43fb3b2089dfcdda460f3345cc895419f8822ee0a7eb91781d6eca64a52df56`
- frontend/src/lib/news-home.ts: `bf0c2876f711e6e953084fee2b47fd719a326a1838468d994415b5d3bcabc3ff`
- frontend/src/lib/content.ts: `9d4052f476c82364f1835bee25b1ba030f12b3429328319766a3bc97e24f55cb`
- frontend/src/pages/index.astro: `111f99630b24472cc81ae0b65398d6371119b34794dc737604e6b07a8d7ff7e3`
- frontend/src/components/HomeArticlesSection.astro: `b617cc42d8362046dd74e38d6ef3148344858186a21d84c91af622acbdc40060`
- frontend/src/pages/noticias/[...page].astro: `9052d144d902022eae303a63d82ad71b60d10261cc6bd8dddfe4e72155ca9182`
- frontend/src/pages/operadores/[slug]/index.astro: `dcdf40d35aaa67d39ba93dd8461040f070502edd9bb132e8dec7995a955936a4`
- frontend/scripts/postbuild.mjs: `aac064df9eadadc48dcad0464eefef940ccd5a019393904c7ce4c6e428b86eac`
- frontend/scripts/news-category-redirects.mjs: `5484947cd243297ca94a319f2cdaeccdab81fd0972a67ca1f55b2235b1927f8e`
- frontend/tests/editorial-news/build.mjs: `fc8c4c7ebff67ee0354509f577f4aceb6c48e99945012277b78968b585e9cb99`
- frontend/tests/editorial-news/news.test.mjs: `193f1db59b2b4edfebfd3b517ca83689f97a6a6348455f1caf708367ab914db5`
- frontend/tests/editorial-news/redirects.test.mjs: `4e5cb75509cb91bcd9c61f1d2f55a8194c892e5109d4ae51084ed2551f6cf07d`
- frontend/tests/operator-frequency/render.test.mjs: `b3805f10f5326965ac6bcbb4460e371f39a52d1b9375e231f4233b3c93d72747`
