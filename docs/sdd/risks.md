# Registro inicial de riesgos

Fuente: consolidación de FASE 0 y evidencia manual del operador. Todos los registros permanecen abiertos; esta misión no verifica ni remedia ninguno. Responsable de resolución y plazo: pendientes de asignación.

Un riesgo no se convierte automáticamente en deuda técnica ni en feature. Se distingue configuración observada, limitación documentada y falta de evidencia.

| ID | Evidencia / naturaleza | Riesgo o impacto | Condición de cierre o reevaluación |
| --- | --- | --- | --- |
| RISK-XSS | Hallazgo anterior referido por el operador: `renderBlocks.ts` / `set:html`. Corrección y alcance desplegado no acreditados aquí. | Posible ejecución de contenido no confiable al renderizar HTML. | Analizar el alcance y aportar evidencia de corrección o descarte y regresión pertinente. |
| RISK-ENV-ISOLATION | Local puede apuntar a producción; Netlify comparte variables entre contextos. | Scripts, arranques o pruebas pueden consumir o modificar servicios reales. | Destinos y credenciales identificados, separación verificable y controles contra escrituras productivas accidentales. |
| RISK-AUTODEPLOY-FRONTEND | Push/merge a `main` dispara Netlify; publicación editorial también puede disparar un hook. | Publicación no prevista, incluso por cambios no funcionales. | Controlar las vías de publicación y acreditar gates efectivos; el autodeploy no es por sí mismo un defecto. |
| RISK-AUTODEPLOY-BACKEND | Push/merge a `main` dispara Railway; Wait for CI desactivado. | Despliegue no previsto o previo a completar validaciones. | Acreditar controles de publicación y validación del commit exacto antes de integrar. |
| RISK-BACKUP | Sin backup programado; copia visible, integridad y restore no probados; PITR no acreditado. | Pérdida de datos y recuperación incierta. | Backup verificable, comprobado, restore ensayado y runbook; acordar periodicidad, RPO/RTO y responsables. |
| RISK-STAGING | Sin staging verificado para frontend, backend o PostgreSQL. | No hay destino acreditado para ensayos integrados seguros. | Acreditar un entorno aislado adecuado antes de pruebas que lo requieran. |
| RISK-PROCESS-LOCAL | Rate limiting en memoria y exclusión concurrente del webhook por proceso documentados; una réplica observada. | Reinicios reinician límites; no se acredita coordinación entre procesos o durante solapamientos de despliegue. | Validar topología y necesidades de concurrencia antes de ampliar escala o efectos externos. Es una limitación de alcance deliberada, no deuda automática. |
| RISK-HEALTHCHECK | Backend sin healthcheck path configurado. | Deployment successful no acredita disponibilidad funcional. | Definir y verificar comprobación de salud y criterio operativo de despliegue. |
| RISK-MEDIA-RECOVERY | Backup, retención y recuperación de Cloudinary no verificados. | Recuperación de assets eliminados o dañados no demostrada. | Acreditar política y procedimiento de recuperación con evidencia pertinente. |

Las protecciones de `main` y CI siguen pendientes de verificar y se vinculan a los riesgos de autodeploy. Runbook y recuperación pertenecen a RISK-BACKUP y RISK-MEDIA-RECOVERY. Su inclusión no autoriza cambios de infraestructura.
