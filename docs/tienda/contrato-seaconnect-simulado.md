# Contrato técnico simulado de Seaconnect

## Estado

**Contrato interno simulado y no conectado.**

Este documento no representa ni afirma reproducir la API real de Seaconnect.

No autoriza conexiones externas, envío de pedidos, uso de credenciales, configuración de endpoints, tratamiento real de datos personales, activación logística, ventas ni cobros.

Su finalidad es definir y probar la frontera mínima que TodoSatcom podría necesitar antes de disponer de documentación técnica, contrato y entorno de pruebas reales del proveedor.

## 1. Banderas

La futura exportación logística requerirá simultáneamente:

- `SEACONNECT_EXPORT_ENABLED=true`;
- `SEACONNECT_LIVE_ENABLED=true`.

En esta fase permanecen desactivadas:

```text
SEACONNECT_EXPORT_ENABLED=false
SEACONNECT_LIVE_ENABLED=false
```

El constructor simulado no lee estas variables ni realiza exportaciones.

## 2. Condiciones previas

Solo podrá prepararse una solicitud cuando:

1. el pedido tenga estado exacto `Pagado`;
2. existan líneas históricas;
3. al menos una línea requiera envío;
4. las líneas enviables tengan referencia de proveedor y cantidad válida;
5. exista destinatario y dirección normalizados;
6. exista una referencia técnica opaca y estable;
7. los datos procedan del webhook firmado y validado;
8. la futura operación sea idempotente.

Un pedido pendiente, fallido, cancelado, caducado o no confirmado no puede generar una solicitud logística.

## 3. Formato interno simulado

Versión:

```text
todosatcom-seaconnect-sim-v1
```

Puede contener exclusivamente:

- versión del contrato;
- referencia opaca de la solicitud;
- destinatario;
- dirección de entrega;
- referencia del producto del proveedor;
- cantidad;
- correo, solo cuando se apruebe su necesidad;
- teléfono, solo cuando se apruebe su necesidad.

La referencia opaca no será el `documentId`, el número interno de pedido, una clave de checkout ni un identificador de Stripe.

## 4. Líneas exportables

Solo se incluirán líneas con `requiere_envio=true`.

Cada línea contendrá únicamente:

- `referencia_producto`;
- `cantidad`.

Los productos digitales o líneas sin entrega quedarán excluidos.

## 5. Datos excluidos

No podrán incluirse:

- identificadores de Stripe;
- información de pago;
- precios, impuestos o totales;
- huella del carrito;
- claves internas de idempotencia;
- identificadores internos de Strapi;
- notas internas;
- datos personales ajenos a la entrega.

## 6. Contacto

Por defecto no se incluirán correo ni teléfono.

Cada dato requerirá una decisión explícita e independiente. Activar uno no activará automáticamente el otro.

## 7. Idempotencia futura

La integración real deberá:

1. generar una referencia estable y opaca;
2. reutilizarla en los reintentos del mismo pedido;
3. impedir pedidos logísticos duplicados;
4. conservar la referencia devuelta por el proveedor;
5. distinguir errores reintentables y definitivos;
6. no crear una referencia nueva en cada intento.

La implementación actual solo valida un formato simulado. No genera, persiste ni transmite referencias reales.

## 8. Respuesta futura del proveedor

Antes de una conexión real deberán definirse:

- identificador del pedido del proveedor;
- aceptación o rechazo;
- rechazo parcial;
- referencia de transporte;
- transportista;
- seguimiento;
- cancelación;
- reintentos y conciliación;
- recuperación cuando se pierda la respuesta.

Los campos privados `transportista` y `referencia_envio` no se utilizarán hasta aprobar esa correspondencia.

## 9. Logs

Está prohibido registrar payloads completos, nombre, correo, teléfono, dirección, credenciales, cabeceras de autenticación o respuestas completas con datos personales.

Solo podrán registrarse referencias técnicas no personales, códigos controlados, número de intento y marcas temporales.

## 10. Requisitos pendientes para una integración real

Antes de conectar con Seaconnect deberán obtenerse y aprobarse:

1. documentación técnica oficial vigente;
2. contrato comercial y de tratamiento de datos;
3. identidad jurídica del destinatario;
4. finalidad y base aplicable;
5. autenticación;
6. endpoints de pruebas y producción;
7. formatos exactos de petición y respuesta;
8. países y zonas admitidas;
9. reglas de portes;
10. campos obligatorios;
11. límites y rate limits;
12. semántica de errores;
13. política de reintentos;
14. mecanismo real de idempotencia;
15. callbacks o webhooks, si existen;
16. retención y eliminación;
17. pruebas en sandbox;
18. auditoría de preproducción.

## 11. Frontera actual

Continúan desactivados:

- `SEACONNECT_EXPORT_ENABLED=false`;
- `SEACONNECT_LIVE_ENABLED=false`;
- `CHECKOUT_PUBLIC_ENABLED=false`;
- `CHECKOUT_LIVE_ENABLED=false`;
- `CHECKOUT_CUSTOMER_DATA_ENABLED=false`;
- `CHECKOUT_CUSTOMER_DATA_SYNC_ENABLED=false`.

No existe cliente HTTP, endpoint, credencial, autenticación, exportación automática, conexión de red ni pedido real enviado al proveedor.
