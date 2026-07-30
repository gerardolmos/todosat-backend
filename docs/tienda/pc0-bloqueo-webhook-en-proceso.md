# Punto de Control 0 — Bloqueo concurrente del webhook

**Fecha:** 30 de julio de 2026

**Estado:** implementado para una instancia y verificado en entorno local.

## Riesgo

Dos entregas simultáneas del mismo evento podían leer el registro todavía no procesado y comenzar ambas los efectos sobre el pedido.

Una actualización condicional en SQLite fue probada previamente, pero la prueba concurrente demostró que no proporcionaba la exclusión esperada en este entorno. No se aplicó al repositorio real.

## Solución actual

Se mantiene un mapa de promesas en curso indexado por `event.id`:

1. la primera entrega inicia el procesamiento;
2. una segunda entrega simultánea espera la misma promesa;
3. al finalizar correctamente, la segunda responde como duplicada;
4. no repite efectos ni incrementa `intentos`;
5. el mapa elimina siempre la entrada al finalizar.

La idempotencia persistente existente continúa protegiendo los reenvíos no simultáneos.

## Verificación

La prueba de integración envía dos llamadas con el mismo evento mediante `Promise.all` y exige:

- una ejecución principal;
- una respuesta duplicada;
- pedido actualizado una sola vez;
- un único intento persistido;
- ausencia de errores;
- limpieza de los datos técnicos.

## Frontera futura

La solución actual es correcta para una instancia. Un despliegue con varias instancias requerirá una cola persistente, un bloqueo distribuido o una estrategia específica de la base de datos definitiva. Esa decisión queda bloqueada hasta conocer la infraestructura real.

Las operaciones externas futuras —correo, logística o SeaConnect— no deberán ejecutarse directamente dentro del webhook.
