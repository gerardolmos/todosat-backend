# Punto de Control 0 — Rate limiting, proxy y autenticación no utilizada

**Fecha:** 30 de julio de 2026

**Estado:** implementado y verificado para el entorno actual.

## Diagnóstico

La auditoría consolidada confirmó tres implementaciones separadas de rate limiting en memoria.

Dos mapas no eliminaban entradas caducadas. El tercero recorría todo el mapa en cada petición. Además, ninguno imponía un tamaño máximo.

La identificación usa `ctx.ip`. Esto es correcto en conexión directa, pero detrás de un proxy solo debe confiarse en las cabeceras reenviadas cuando el proxy sea controlado y Strapi no sea accesible directamente.

La base local conserva rutas públicas predeterminadas de autenticación del plugin Users & Permissions. TodoSatcom no utiliza cuentas de cliente. El middleware global bloquea los prefijos `/api/auth` y `/api/connect`. La colección `/api/users` queda protegida por la autorización de Strapi: el rol público no dispone de permisos sobre usuarios.

## Cambios

- Utilidad única de rate limiting en memoria.
- Capacidad máxima configurable y acotada.
- Limpieza periódica de entradas caducadas.
- Expulsión de la entrada con vencimiento más próximo al alcanzar la capacidad.
- Cabeceras de límite, restantes, reinicio y reintento.
- Claves de cliente normalizadas y limitadas en longitud.
- `TRUST_PROXY=false` por defecto.
- Prueba de las tres rutas comerciales.
- Prueba de los prefijos públicos de autenticación y proveedores.
- Comprobación de que el rol público no dispone de permisos sobre usuarios.

## Variables

- `RATE_LIMIT_MAX_ENTRIES`: capacidad máxima por limitador local.
- `TRUST_PROXY`: activa la confianza de Koa en el proxy.

`TRUST_PROXY` solo podrá activarse cuando exista un proxy inverso controlado y el proceso de Strapi no admita conexiones directas desde Internet.

## Límite futuro

El rate limiting actual es deliberadamente local a una instancia. Se reinicia con el proceso y no se comparte entre varias instancias. Antes de producción distribuida deberá sustituirse o complementarse con un limitador en el proxy, gateway o almacenamiento compartido de la infraestructura definitiva.
