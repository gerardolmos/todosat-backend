# Contrato de datos del cliente de la tienda

## Estado

**Decisión técnica aprobada.**

**Implementación y activación de datos personales bloqueadas hasta completar los requisitos indicados en este documento.**

Este contrato define la arquitectura prevista. No autoriza todavía ventas, cobros, conexiones reales con Stripe ni transferencias a proveedores.

## 1. Principios

1. Minimización de datos.
2. Privacidad por diseño.
3. Ningún dato personal procedente del navegador será confiable por sí solo.
4. El frontend no mantendrá formularios propios de cliente o envío.
5. Stripe Checkout alojado será la superficie prevista para recoger los datos.
6. El webhook firmado será la única vía autorizada para copiar datos desde Stripe.
7. El retorno del navegador nunca será prueba del pago.
8. Ninguna respuesta pública expondrá información personal, comercial o logística del pedido.
9. Los datos no se incluirán en metadata, claves de idempotencia, URLs o logs.
10. Los datos solo se comunicarán a terceros cuando sean necesarios para ejecutar un pedido pagado.

## 2. Sistemas y responsabilidades

### Navegador

Puede conservar únicamente:

- identificadores públicos de productos;
- cantidades;
- una clave técnica de idempotencia;
- el identificador temporal de la sesión durante la consulta del estado.

No puede conservar:

- nombre;
- correo;
- teléfono;
- dirección;
- instrucciones de entrega;
- identificadores fiscales;
- información de pago.

El carrito puede permanecer en `localStorage`.

La clave de idempotencia puede permanecer en `sessionStorage`.

El identificador de sesión debe eliminarse de la dirección del navegador inmediatamente después de leerlo y no debe persistirse.

### Frontend de TodoSatcom

Solo enviará al backend:

- `documentId` del producto;
- cantidad;
- cabecera de idempotencia.

No incorporará formularios de cliente ni enviará datos personales al endpoint público de checkout.

### Backend de TodoSatcom

Creará y validará:

- pedido provisional;
- copia histórica de sus líneas;
- importes calculados en servidor;
- sesión de Stripe;
- estado interno del pedido;
- registro mínimo de eventos de Stripe.

Los pedidos, líneas, eventos y datos personales permanecerán privados.

### Stripe Checkout

Será la superficie prevista para recoger los datos necesarios durante el pago.

La integración utilizará compradores invitados y no creará obligatoriamente un objeto Customer.

Configuración prevista:

- correo: requerido para todos los pedidos;
- nombre independiente: no requerido por defecto;
- dirección de envío: solo para pedidos que requieran envío;
- nombre del destinatario: obtenido de los datos de envío;
- teléfono: solo para pedidos que requieran envío;
- dirección completa de facturación: no forzada mientras no exista una necesidad fiscal aprobada;
- identificador fiscal: desactivado;
- consentimiento comercial: desactivado;
- guardado del método de pago: desactivado;
- campos personalizados para datos personales: prohibidos.

## 3. Copia de datos a Strapi

Los datos solo podrán copiarse después de:

1. validar criptográficamente el webhook;
2. validar modo test/live;
3. validar sesión, pedido, moneda e importe;
4. comprobar que el pago está confirmado;
5. comprobar que el pedido sigue admitiendo esa transición.

### Correspondencia prevista

| Campo privado en Strapi | Fuente prevista |
|---|---|
| `email_cliente` | correo normalizado de `customer_details` |
| `nombre_cliente` | destinatario normalizado de los datos de envío |
| `telefono_cliente` | teléfono normalizado de `customer_details` |
| `direccion_envio.nombre_destinatario` | nombre del destinatario |
| `direccion_envio.linea_1` | primera línea de dirección |
| `direccion_envio.linea_2` | segunda línea de dirección, cuando exista |
| `direccion_envio.codigo_postal` | código postal |
| `direccion_envio.ciudad` | ciudad |
| `direccion_envio.provincia` | provincia o región |
| `direccion_envio.codigo_pais` | código ISO de dos caracteres |

La implementación deberá admitir la estructura de datos de envío correspondiente a la versión de API de Stripe fijada en el proyecto.

## 4. Estados que permiten copiar datos

### Pago confirmado

Puede copiarse el mínimo necesario para:

- ejecutar el pedido;
- comunicarse con el comprador;
- preparar el envío;
- atender incidencias;
- cumplir obligaciones administrativas aplicables.

### Pago pendiente

No se copiarán datos personales a Strapi.

### Pago fallido

No se copiarán datos personales a Strapi.

### Sesión caducada o cancelada

No se copiarán datos personales a Strapi.

### Reembolso

No se eliminarán automáticamente datos necesarios para gestionar el pedido, el reembolso o las obligaciones aplicables.

## 5. Seaconnect y logística

No existe todavía un contrato técnico implementado con Seaconnect.

La integración futura solo podrá ejecutarse para pedidos pagados y deberá definir expresamente:

- autenticación;
- endpoint o canal de entrega;
- formato de pedido;
- referencia de producto del proveedor;
- cantidad;
- nombre del destinatario;
- dirección;
- teléfono, únicamente cuando sea necesario para la entrega;
- correo, únicamente cuando sea necesario;
- instrucciones de entrega, si se aprueban;
- respuesta e identificador de pedido del proveedor;
- reintentos;
- idempotencia;
- tratamiento de errores;
- registro de auditoría sin payloads personales completos.

No se enviarán a Seaconnect:

- claves internas;
- identificadores de Stripe no necesarios;
- información de pago;
- huellas del carrito;
- metadata técnica;
- datos adicionales ajenos a la entrega.

## 6. Logs

Está prohibido registrar:

- cuerpo completo del webhook;
- objeto completo de la sesión;
- correo;
- nombre;
- teléfono;
- dirección;
- datos de pago;
- payload completo enviado al proveedor.

Los logs solo podrán contener:

- códigos de error controlados;
- acción técnica;
- identificadores internos no personales cuando sean imprescindibles;
- marcas temporales;
- número de intento.

## 7. Retención y eliminación

La caducidad técnica de una sesión no constituye una política de retención.

Antes de almacenar datos personales debe aprobarse una tabla que determine, para cada categoría:

- finalidad;
- base y obligación aplicable;
- sistema donde se almacena;
- personas o roles con acceso;
- destinatarios;
- plazo de conservación;
- mecanismo de bloqueo;
- mecanismo de eliminación o anonimización;
- tratamiento en copias de seguridad.

No se establece un plazo concreto en este documento.

## 8. Información legal pendiente

Antes de habilitar el checkout deberán estar terminadas y revisadas:

- identidad y datos del responsable;
- política de privacidad;
- condiciones generales de contratación;
- política de envíos;
- países y zonas admitidas;
- costes y plazos de entrega;
- política de cancelaciones;
- política de devoluciones;
- política de reembolsos;
- información sobre impuestos;
- tratamiento de cookies;
- información sobre Stripe y proveedores logísticos;
- canales para ejercer derechos y contactar con soporte.

El campo `aceptacion_condiciones_en` no se rellenará hasta que existan unas condiciones definitivas y un mecanismo verificable de aceptación.

## 9. Bloqueadores de implementación

La copia de datos personales y la activación del checkout permanecen bloqueadas hasta cerrar:

1. países y zonas de envío;
2. reglas de portes;
3. reglas fiscales;
4. condiciones de venta;
5. privacidad y retención;
6. contrato técnico de Seaconnect;
7. acceso administrativo y trazabilidad;
8. copias de seguridad y eliminación;
9. configuración final de Stripe;
10. pruebas completas con datos ficticios.

## 10. Orden de implementación futura

1. Añadir feature flag de datos del cliente, desactivada por defecto.
2. Añadir configuración simulada de recogida de datos en Checkout.
3. Crear normalizadores estrictos para correo, nombre, teléfono y dirección.
4. Probar el webhook exclusivamente con objetos ficticios.
5. Copiar datos dentro de la transacción de confirmación del pago.
6. Probar que los estados no pagados no persisten datos.
7. Crear contrato simulado de Seaconnect.
8. Definir retención y limpieza.
9. Completar información legal.
10. Detener el proyecto en la frontera que exige cuenta y credenciales reales de Stripe.

## 11. Frontera actual

Mientras este contrato no avance a su siguiente versión:

- `CHECKOUT_PUBLIC_ENABLED=false`;
- `CHECKOUT_LIVE_ENABLED=false`;
- `CHECKOUT_STATUS_PUBLIC_ENABLED=false`;
- no se recogerán datos personales;
- no se copiarán datos desde Stripe;
- no se enviarán pedidos a Seaconnect;
- no se conectará TodoSatcom con Stripe;
- no se habilitarán ventas.
