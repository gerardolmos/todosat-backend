# Contrato de versión de Stripe

## Estado

Versión aprobada para la integración de TodoSatcom:

- SDK Node: `stripe@22.3.1`
- API de Stripe: `2026-06-24.dahlia`
- estructura de envío: `collected_information.shipping_details`

Este contrato no habilita pagos ni autoriza la creación de una cuenta o endpoint real.

## Motivo

El SDK, los tipos TypeScript y los objetos recibidos por webhook deben representar la misma versión de la API.

Una discrepancia podría provocar que el código espere campos diferentes de los enviados por Stripe.

## Cliente Node

TodoSatcom debe:

1. fijar exactamente `stripe@22.3.1`;
2. declarar `apiVersion: "2026-06-24.dahlia"` al crear el cliente;
3. verificar que `Stripe.API_VERSION` coincide con esa versión;
4. impedir una actualización silenciosa del SDK;
5. ejecutar build y pruebas antes de actualizar Stripe.

No se utilizará una variable de entorno para cambiar libremente esta versión.

La versión forma parte del código revisado y del contrato de integración.

## Endpoint webhook futuro

Cuando se cree el endpoint real de Stripe, deberá configurarse expresamente con:

`2026-06-24.dahlia`

No debe dejarse que el endpoint herede accidentalmente una versión distinta de la cuenta.

La creación del endpoint permanece bloqueada hasta disponer de:

- cuenta de Stripe aprobada;
- dominio y HTTPS de producción;
- URL definitiva del webhook;
- secreto real del endpoint;
- configuración segura de producción;
- revisión de la lista de eventos;
- pruebas en modo test;
- autorización expresa para cruzar la frontera de Stripe.

## Estructura de datos aprobada

Para esta versión:

- correo y teléfono: `session.customer_details`;
- datos de envío:
  `session.collected_information.shipping_details`;
- nombre individual recogido por Checkout:
  `session.collected_information.individual_name`.

Los normalizadores futuros utilizarán exclusivamente esta estructura tipada.

No se añadirá compatibilidad silenciosa con estructuras antiguas como `session.shipping_details`, salvo que una migración futura justifique y pruebe expresamente esa necesidad.

## Actualizaciones futuras

Una actualización de Stripe requerirá:

1. modificar deliberadamente la versión del paquete;
2. identificar la nueva `Stripe.API_VERSION`;
3. revisar el changelog;
4. comprobar los tipos de Checkout Session;
5. actualizar esta documentación;
6. actualizar la constante de código;
7. ejecutar toda la suite;
8. preparar la migración del endpoint webhook;
9. no activar la nueva versión hasta completar las pruebas.

## Frontera actual

Continúan desactivados:

- `CHECKOUT_PUBLIC_ENABLED=false`;
- `CHECKOUT_LIVE_ENABLED=false`;
- `CHECKOUT_STATUS_PUBLIC_ENABLED=false`;
- `CHECKOUT_CUSTOMER_DATA_ENABLED=false`.

No se ha creado una cuenta de Stripe.

No se han generado claves o secretos reales.

No se ha creado un endpoint webhook.

No se han habilitado pagos o ventas.
