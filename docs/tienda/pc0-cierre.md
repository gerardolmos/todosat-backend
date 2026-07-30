# Punto de Control 0 — Cierre consolidado

**Fecha de cierre:** 30 de julio de 2026

**Estado del control:** COMPLETADO PARA EL ENTORNO ACTUAL DE DESARROLLO.

**Estado del proyecto:** PREPARADO PARA CONTINUAR EL DESARROLLO — NO APTO PARA PRODUCCIÓN.

## 1. Alcance del cierre

Este cierre certifica que el estado reconstruido de TodoSatcom es coherente, recuperable, probado y suficientemente protegido para continuar el desarrollo sin activar ventas reales.

No certifica un despliegue productivo. Las decisiones empresariales, fiscales, legales, logísticas y de infraestructura todavía pendientes continúan bloqueando cualquier activación real.

## 2. Resultados consolidados

### Repositorios y continuidad

- frontend y backend recuperados y documentados;
- ramas `main` limpias y sincronizadas con GitHub;
- copias externas y referencias de continuidad disponibles;
- cambios posteriores ejecutados mediante commits pequeños y verificables;
- ausencia de archivos `.env` privados rastreados.

### Autoridad del backend

- productos, precios y totales se reconstruyen en el servidor;
- el navegador no decide importes cobrables;
- se validan publicación, disponibilidad, cantidades, moneda y límites;
- se guardan líneas y snapshots del pedido;
- las entidades internas de pedido, línea y evento no tienen permisos públicos.

### Checkout y Stripe

- checkout público y pagos reales permanecen bloqueados mediante banderas;
- una sesión provisional se crea de forma idempotente;
- la página de retorno no confirma el pago;
- la consulta pública expone un estado mínimo;
- la firma del webhook se verifica sobre el cuerpo original;
- los eventos se registran y procesan de forma idempotente;
- dos entregas simultáneas del mismo evento se serializan en una instancia;
- el procesamiento interno del webhook no depende de la clave ni de las URLs necesarias para crear sesiones;
- los bloqueos de modo `live` permanecen activos.

### Superficie pública y abuso

- las rutas explícitas de tienda conservan sus controles y banderas;
- los tres limitadores locales están unificados;
- sus mapas tienen capacidad máxima y limpieza de entradas caducadas;
- se emiten cabeceras de límite, reinicio y reintento;
- `TRUST_PROXY` permanece desactivado por defecto;
- `/api/auth` y `/api/connect` están bloqueados porque TodoSatcom no utiliza cuentas de cliente;
- el rol público no dispone de permisos sobre usuarios.

### Datos y conexiones externas

- la normalización de datos de cliente existe, pero no está conectada a producción;
- la integración SeaConnect es exclusivamente simulada;
- no existen endpoints, credenciales ni tráfico real hacia SeaConnect;
- Stripe real, sincronización de clientes y exportaciones reales permanecen desactivados.

### Calidad y regresión

- build completo de Strapi y panel de administración superado;
- suite de tienda superada;
- ciclo de vida del webhook probado;
- concurrencia local del webhook probada;
- rate limiting, proxy y permisos públicos probados;
- cambios de dependencias instalados desde cero y sometidos a build y regresión;
- no se utilizaron pagos, credenciales ni servicios reales durante las pruebas.

## 3. Deuda técnica conocida y aceptada

Estos puntos no impiden continuar el desarrollo actual, pero deberán resolverse antes de una producción que dependa de ellos:

1. **Varias instancias:** la serialización del webhook y el rate limiting son locales al proceso. Un despliegue distribuido necesitará cola, bloqueo o almacenamiento compartido, o control equivalente en el proxy o gateway.
2. **Efectos externos:** correo, logística y SeaConnect no deberán ejecutarse directamente dentro de la petición del webhook. Requerirán una estrategia persistente de cola, outbox o reintento.
3. **Dependencias transitivas:** la actualización compatible redujo la auditoría de producción de 47 a 46 hallazgos y de 16 a 15 altos. Los restantes siguen abiertos y deberán revisarse con futuras versiones oficiales compatibles; no se aplicará `npm audit fix --force`.
4. **Infraestructura real:** quedan por definir base de datos productiva, copias de seguridad, monitorización, alertas, rotación de secretos, TLS, proxy, despliegue, migraciones y recuperación.
5. **Datos personales:** la integración definitiva solo podrá cerrarse cuando existan el contrato, los campos y las obligaciones reales.
6. **Pruebas externas:** Stripe y SeaConnect deberán validarse en sus entornos reales o sandbox oficiales antes de habilitar producción.

## 4. Pendientes de activación futura

- constitución e identidad definitiva de la empresa;
- datos fiscales y dirección legal;
- reglas fiscales y de IVA;
- tarifas, zonas y condiciones reales de envío;
- textos legales y condiciones de compra;
- cuenta, claves y webhook reales de Stripe;
- contrato, documentación y credenciales de SeaConnect;
- alojamiento, dominios y proxy definitivos;
- correos y responsables operativos;
- política de devoluciones, garantía y reclamaciones;
- autorización expresa para activar ventas.

Estas ausencias se clasifican como **PENDIENTES DE ACTIVACIÓN**, no como defectos del desarrollo actual.

## 5. Criterio de cierre

El Punto de Control 0 queda cerrado porque:

- los riesgos resolubles con la información actual han sido corregidos o documentados;
- las pruebas de regresión cubren los controles centrales;
- los riesgos restantes dependen de infraestructura o decisiones que todavía no existen;
- las ventas y conexiones reales permanecen bloqueadas;
- el proyecto puede continuar sin inventar datos ni arquitectura productiva.

## 6. Siguiente etapa

La siguiente etapa se centrará en el flujo visible previo al checkout:

- datos del comprador bajo banderas y simulación;
- resumen y revisión del pedido;
- estados, validaciones y mensajes de error;
- accesibilidad y experiencia móvil y de escritorio;
- continuidad entre carrito, pago y confirmación;
- integración visual del frontend con los contratos ya fijados por el backend.

La prioridad pasa a ser la experiencia de usuario, manteniendo intactos los límites de seguridad y activación establecidos en este cierre.
