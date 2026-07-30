# Punto de Control 0 — Separación de configuración Stripe

**Fecha:** 30 de julio de 2026

**Estado:** implementado y verificado.

## Riesgo

El servicio interno del webhook utilizaba `getStripeCheckoutConfig()` únicamente para conocer el modo `test` o `live`.

Esa función también exige la clave secreta y las URLs de éxito y cancelación. Por tanto, un error en la configuración necesaria para crear nuevas sesiones podía impedir procesar un evento ya recibido y cuya firma había sido verificada.

## Separación aplicada

### Procesamiento del evento

Requiere:

- `STRIPE_MODE`;
- las restricciones de seguridad para modo real;
- un evento previamente autenticado por la frontera HTTP.

No requiere:

- `STRIPE_SECRET_KEY`;
- `CHECKOUT_SUCCESS_URL`;
- `CHECKOUT_CANCEL_URL`.

### Creación de sesiones

Continúa requiriendo:

- clave del modo correcto;
- URLs válidas;
- HTTPS en modo real;
- marcador de sesión en la URL de éxito.

### Frontera HTTP del webhook

Continúa requiriendo `STRIPE_WEBHOOK_SECRET` para verificar la firma sobre el cuerpo original.

## Prueba

La suite elimina temporalmente la clave de API y las dos URLs, procesa un evento soportado y comprueba que:

- el evento queda procesado;
- el pedido permanece pendiente porque el pago no está confirmado;
- se registra un único intento;
- la configuración se restaura al finalizar.

No se utiliza Stripe real ni se realiza ninguna conexión externa.
