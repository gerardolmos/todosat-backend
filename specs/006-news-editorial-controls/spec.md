# Feature Specification: Noticias: selección y categorías
**Scope**: cross-repo | **Common ID**: 006-news-editorial-controls
**Repository / coordinator**: todosat-backend por cambio de contrato/esquema. Frontend conserva referencia, no segunda SPEC.
**Created**: 2026-10-25 | **Branch**: main local, sin rama nueva | **Status**: SPECIFY/CLARIFY completos, trabajo local autorizado.
## User Scenarios & Testing
### User Story 1 — Selección editorial (P1)
Carlos marca noticias y la Home muestra solo las destacadas activas publicadas, hasta siete, ordenadas por fecha reciente y sin duplicar documentos. Las recomendaciones mantienen su colección independiente.
Prueba independiente: una noticia antigua destacada prevalece sobre una reciente no destacada; cero seleccionadas deja acceso al archivo sin rellenar con otras noticias.
### User Story 2 — Creación consciente (P1)
Una nueva noticia sin selección explícita no se destaca. Valores explícitos y noticias existentes se conservan.
Prueba independiente: creación omitida → false; true explícito → true; actualización ajena no cambia destacado.
### User Story 3 — Categorías (P2)
Preparar Gaming→Regulación y Movilidad de Noticias→Defensa conservando identidad/relaciones; Hardware Movilidad sigue igual. Las URLs antiguas llevan al destino nuevo cuando existe, sin redirigir otras páginas.
Prueba independiente: fixtures antiguos y nuevos conservan enlaces/noticias; redirecciones solo a páginas nuevas existentes. Pictogramas solo oficiales proporcionados, si faltan queda dependencia explícita.

### Edge Cases
Contenido antiguo sin campos nuevos; selección vacía; valores explícitos; datos editoriales cambiando entre preparación y ejecución. Ninguna lectura/escritura productiva para pruebas.
## Requirements
- FR-001: Home usa solo noticias destacadas activas publicadas, máximo siete y sin duplicados; archivo/búsqueda mantienen las demás.
- FR-002: Recomendados conserva colección, orden y comportamiento; no se mezcla con el booleano de Noticias.
- FR-003: Nuevas noticias por defecto no destacadas; decisiones existentes/valores explícitos intactos.
- FR-004: Preparar nombres Regulación/Defensa y slugs regulacion/defensa para mismas categorías de Noticias, sin tocar Hardware.
- FR-005: Preparar transición de enlaces antiguos solo si destino existe y origen no representa contenido vigente, incluidas páginas/orden antiguo.
- FR-006: No inventar pictogramas; documentar dependencia y operación productiva separada no ejecutada.

## Key Entities
Noticia, categoría de Noticias y operador mantienen identidad documental y relaciones; no se importan datos reales para QA.
## Success Criteria
- SC-001: Todos los escenarios anteriores pasan con fixtures, sin registros existentes modificados.
- SC-002: Cero cambios productivos, secretos, nuevos servicios o cambios ajenos.
## Clarifications
Sin decisión imprescindible pendiente para trabajo local. Siete conserva límite actual. Sin fallback a no destacadas. Categorías son datos, no enum; se renombrarán por documentId solo con autorización posterior. Pictogramas no localizados no bloquean código independiente.
## Assumptions / Dependencies
Pruebas solo fixtures aislados sin .env real ni red; no abrir Chrome. Deploys/migraciones separados y no autorizados. Features cerradas no se reabren: cambios puntuales sobre componentes compartidos pertenecen a este ID.
