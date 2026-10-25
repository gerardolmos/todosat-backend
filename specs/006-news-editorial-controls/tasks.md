# Tasks: 006-news-editorial-controls
**Repository**: todosat-backend. Solo local; otras operaciones no autorizadas.
## Phase 1: Setup
- [x] T001 Leer SPEC global, contrato y plan de specs/006-news-editorial-controls/; verificar gobernanza.
## Phase 2: Historias locales
- [x] T002 [US2] Verificar creación false, true explícito y update sin sobrescribir mediante validador Strapi en tests/editorial-news/default.test.cjs.
- [x] T003 [US2] Cambiar solo default de destacado en src/api/noticia/content-types/noticia/schema.json.
- [x] T004 [US3] Preparar operación por identidad, concurrencia y reversión sin escrituras en specs/006-news-editorial-controls/contracts/category-operation.md.
## Phase 3: QA y CONVERGE
- [x] T005 Registrar evidencias, pareja SHA/diff y revisión CONVERGE en specs/006-news-editorial-controls/qa.md.
## Dependencias / estrategia
Setup → pruebas → código → QA → CONVERGE. Pruebas de historias independientes; sin [P] por archivos compartidos. No repetir suites cerradas ajenas. No datos ni deploy. Pictogramas se integrarán únicamente cuando se proporcionen; dependencia externa documentada, sin inventar assets. MVP local verificable, preparación productiva separada.
