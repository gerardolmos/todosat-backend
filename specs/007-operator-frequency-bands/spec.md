# Feature Specification: Bandas de frecuencia de Operadores
**Scope**: cross-repo | **Common ID**: 007-operator-frequency-bands
**Repository / coordinator**: todosat-backend por cambio de contrato/esquema. Frontend conserva referencia, no segunda SPEC.
**Created**: 2026-10-25 | **Branch**: main local, sin rama nueva | **Status**: SPECIFY/CLARIFY completos, trabajo local autorizado.
## User Scenarios & Testing
### User Story 1 — Información técnica opcional (P1)
Carlos puede indicar bandas como texto libre opcional; el lector las ve en Información técnica sin perder los demás datos.
Prueba independiente: valor presente aparece escapado; ausente/null/vacío/blancos oculta la fila y no afecta otras métricas ni Home.

### Edge Cases
Contenido antiguo sin campos nuevos; selección vacía; valores explícitos; datos editoriales cambiando entre preparación y ejecución. Ninguna lectura/escritura productiva para pruebas.
## Requirements
- FR-001: Añadir Bandas de frecuencia opcional, texto libre coherente con datos técnicos; sin catálogo cerrado ni valor por defecto.
- FR-002: Mostrar valor como texto en ficha individual y ocultar si no hay texto significativo.
- FR-003: No modificar otros campos, registros ni relaciones; frontend compatible con campo ausente.

## Key Entities
Noticia, categoría de Noticias y operador mantienen identidad documental y relaciones; no se importan datos reales para QA.
## Success Criteria
- SC-001: Todos los escenarios anteriores pasan con fixtures, sin registros existentes modificados.
- SC-002: Cero cambios productivos, secretos, nuevos servicios o cambios ajenos.
## Clarifications
Sin decisión imprescindible pendiente para trabajo local. Texto libre como los demás valores técnicos; no unidades ni enum impuestos. No icono inventado: fila textual si no hay recurso apropiado.
## Assumptions / Dependencies
Pruebas solo fixtures aislados sin .env real ni red; no abrir Chrome. Deploys/migraciones separados y no autorizados. Features cerradas no se reabren: cambios puntuales sobre componentes compartidos pertenecen a este ID.
