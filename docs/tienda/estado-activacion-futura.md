# TodoSatcom — Estado de activación futura

**Fecha:** 30 de julio de 2026

## Estado actual

PREPARADO PARA ACTIVACIÓN FUTURA — NO APTO PARA PRODUCCIÓN.

## Información confirmada

- La futura vendedora será identificada provisionalmente como TODOSATCOM SL.
- TodoSatcom venderá directamente.
- Stripe, cobros y facturación corresponderán a TODOSATCOM SL.
- Se venderá inicialmente a particulares y empresas en España.
- Seaconnect confirmará stock, preparará pedidos y realizará envíos.
- Inicialmente se venderán únicamente equipos.
- TodoSatcom atenderá cancelaciones, devoluciones y reclamaciones.
- Correo previsto de atención: ayuda@todosatcom.com.

## Pendientes de activación

- identidad jurídica y fiscal definitiva;
- reglas fiscales;
- precios finales y tratamiento del IVA;
- tarifas y zonas de envío;
- textos legales aprobados;
- cuenta y claves reales de Stripe;
- endpoint y eventos reales del webhook;
- contrato, documentación y credenciales reales de Seaconnect;
- alojamiento, dominios y variables de producción;
- autorización final para aceptar pagos.

## Bloqueos obligatorios

Mientras los pendientes anteriores no estén resueltos:

- CHECKOUT_PUBLIC_ENABLED=false
- CHECKOUT_LIVE_ENABLED=false
- CHECKOUT_STATUS_PUBLIC_ENABLED=false
- CHECKOUT_CUSTOMER_DATA_ENABLED=false
- CHECKOUT_CUSTOMER_DATA_SYNC_ENABLED=false
- SEACONNECT_EXPORT_ENABLED=false
- SEACONNECT_LIVE_ENABLED=false

No se inventarán datos definitivos y no se habilitarán ventas reales.
