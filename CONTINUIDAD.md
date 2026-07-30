# TODOSATCOM — INFORME DE CONTINUIDAD RECONSTRUIDO

**Fecha de reconstrucción:** 29 de julio de 2026
**Proyecto:** TodoSatcom
**Procedencia:** reconstrucción del informe de continuidad perdido en el chat `TODOSATCOM-15`

---

# 1. OBJETIVO DE ESTE INFORME

Este documento permite continuar el desarrollo de TodoSatcom en un chat nuevo sin reiniciar el proyecto, sin reinterpretar decisiones ya tomadas y sin introducir cambios improvisados.

El chat anterior, `TODOSATCOM-15`, fue eliminado accidentalmente después de preparar el informe de continuidad original. Por ese motivo, este documento distingue entre:

* Información de continuidad conservada.
* Principios y decisiones ya establecidos.
* Aspectos que deben verificarse directamente en los repositorios.
* Siguiente bloque de trabajo acordado.

No debe asumirse que una funcionalidad está terminada únicamente porque aparezca descrita conceptualmente. El estado real del código debe confirmarse mediante inspección de Git, archivos, compilación y pruebas.

---

# 2. METODOLOGÍA OBLIGATORIA DEL PROYECTO

TodoSatcom no debe desarrollarse mediante improvisación, generación continua de fragmentos ni copia manual descontrolada de código.

El proyecto se trabaja mediante una metodología profesional coordinada por un **Director Técnico**, con análisis interno equivalente al de los siguientes especialistas:

* Arquitectura de software.
* Backend.
* Frontend.
* UX/UI.
* Seguridad.
* Privacidad y cumplimiento legal.
* Rendimiento.
* QA.
* Continuidad técnica.

Los especialistas no deben responder por separado. Deben analizar internamente la tarea y entregar una única propuesta consensuada.

## Reglas de trabajo

1. No escribir código antes de comprender el objetivo.
2. Definir primero:

   * comportamiento esperado;
   * arquitectura afectada;
   * flujo de datos;
   * riesgos;
   * casos límite;
   * criterio de aceptación;
   * método de comprobación.
3. No rehacer partes funcionales sin una mejora objetiva.
4. No modificar archivos ajenos al alcance de la tarea.
5. Realizar cambios pequeños, controlados y verificables.
6. Comprobar cada cambio antes de continuar.
7. No ocultar errores ni dar una tarea por terminada sin pruebas.
8. Mantener separación estricta entre frontend, backend, Stripe y servicios externos.
9. No tomar decisiones sensibles basándose únicamente en datos enviados por el navegador.
10. Mantener documentación suficiente para continuar el proyecto en otro chat.
11. Priorizar seguridad, protección del cliente y reducción de responsabilidad legal.
12. Evitar que el usuario tenga que copiar numerosos fragmentos manualmente.

## Regla de implementación automatizada

Cuando sea técnicamente razonable, los cambios deben entregarse mediante una única operación automatizada para ejecutar desde la terminal.

El procedimiento deberá:

* localizar el proyecto correcto;
* comprobar que los archivos esperados existen;
* crear copias de seguridad cuando sea necesario;
* modificar únicamente los archivos previstos;
* detenerse si el estado del proyecto no coincide con lo esperado;
* mostrar un resumen de los cambios;
* ejecutar verificaciones automáticas;
* no depender de edición manual repetitiva en VSCode.

El usuario ejecutará la operación en su ordenador. El chat no debe afirmar que tiene acceso directo al disco local.

---

# 3. CONTEXTO GENERAL DE TODOSATCOM

TodoSatcom es una tienda online relacionada con productos y servicios de telecomunicaciones.

El proyecto incluye:

* frontend;
* backend;
* gestión de contenido y pedidos con Strapi;
* carrito;
* flujo previo al pago;
* integración con Stripe;
* páginas informativas y legales;
* tratamiento de datos personales;
* requisitos de seguridad superiores a los de una web únicamente informativa.

El usuario no desea abandonar la tienda ni sustituirla por un sistema sin comercio electrónico. El proyecto debe completarse, pero con una estrategia conservadora y verificable.

---

# 4. PRINCIPIO DE ARQUITECTURA DEL PAGO

TodoSatcom no debe procesar directamente los datos de tarjeta.

El flujo previsto es:

1. El cliente selecciona productos o servicios en TodoSatcom.
2. TodoSatcom gestiona el carrito y la preparación del pedido.
3. El backend valida el pedido.
4. El backend crea la operación o sesión correspondiente en Stripe.
5. El cliente es enviado al entorno de pago de Stripe.
6. Stripe gestiona los datos sensibles del pago.
7. El backend recibe una confirmación verificable del resultado.
8. El pedido se registra o actualiza en Strapi.
9. El frontend muestra el estado correspondiente al cliente.

## Datos sensibles

TodoSatcom no debe almacenar:

* números completos de tarjeta;
* códigos CVC;
* datos de autenticación bancaria;
* credenciales de Stripe;
* información de pago que no sea imprescindible.

Los datos relacionados con la tarjeta deben permanecer dentro del entorno de Stripe.

TodoSatcom únicamente debe conservar los datos mínimos necesarios para:

* identificar el pedido;
* relacionarlo con el pago;
* prestar el servicio;
* atender incidencias;
* cumplir obligaciones legales.

Debe aplicarse minimización de datos. No se recopilará información adicional por comodidad técnica.

---

# 5. STRIPE Y STRAPI: RESPONSABILIDADES

## Stripe

Stripe debe ser la autoridad sobre el estado real del pago.

No se considerará pagado un pedido porque:

* el navegador llegue a una página de éxito;
* exista un parámetro en la URL;
* el cliente envíe una petición afirmando que pagó;
* el frontend cambie su estado visual.

La confirmación deberá proceder de una comunicación verificable con Stripe, preferentemente mediante eventos autenticados y comprobación del estado correspondiente.

## Strapi

Strapi puede almacenar la información operativa del pedido, siempre limitada a los datos necesarios.

El registro del pedido deberá diferenciar claramente estados como:

* pedido iniciado;
* pendiente de pago;
* pago confirmado;
* pago fallido;
* cancelado;
* revisión necesaria;
* completado.

Los nombres exactos de los estados deben comprobarse en la implementación real antes de modificarlos.

Strapi no debe aceptar como verdaderos importes, precios, descuentos o estados enviados libremente por el navegador.

---

# 6. AUTORIDAD DE LOS DATOS

El frontend nunca debe ser la autoridad definitiva sobre:

* precio unitario;
* precio total;
* descuentos;
* impuestos;
* disponibilidad;
* identidad interna del producto;
* estado del pago;
* estado final del pedido.

El navegador puede enviar identificadores y cantidades solicitadas, pero el backend debe reconstruir y validar el pedido utilizando información fiable.

Toda entrada del cliente debe considerarse manipulable.

---

# 7. ESTADO DE LOS REPOSITORIOS CONSERVADO

Las últimas referencias de continuidad conservadas son:

## Backend

**Commit de referencia:** `8b3a346`

## Frontend

**Commit de referencia:** `1aa5f00`

Estas referencias deben tratarse como puntos de control, pero deben verificarse al comenzar el nuevo chat.

No debe escribirse código antes de ejecutar o solicitar, como mínimo:

```bash
git status
git branch --show-current
git log -5 --oneline
```

Debe comprobarse:

* que estamos en los repositorios correctos;
* que esos commits existen;
* qué commit está actualmente activo;
* si hay cambios sin confirmar;
* si hay archivos nuevos no rastreados;
* si el árbol de trabajo está limpio;
* si existen commits posteriores;
* si frontend y backend se encuentran sincronizados con el estado descrito.

Si aparecen cambios posteriores a esos commits, no deben descartarse. Deben analizarse antes de continuar.

---

# 8. ESTADO FUNCIONAL CONSERVADO

La tienda se encontraba dentro de la fase de implementación del flujo comercial y de pago.

El carrito, la preparación del pedido, Strapi y Stripe forman parte del flujo previsto o parcialmente implementado.

Sin embargo, debido a la pérdida del chat, no debe afirmarse sin inspección que están completamente terminados:

* todos los componentes del carrito;
* el formulario previo al checkout;
* la creación definitiva del pedido;
* la creación de la sesión de Stripe;
* el webhook;
* la actualización del pedido tras el pago;
* las páginas de éxito y cancelación;
* la gestión de errores;
* los textos legales definitivos.

El código real es la fuente de verdad para determinar qué partes existen y cuáles están incompletas.

---

# 9. ÚLTIMO PUNTO ACORDADO

El siguiente trabajo acordado no era continuar añadiendo funcionalidades inmediatamente.

Primero debía realizarse el:

# PUNTO DE CONTROL 0

## SEGURIDAD, PRIVACIDAD Y LEGALIDAD

Este punto de control debe realizarse antes de avanzar con el flujo previo al checkout.

Su finalidad es asegurarse de que la arquitectura actual no introduce riesgos graves para:

* los clientes;
* terceros;
* el propietario de TodoSatcom;
* los datos personales;
* los pagos;
* la integridad de los pedidos;
* el cumplimiento legal.

---

# 10. OBJETIVOS DEL PUNTO DE CONTROL 0

El análisis debe cubrir como mínimo los siguientes bloques.

## 10.1 Inventario del flujo

Documentar el recorrido completo desde que el cliente añade un producto hasta que el pedido queda confirmado.

Debe identificarse:

* qué datos introduce el cliente;
* qué datos conserva el navegador;
* qué datos llegan al backend;
* qué datos consulta el backend;
* qué información se guarda en Strapi;
* qué información se envía a Stripe;
* qué información devuelve Stripe;
* qué evento confirma el pago;
* cómo se relacionan pedido y pago;
* qué se muestra finalmente al cliente.

## 10.2 Inventario de datos personales

Crear una lista exacta de los datos tratados.

Para cada dato debe indicarse:

* finalidad;
* origen;
* destino;
* tiempo de conservación;
* si es obligatorio;
* quién puede consultarlo;
* qué ocurriría si se filtrase.

No deben solicitarse datos sin una finalidad concreta.

## 10.3 Secretos y configuración

Comprobar que no estén expuestos:

* claves secretas de Stripe;
* secretos de webhook;
* tokens de Strapi;
* credenciales;
* variables privadas;
* direcciones internas;
* datos reales de clientes;
* secretos dentro del repositorio;
* secretos incluidos en el código que llega al navegador.

Revisar:

* archivos `.env`;
* archivos `.env.example`;
* `.gitignore`;
* historial reciente de Git;
* configuración de despliegue;
* variables públicas y privadas;
* logs de desarrollo.

## 10.4 Validación del pedido

Verificar que el backend:

* no confía en precios enviados por el frontend;
* valida productos e identificadores;
* valida cantidades;
* limita cantidades abusivas;
* recalcula los totales;
* rechaza productos inexistentes;
* rechaza valores negativos o anómalos;
* gestiona errores sin filtrar detalles internos.

## 10.5 Integración con Stripe

Comprobar:

* que se utilizan claves del entorno correcto;
* que no se mezcla test con producción;
* que los importes se calculan en el servidor;
* que se usa la unidad monetaria correcta;
* que el pedido se relaciona de forma inequívoca con Stripe;
* que no se confía en la página de éxito como confirmación;
* que las firmas de los eventos se verifican;
* que los eventos repetidos no duplican pedidos;
* que los eventos fuera de orden no corrompen el estado;
* que los fallos parciales pueden recuperarse;
* que no se muestra información sensible en URLs o logs.

## 10.6 Strapi

Comprobar:

* permisos de roles públicos y autenticados;
* endpoints expuestos;
* posibilidad de consultar pedidos ajenos;
* posibilidad de modificar pedidos desde el cliente;
* campos privados;
* sanitización de respuestas;
* validación de contenido;
* estado inicial de los pedidos;
* transición entre estados;
* duplicados;
* eliminación y conservación de datos.

Ninguna colección de pedidos debe quedar abierta públicamente por una configuración permisiva.

## 10.7 Navegador y frontend

Comprobar:

* validación visual y validación real;
* manipulación del carrito;
* almacenamiento local;
* exposición de identificadores;
* mensajes de error;
* reenvío accidental del formulario;
* dobles clics;
* peticiones repetidas;
* pérdida de conexión;
* recarga durante el proceso;
* accesibilidad;
* consentimiento y textos informativos.

## 10.8 Backend y API

Comprobar:

* validación de entrada;
* límites de tamaño;
* rate limiting cuando corresponda;
* CORS;
* métodos HTTP permitidos;
* autenticación;
* autorización;
* gestión de excepciones;
* logs;
* respuestas de error;
* dependencias;
* rutas no utilizadas;
* endpoints de prueba;
* datos devueltos al frontend.

## 10.9 Privacidad y legalidad

Revisar la coherencia entre el funcionamiento real y:

* política de privacidad;
* política de cookies;
* aviso legal;
* condiciones de contratación;
* información sobre pagos;
* comunicaciones comerciales;
* conservación de pedidos;
* derechos de los usuarios;
* proveedores externos;
* tratamiento efectuado por Stripe;
* tratamiento efectuado por Strapi y el alojamiento correspondiente.

No debe redactarse un texto legal que prometa prácticas distintas de las que realiza el sistema.

Las conclusiones legales deben presentarse como revisión técnica y organizativa, no como sustitución de asesoramiento jurídico profesional.

---

# 11. MODELO DE AMENAZAS INICIAL

El Punto de Control 0 debe contemplar, al menos, los siguientes escenarios:

1. Un cliente modifica el precio desde el navegador.
2. Un atacante crea pedidos con cantidades negativas.
3. Se reutiliza una petición válida varias veces.
4. Se falsifica una visita a la página de pago completado.
5. Se envía un evento falso simulando proceder de Stripe.
6. Stripe repite un evento legítimo.
7. Dos procesos intentan confirmar el mismo pedido.
8. Un usuario accede al pedido de otro cliente.
9. Los permisos públicos de Strapi permiten leer pedidos.
10. Una clave privada aparece en el frontend.
11. Los logs registran datos personales o secretos.
12. Un atacante automatiza miles de intentos de creación de pedidos.
13. El pago se completa, pero falla el registro del pedido.
14. El pedido se registra, pero Stripe no llega a completar el pago.
15. El cliente cierra la ventana durante el proceso.
16. El navegador repite la solicitud por error.
17. Se manipulan identificadores de productos.
18. Se introduce contenido malicioso en campos de texto.
19. Se utilizan URLs de éxito o cancelación manipuladas.
20. Se produce un error interno y el sistema revela información sensible.

El objetivo inicial no es realizar una auditoría ofensiva completa, sino comprobar que la arquitectura tiene defensas razonables y que no existe una vulnerabilidad evidente que pueda perjudicar a clientes o terceros.

---

# 12. RESULTADO ESPERADO DEL PUNTO DE CONTROL 0

El Punto de Control 0 debe terminar con un informe dividido en:

## A. Confirmado como seguro o razonable

Aspectos revisados y respaldados por código o configuración.

## B. Defectos críticos

Problemas que impiden continuar con el checkout.

## C. Defectos importantes

Problemas que deben resolverse antes de producción.

## D. Mejoras recomendables

Aspectos no bloqueantes que reducen riesgos.

## E. Elementos no verificables todavía

Cuestiones que necesitan despliegue, credenciales, configuración externa o una revisión posterior.

Cada hallazgo debe contener:

* descripción;
* ubicación;
* riesgo real;
* posible impacto;
* prioridad;
* solución propuesta;
* prueba de verificación.

No deben aplicarse cambios durante la primera inspección salvo que exista una emergencia evidente. Primero se presenta el diagnóstico y después se aprueba el bloque de implementación.

---

# 13. SIGUIENTE FASE DESPUÉS DEL PUNTO DE CONTROL 0

Cuando los riesgos bloqueantes hayan sido resueltos o descartados, el proyecto continuará con el:

# FLUJO PREVIO AL CHECKOUT

Ese bloque deberá definir y verificar:

1. estado del carrito;
2. datos necesarios del comprador;
3. validación del formulario;
4. resumen final del pedido;
5. aceptación de condiciones;
6. creación segura del pedido;
7. creación de la sesión de Stripe;
8. redirección;
9. tratamiento de errores;
10. prevención de duplicados;
11. recuperación tras interrupciones;
12. accesibilidad y claridad para el cliente.

No debe implementarse todo de una sola vez. Se dividirá en unidades pequeñas con pruebas independientes.

---

# 14. PROCEDIMIENTO DE REANUDACIÓN EN EL NUEVO CHAT

El nuevo chat debe comenzar de la siguiente forma:

## Paso 1. No modificar código

Leer este informe y aceptar explícitamente que el proyecto continúa desde un estado existente.

## Paso 2. Obtener una fotografía real de los repositorios

Solicitar una inspección automatizada y no destructiva de frontend y backend.

La inspección deberá recoger:

* ruta del proyecto;
* rama activa;
* estado de Git;
* últimos commits;
* estructura principal;
* `package.json`;
* archivos de configuración;
* variables esperadas, sin mostrar secretos;
* rutas relacionadas con carrito, pedidos, checkout, Stripe y Strapi;
* resultados de build, lint o tests disponibles.

## Paso 3. Comparar código e informe

Determinar:

* qué información de este documento está confirmada;
* qué ha cambiado;
* qué implementación existe;
* qué está pendiente;
* qué inconsistencias aparecen.

## Paso 4. Emitir diagnóstico

Entregar un informe del estado real antes de escribir código.

## Paso 5. Ejecutar el Punto de Control 0

Auditar seguridad, privacidad y legalidad siguiendo este documento.

## Paso 6. Aprobar el siguiente bloque

Solo después de presentar el diagnóstico se decidirá qué modificación realizar primero.

---

# 15. INFORMACIÓN QUE NO DEBE INVENTARSE

Por la pérdida del chat anterior, deben verificarse y no suponerse:

* nombres exactos de archivos;
* endpoints concretos;
* nombres de colecciones de Strapi;
* nombres de componentes;
* variables de entorno;
* campos exactos del pedido;
* estados exactos;
* rutas de éxito y cancelación;
* implementación del webhook;
* estructura final del carrito;
* último archivo modificado;
* última prueba realizada;
* último error pendiente;
* estado del despliegue;
* existencia de cambios posteriores a los commits conservados.

Si el código contradice este informe, debe señalarse la contradicción y reconstruir el estado desde la evidencia del repositorio.

---

# 16. CRITERIOS DE SEGURIDAD DEL PROYECTO

Antes de considerar preparada la tienda para producción deberá cumplirse, como mínimo:

* ningún secreto privado llega al navegador;
* ningún precio definitivo depende del frontend;
* ningún pedido se confirma desde una URL de éxito;
* ningún evento de Stripe se procesa sin autenticación;
* ningún evento repetido crea efectos duplicados;
* ningún cliente puede consultar pedidos ajenos;
* los permisos públicos de Strapi están restringidos;
* se almacenan únicamente datos necesarios;
* los errores no exponen detalles internos;
* el sistema tolera reintentos y fallos parciales;
* los textos legales coinciden con el tratamiento real;
* las dependencias y configuraciones críticas están revisadas;
* existe una prueba completa del flujo;
* existe documentación de continuidad actualizada.

---

# 17. CRITERIO DE FINALIZACIÓN DE CADA CAMBIO

Cada cambio técnico deberá entregarse con:

1. objetivo;
2. archivos afectados;
3. comportamiento anterior;
4. comportamiento nuevo;
5. riesgos;
6. procedimiento automatizado de aplicación;
7. comprobaciones realizadas;
8. resultado de build o tests;
9. prueba manual solicitada al usuario;
10. instrucciones para revertir;
11. estado final de Git;
12. actualización del informe de continuidad.

Un cambio no se considera completado solo porque el código compile.

---

# 18. INSTRUCCIÓN DE CONTINUIDAD PARA EL NUEVO CHAT

Debes actuar como Director Técnico responsable de continuar TodoSatcom desde su estado real.

No debes empezar escribiendo código.

Tu primera tarea es:

1. leer íntegramente este informe;
2. preparar una inspección no destructiva de frontend y backend;
3. comprobar los commits `8b3a346` y `1aa5f00`;
4. reconstruir el estado real desde Git y los archivos;
5. señalar cualquier diferencia respecto a este documento;
6. presentar el diagnóstico;
7. comenzar el Punto de Control 0 de seguridad, privacidad y legalidad.

Mantén la metodología profesional por fases.

No simplifiques controles de seguridad para avanzar más rápido.

No delegues decisiones técnicas importantes en el usuario sin explicarlas.

No mezcles este proyecto con TodoSatcom anteriores, GuiaPineda, Rock & Apples, CUINA BURGER ni ningún otro proyecto.

No realices cambios extensos de una sola vez.

Cuando sea necesario modificar el proyecto, utiliza implementación automatizada, verificable y reversible desde terminal, evitando cadenas largas de edición manual.

La prioridad inmediata es recuperar el control técnico del estado del proyecto y validar su seguridad antes de continuar con el checkout.

---

# 19. RESUMEN EJECUTIVO

* El proyecto TodoSatcom continúa; no debe reiniciarse.
* Se mantienen frontend, backend, Strapi y Stripe.
* Stripe debe gestionar los datos sensibles de pago.
* El backend debe ser la autoridad sobre importes, productos y pedidos.
* Strapi debe almacenar únicamente la información operativa necesaria.
* Las referencias conservadas son:

  * backend: `8b3a346`;
  * frontend: `1aa5f00`.
* Los commits y el estado actual deben verificarse.
* El siguiente trabajo es el Punto de Control 0.
* Después se retomará el flujo previo al checkout.
* No se escribirá código antes de inspeccionar los repositorios.
* Todos los cambios deberán ser pequeños, automatizados, verificables y documentados.

---

# ANEXO A — PAQUETE DE EVIDENCIAS PARA RECUPERAR EL ESTADO REAL

Debido a la pérdida del chat `TODOSATCOM-15`, la continuidad no debe depender únicamente de la memoria ni del contenido narrativo de este informe.

Antes de realizar modificaciones, deberá generarse un paquete de evidencias no destructivo de los repositorios frontend y backend.

## A.1 Evidencias de Git

Para cada repositorio se recopilará:

* ruta absoluta;
* nombre del repositorio;
* rama activa;
* commit actual;
* estado del árbol de trabajo;
* archivos modificados;
* archivos no rastreados;
* cambios preparados para commit;
* últimos veinte commits;
* historial gráfico de ramas;
* ramas locales y remotas;
* etiquetas;
* stashes;
* repositorios remotos;
* diferencias respecto al commit activo;
* existencia y posición de los commits:

  * backend `8b3a346`;
  * frontend `1aa5f00`.

La inspección no deberá:

* cambiar de rama;
* restaurar archivos;
* borrar cambios;
* aplicar stashes;
* ejecutar migraciones;
* instalar o actualizar dependencias;
* modificar la base de datos;
* realizar commits;
* hacer push;
* revelar secretos.

## A.2 Inventario técnico

Se recopilará:

* estructura principal de directorios;
* archivos de configuración;
* manifiestos de dependencias;
* archivos de bloqueo;
* scripts disponibles;
* versiones de las herramientas;
* archivos relacionados con carrito;
* archivos relacionados con pedidos;
* archivos relacionados con Stripe;
* archivos relacionados con Strapi;
* endpoints;
* middleware;
* políticas;
* validadores;
* esquemas de contenido;
* configuración de CORS;
* configuración de seguridad;
* configuración de despliegue.

## A.3 Variables de entorno

Solo se mostrarán:

* nombres de las variables;
* archivo en el que se esperan;
* si parecen definidas o ausentes;
* si son públicas o privadas.

Nunca se mostrarán:

* claves;
* tokens;
* contraseñas;
* secretos de webhook;
* cadenas de conexión;
* datos personales;
* valores completos de variables privadas.

Los valores deberán sustituirse por indicadores como:

* `[DEFINIDA]`;
* `[AUSENTE]`;
* `[PÚBLICA]`;
* `[PRIVADA]`.

## A.4 Estado funcional

Se verificará:

* compilación del frontend;
* compilación o arranque verificable del backend;
* lint;
* tests existentes;
* rutas principales;
* estado del carrito;
* creación de pedidos;
* relación con Strapi;
* relación con Stripe;
* páginas de éxito y cancelación;
* tratamiento de errores.

Las pruebas que puedan crear pagos, pedidos, usuarios o modificar datos deberán identificarse antes de ejecutarse.

## A.5 Servicios externos

Se documentará, sin mostrar secretos:

* alojamiento del frontend;
* alojamiento del backend;
* entorno de Stripe;
* endpoint configurado para webhooks;
* eventos de Stripe escuchados;
* estado de la base de datos;
* configuración de Strapi;
* permisos de roles;
* dominios autorizados;
* URLs públicas;
* variables configuradas en el proveedor de despliegue.

## A.6 Clasificación de la información

Cada conclusión se marcará como una de las siguientes:

* **CONFIRMADO:** respaldado directamente por código, Git, configuración o prueba.
* **PROBABLE:** deducido con evidencia parcial.
* **RECUERDO DEL USUARIO:** información recordada, pero todavía no verificada.
* **PENDIENTE:** no ha podido comprobarse.
* **CONTRADICCIÓN:** el estado real no coincide con el informe de continuidad.

## A.7 Resultado de la reconstrucción

La reconstrucción deberá terminar con:

1. commit real de frontend;
2. commit real de backend;
3. cambios no confirmados;
4. funcionalidades existentes;
5. funcionalidades incompletas;
6. riesgos críticos;
7. errores actuales;
8. configuraciones pendientes;
9. último punto fiable de continuidad;
10. siguiente tarea concreta recomendada.

Hasta completar este paquete de evidencias no deberá modificarse el proyecto.

## A.8 Protección futura de la continuidad

Una vez reconstruido y validado el estado:

* guardar este informe como `CONTINUIDAD.md`;
* guardar el diagnóstico técnico;
* realizar un commit específico de continuidad;
* crear una etiqueta Git identificable;
* conservar una copia externa de los repositorios;
* actualizar el informe al cerrar cada bloque importante;
* no depender de un único chat como fuente exclusiva del estado del proyecto.

---

# ANEXO B — DECISIONES DE NEGOCIO CONFIRMADAS

**Fecha de reconfirmación:** 30 de julio de 2026

Estas decisiones proceden del cuestionario respondido por el usuario antes de la pérdida del chat. El código posterior fue desarrollado tomando esta información como referencia.

## B.1 Vendedor y estructura futura

1. La empresa vendedora será una sociedad de nueva creación, identificada provisionalmente como **TODOSATCOM SL**.
2. La sociedad todavía no dispone de razón social definitiva, CIF, domicilio fiscal ni estructura.
3. TodoSatcom venderá directamente; no actuará como mero intermediario de Seaconnect.
4. Stripe estará a nombre de TODOSATCOM SL y TODOSATCOM SL recibirá el dinero.
5. TODOSATCOM SL emitirá las facturas.
6. La autorización final para aceptar pagos reales corresponderá a TODOSATCOM SL.

## B.2 Clientes y territorios

1. La tienda venderá inicialmente a particulares y empresas.
2. El territorio inicial será toda España.
3. Una posible expansión intracomunitaria se estudiará posteriormente.
4. Los precios introducidos en Strapi normalmente no incluirán IVA; el tratamiento fiscal dependerá del perfil del cliente.
5. Se cobrarán gastos de envío, bien desglosados o incorporados al precio en determinados casos.

## B.3 Catálogo, stock y logística

1. Inicialmente solo se venderán equipos.
2. No se venderán todavía activaciones ni suscripciones de Starlink.
3. Seaconnect confirmará el stock, preparará los pedidos y realizará el envío.
4. El plazo orientativo general será de 48 horas hábiles.
5. Para Canarias, Ceuta y Melilla se estima inicialmente un plazo de 4 a 6 días hábiles, sujeto a las condiciones reales.
6. La dirección de devoluciones se determinará posteriormente; previsiblemente será Seaconnect.
7. Los datos necesarios para preparar el envío serán:

   * nombre completo;
   * teléfono de contacto;
   * correo electrónico;
   * dirección completa de envío;
   * instrucciones de entrega cuando sean necesarias.

## B.4 Atención, devoluciones y garantías

1. TODOSATCOM SL atenderá cancelaciones, devoluciones y reclamaciones.
2. El fabricante responderá de las garantías y productos defectuosos; TODOSATCOM SL actuará como mediador cuando corresponda.
3. El correo previsto de atención al cliente es `ayuda@todosatcom.com`.

## B.5 Textos y activación

1. TODOSATCOM SL redactará o aprobará:

   * aviso legal;
   * condiciones de compra;
   * política de privacidad;
   * política de envíos y devoluciones.

2. La información empresarial definitiva, fiscal, legal y operativa todavía no existe.
3. Las ausencias que dependan de la futura constitución, proveedores, contratos o cuentas reales deben clasificarse como **PENDIENTES DE ACTIVACIÓN**, no como defectos actuales.
4. El objetivo presente es dejar el sistema **PREPARADO PARA ACTIVACIÓN FUTURA — NO APTO PARA PRODUCCIÓN**.
5. No se inventarán datos definitivos ni se habilitarán ventas reales.

---

# ANEXO C — DIAGNÓSTICO DE RECONSTRUCCIÓN VALIDADO

**Fecha:** 30 de julio de 2026

## C.1 Estado Git recuperado

### Frontend

* Rama: `main`.
* Commit reconstruido antes del commit de continuidad: `f0fd0d4985bf54ccb25d6d77d62b4eb054bed522`.
* Commit abreviado: `f0fd0d4`.
* Mensaje: `feat: consultar estado seguro del checkout`.
* El commit de referencia `1aa5f00` existe y es antecesor.
* El repositorio estaba limpio.
* Existían tres commits locales posteriores a la referencia conservada.

### Backend

* Rama: `main`.
* Commit reconstruido antes de cerrar el bloque local: `253c529a0577980b71366a5f88d36e10daa4dd68`.
* Commit abreviado: `253c529`.
* Mensaje: `feat: preparar normalizacion de datos de cliente`.
* El commit de referencia `8b3a346` existe y es antecesor.
* Existían nueve commits locales posteriores a la referencia conservada.
* Se recuperaron seis cambios locales del bloque simulado de Seaconnect:

  * `.env.example`;
  * `docs/tienda/contrato-datos-cliente.md`;
  * `scripts/test-tienda.sh`;
  * `docs/tienda/contrato-seaconnect-simulado.md`;
  * `scripts/test-seaconnect-simulado.cjs`;
  * `src/utils/seaconnect-simulado.ts`.

## C.2 Verificaciones superadas

* Integridad de los paquetes de evidencias mediante SHA-256.
* Build completo de Strapi.
* Compilación TypeScript.
* Build del panel de administración.
* Pruebas compiladas de CORS.
* Pruebas compiladas de cabeceras de seguridad.
* Pruebas compiladas del bloqueo de autenticación pública no utilizada.
* Arranque de Strapi en una copia temporal.
* Respuestas HTTP correctas de las API utilizadas por el frontend.
* Build integrado del frontend Astro contra el Strapi temporal.
* Generación de 32 páginas estáticas.
* Generación del sitemap.
* Integridad de los repositorios originales antes y después.
* Ausencia de instalaciones, pagos reales y modificaciones de las bases originales durante las verificaciones.

## C.3 Arquitectura confirmada

* El backend es autoridad sobre precios, productos y totales.
* El carrito se valida contra Strapi.
* La preparación del checkout está bloqueada mediante banderas.
* La confirmación no depende de la página de éxito.
* Existe consulta pública mínima del estado del checkout.
* El webhook verifica la firma sobre el cuerpo original.
* Existen mecanismos de idempotencia para pedido, sesión y eventos.
* Los pedidos, líneas y eventos son privados en Strapi.
* La recogida y sincronización de datos personales permanecen desactivadas.
* El contrato de Seaconnect es exclusivamente simulado y no realiza conexiones.
* Stripe real y SeaConnect real permanecen bloqueados.

## C.4 Pendientes técnicos

* Completar la integración de la normalización de datos del cliente dentro del webhook, exclusivamente en modo simulado hasta disponer de los requisitos reales.
* Reforzar la adquisición atómica de eventos antes de añadir efectos externos.
* Desacoplar la validación del webhook de configuraciones que no necesita.
* Preparar una estrategia de rate limiting compartido para producción futura.
* Revisar vulnerabilidades y actualizaciones de dependencias de forma controlada.
* Mantener pruebas de regresión completas.

## C.5 Pendientes de activación futura

* constitución e identidad definitiva de TODOSATCOM SL;
* datos fiscales;
* reglas fiscales definitivas;
* tarifas y zonas reales de envío;
* condiciones de contratación;
* políticas legales definitivas;
* cuenta y claves reales de Stripe;
* configuración real del webhook;
* alojamiento y dominios definitivos;
* documentación, contrato y credenciales reales de Seaconnect;
* permisos y variables del entorno de producción;
* autorización empresarial para activar ventas.

## C.6 Resultado

La reconstrucción del estado real queda **COMPLETADA Y VALIDADA**.

El proyecto puede continuar desde la evidencia recuperada. No está listo para producción y no debe aceptar pagos reales. El límite actual consiste en avanzar técnicamente hasta que la siguiente decisión dependa exclusivamente de información empresarial, contractual o credenciales que todavía no existen.
