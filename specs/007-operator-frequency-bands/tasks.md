# Tasks: 007-operator-frequency-bands
**Repository**: todosat-backend. Solo local; otras operaciones no autorizadas.
## Phase 1: Setup
- [x] T001 Leer SPEC global, contrato y plan de specs/007-operator-frequency-bands/; verificar gobernanza.
## Phase 2: Historias locales
- [x] T002 [US1] Verificar campo opcional con validador real en tests/operator-frequency/schema.test.cjs.
- [x] T003 [US1] Añadir solo bandas_frecuencia string opcional en src/api/operador/content-types/operador/schema.json.
## Phase 3: QA y CONVERGE
- [x] T004 Registrar evidencias, pareja SHA/diff y revisión CONVERGE en specs/007-operator-frequency-bands/qa.md.
## Dependencias / estrategia
Setup → pruebas → código → QA → CONVERGE. Pruebas de historias independientes; sin [P] por archivos compartidos. No repetir suites cerradas ajenas. No datos ni deploy. Pictogramas se integrarán únicamente cuando se proporcionen; dependencia externa documentada, sin inventar assets. MVP local verificable, preparación productiva separada.
