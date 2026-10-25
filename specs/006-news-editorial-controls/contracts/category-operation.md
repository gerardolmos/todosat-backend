# Operación editorial futura — NO EJECUTAR

Preparación completa; no conexión ni cambio de datos en esta feature local.

| Colección exclusiva | Identidad a verificar en ejecución | Nombre actual → nuevo | Slug propuesto |
|---|---|---|---|
| api::categoria-noticia.categoria-noticia | documentId de Gaming | Gaming → Regulación | gaming → regulacion |
| api::categoria-noticia.categoria-noticia | documentId de Movilidad | Movilidad → Defensa | movilidad → defensa |

1. Autorización independiente de modificación editorial/publicación. Revisar en ese momento identidad, nombre/slug real, estados draft/published y última edición; no basarse en snapshot local. Confirmar ausencia de colisión de slug con categoría O noticia. Si nombres/slugs difieren de la propuesta, STOP esa categoría y actualizar el mapa de redirección antes de publicar.
2. Registrar metadatos previos y asociaciones por identidad de manera privada. No borrar/recrear ni modificar noticias o Hardware. No incluir cambios de otros campos/relaciones en payload. No sobrescribir borrador con ediciones ajenas ni publicar cambios pendientes de Carlos: coordinar solo ese registro.
3. Renombrar por documentId en interfaz oficial y revisar UID slug explícitamente (no asumir autogeneración al cambiar nombre). Preservar descripción y activa salvo decisión editorial nueva; advertir si la descripción antigua ya no corresponde, no reescribirla automáticamente.
4. Iconos: faltan archivos inequívocos de Regulación/Defensa. No generar, reemplazar por icono arbitrario ni reasignar medios. Integrar solo recurso suministrado/autorizado en campo icono existente; comprobar seguridad/formato/dimensiones localmente antes de uso. No afirmar iconos nuevos implementados.
5. Validar relaciones mismas identidades y estados, editar/publicar únicamente cambio aprobado. Distinguir publicación CMS y build Netlify: build posterior autorizado recoge nombre/slug nuevos. Evitar ventana de web con enlaces mezclados. Frontend anterior tolera nuevos nombres; nuevo frontend tolera datos antiguos.
6. Redirects postbuild: /noticias/gaming[/...] → /noticias/regulacion[/...], movilidad→defensa, solo rutas categoría realmente generadas y origen sin página. Rutas antiguas paginadas sin equivalente no se inventan; revisar tráfico/URLs reales antes del cierre productivo. Hardware /hardware/tipo/movilidad permanece inalterado. Canonical/sitemap provienen del nuevo slug; filtros, enlaces de noticia y buscador usan los datos actuales.
7. Comprobar categorías, filtros, noticias relacionadas y Home, sin duplicar documentos. Si ambos slugs existen simultáneamente, no redirigir la categoría antigua ni fusionar registros automáticamente.
8. Recuperación: antes de revertir nombre/slug, comprobar que nadie editó el registro después. Revertir únicamente campos del cambio por identidad y con autorización; nunca restaurar una copia de la base ni sobrescribir contenido nuevo. Rebuild posterior autorizado para consistencia de enlaces.

Default destacado false requiere despliegue backend autorizado; no backfill ni script SQL. Auditar en entorno aislado la sincronización de esquema antes de producción. Cambiar el default no justifica actualizar noticias existentes. El build local no acredita migración productiva ni permisos del entorno real.
