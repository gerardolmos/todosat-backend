# Gates de producción

Estas reglas son requisitos heredados, no evidencia de que ya estén satisfechos ni autorización para ejecutar operaciones.

## Antes de cualquier operación capaz de afectar datos, schemas, medios o producción

1. Backup verificable.
2. Comprobación del backup.
3. Mecanismo de restauración conocido.
4. Análisis de impacto.
5. Rollback documentado.
6. Entorno identificado.
7. Comprobación de que no se actúa accidentalmente sobre producción.
8. Aprobación explícita de Gerard.

Registrar la evidencia aplicable a cada gate antes de ejecutar la operación. La existencia de una copia visible no acredita integridad ni restaurabilidad. Un rollback de código no revierte necesariamente datos o schemas.

## Reglas adicionales

- Push/merge a `todosat-frontend/main` = acción de producción (Netlify).
- Push/merge a `todosat-backend/main` = acción de producción (Railway).
- Los cambios exclusivamente documentales dentro de esos repositorios también pueden disparar deploys.
- La publicación editorial por hook de Netlify es otra vía de publicación sujeta a control.
- Tests con escritura requieren un entorno inequívocamente no productivo, destinos identificados y ausencia de efectos externos reales no autorizados.
- Implementar NO implica autorización para push o deploy.
- Aprobar documentación NO implica autorización para implementar.
- No presumir aislamiento por trabajar localmente o por usar una URL de preview.
- No dar por satisfechos gates mediante el cierre de FASE 0: sus pendientes siguen abiertos.

Consultar [risks.md](risks.md), especialmente RISK-ENV-ISOLATION, RISK-BACKUP, RISK-STAGING y los riesgos de autodeploy. El repositorio histórico local SDD se conserva sin cambios. Estos documentos se custodian en todosat-backend, repositorio de implementación con vía de despliegue; la documentación no debe convertirse en una vía indirecta de publicación. La transición fue completada y aceptada por Gerard el 2026-10-12; los gates mantienen su vigencia.
