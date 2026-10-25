# Implementation Plan: 007-operator-frequency-bands
**Implementation repository**: todosat-backend. Coordinador backend, SPEC global specs/007-operator-frequency-bands/spec.md (referencia frontend identifica hash).
## Summary / Technical Context
Operador REST incorpora bandas_frecuencia: string opcional, sin default, sin required. No populate extra al ser escalar. Ausente/null/vacío/blancos no produce fila. Texto no vacío se escapa mediante Astro; sin HTML, no enum/unidades implícitas. No cambia resto de técnicas ni Home. Frontend puede desplegarse antes y omitir campo ausente; backend añade columna nullable bajo deploy autorizado.
Strapi 5.51.0, Astro 7.2.4, Node24 local y dependencias existentes. Sin producción ni nuevas dependencias. Persistencia: solo schema local; pruebas datos ficticios. Máximo mismo volumen actual Home.
## Constitution Check
PASS preparación: copia 2.0.0 idéntica, autoridad backend, artefactos locales, pruebas temporales sin .env ni red. Sin hooks. No reabrir Features cerradas. Cambios compartidos mínimos pertenecen a este ID. No modificar trabajo ajeno ni incluirlo en staging.
## Project Structure
src/api/operador/content-types/operador/schema.json; tests/operator-frequency/schema.test.cjs
## Validación
Backend: validador REAL instalado de Strapi con modelo mínimo del atributo y strapi mock que prohíbe DB; creación/update y opcionalidad. No afirmar persistencia SQL verificada. Frontend: selectores/redirects unitarios y build aislado con API ficticia y transporte bloqueado, inspección HTML final. No Chrome.
## Coordinación y publicación (NO ejecutada)
Pareja de SHAs se registra en QA, diff identificado por hashes si sin commit. Frontend tolera estado antiguo. Deploy backend primero para habilitar contrato/default, verificar compatibilidad, frontend después. Para categorías operación humana por identidad y build posterior separados; sin scripts de datos. No se autoriza publicar ninguna revisión local por este plan.
## Complexity Tracking
Sin infraestructura nueva; sin migraciones ni backfill. Dependencias productivas no bloquean código local salvo pictogramas suministrados.

Tipos generados: actualizar únicamente el atributo afectado en types/generated/contentTypes.d.ts; verificar con tsc --noEmit --incremental false, sin cargar Strapi ni .env.
