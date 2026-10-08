# FASE 0 — Cierre con pendientes documentados

**Estado:** CERRADA CON PENDIENTES DOCUMENTADOS.
**Fecha de cierre:** 2026-10-04, según el contexto de la conversación de cierre (Europe/Madrid). No representa la fecha de cada comprobación manual de infraestructura.

El cierre acredita una fotografía suficiente para adoptar SDD; no acredita preparación para ventas reales ni autoriza cambios en producción.

## Arquitectura conocida

| Componente | Evidencia consolidada |
| --- | --- |
| Frontend | Astro; repositorio `gerardolmos/todosat-frontend`; Netlify `exquisite-gelato-5c153c`; dominio `exquisite-gelato-5c153c.netlify.app`. |
| Deploy frontend | `main` → producción; auto publishing activo. Último publicado observado: `7317ed0`, «fix: align hardware hero chips». |
| Backend | Strapi; repositorio `gerardolmos/todosat-backend`; Railway `todosat-backend`, ACTIVE / successful; Node 20.20.2, Railpack, una réplica, EU West (Amsterdam). |
| Deploy backend | `main` → producción automáticamente; Wait for CI desactivado. Dominio `todosat-backend-production.up.railway.app`, puerto público 8080; private networking activo; sin healthcheck path configurado. |
| PostgreSQL | Railway ONLINE; EU West, una réplica; imagen `ghcr.io/railwayapp-templates/postgres-ssl:18`; volumen `postgres-volume`; HA y PgBouncer no activados. Deployment observado iniciado por auto update. |
| Media | Cloudinary TodoSatcom activo, plan Free, Dynamic folders. Backup, retención y recuperación de assets no verificados. |
| Flujo editorial | Strapi → hook de Netlify → publicación frontend; historial observado «Publicar desde Strapi». |

No hay custom domain en Netlify; `todosatcom.com` no está asociado. Las variables de Netlify observadas se comparten entre deploy contexts; un preview no acredita aislamiento. Los nombres de variables existentes no demuestran sus valores ni la activación de funciones.

## Staging y recuperación

- No hay staging verificado de frontend, backend ni PostgreSQL. No equivale a demostrar inexistencia absoluta.
- No hay backup schedule activo de PostgreSQL.
- Existe al menos un backup visible: `Pre-Security-Patch Backup`, aproximadamente un mes de antigüedad y 119 MB en la observación del operador.
- Integridad del backup y restauración NO probadas.
- PITR no acreditado como activo; la interfaz observada indica plan Pro para crear backups y PITR.
- Runbook, RPO y RTO no acreditados. El volumen persistente no sustituye a un backup.

## Evidencia y límites

La infraestructura procede de comprobaciones manuales proporcionadas por el operador; no se verificó externamente durante la consolidación ni durante esta materialización. La documentación local consultada en FASE 0 respalda el flujo editorial y los límites de controles por proceso.

El informe completo de la auditoría local anterior no estaba disponible en el chat de consolidación. Los hallazgos XSS y posible conexión local a producción se conservaron por referencia explícita del operador; no se repitió su auditoría ni se acreditó su corrección. Las pruebas históricas no se consideran pruebas actuales.

Siguen sin verificarse, entre otros: SHA del backend desplegado y su correspondencia con lo auditado, banderas efectivas, protecciones de ramas/CI, aislamiento de entornos, recuperación de datos/media y configuración efectiva del proxy y coordinación entre procesos.

Los pendientes quedan en [risks.md](risks.md) y [backlog.md](backlog.md). No bloquean documentación SDD, pero pueden bloquear operaciones según [production-gates.md](production-gates.md).
