# TODOSATCOM — CONSTITUTION 2.0.0

**Estado: RATIFICADA — Constitution 2.0.0 aprobada explícitamente por Gerard el 2026-10-08.**

Este documento contiene la Constitution 2.0.0 de TodoSatcom. Su ratificación no acredita que la transición documental esté completada; la sustitución de la autoridad operativa histórica se rige por la sección de transición y preservación histórica.

Gobierna `todosat-frontend`, `todosat-backend`, sus interacciones, producción y futuras features.

**MUST** indica obligación; **MUST NOT**, prohibición; **SHOULD**, recomendación cuya desviación debe justificarse. La Constitution no concede autorizaciones operativas por sí misma.

## Principios fundamentales

### I. Protección de producción, datos y entornos

TodoSatcom tiene producción real. Toda actuación MUST identificar el entorno y sus destinos efectivos. Trabajar localmente, en un preview o dentro de un repositorio temporal MUST NOT interpretarse como aislamiento. Staging MUST NOT darse por existente sin evidencia.

Tests con escritura, migraciones, seeds, imports y scripts destructivos MUST realizarse en un entorno inequívocamente no productivo. Una operación equivalente en producción MUST tratarse como operación sensible independiente, con alcance específico, gates satisfechos y aprobación explícita de Gerard; nunca como continuación implícita de una prueba.

Las operaciones capaces de afectar datos, schemas, medios o producción MUST cumplir íntegramente los gates de producción aplicables. El agente MUST NOT omitirlos por conveniencia. Un gate sin evidencia permanece pendiente.

Backups, integridad, restaurabilidad y mecanismos de recuperación MUST NOT darse por acreditados sin evidencia. Un rollback de código no implica recuperación de datos, schemas o medios.

### II. SDD antes de implementar

Los cambios funcionales MUST seguir el flujo:

**SPECIFY → CLARIFY → PLAN → TASKS → ANALYZE → IMPLEMENT → CONVERGE**

Cada etapa MUST dejar evidencia suficiente para la siguiente. CLARIFY puede registrar que no quedan ambigüedades relevantes.

Una necesidad nueva MUST NOT implementarse sin especificación suficiente, planificación, tareas y análisis de consistencia. Registrar una candidate feature no inicia su implementación. Los workflows y plantillas de herramientas MUST NOT sustituir ni acortar este proceso por defecto.

La profundidad y extensión de cada artefacto SHOULD ser proporcional al alcance, riesgo y complejidad del cambio. SDD MUST aportar claridad y seguridad, no documentación innecesaria.

### III. Alcance limitado y reversibilidad

Cada cambio MUST responder a una necesidad real y mantenerse pequeño, verificable y reversible mediante un procedimiento adecuado a su impacto.

El agente MUST NOT refactorizar, modernizar, activar funcionalidades ni ampliar el alcance por iniciativa propia.

Código dormido, tienda, marketplace o capacidades futuras deliberadamente aisladas MUST NOT clasificarse automáticamente como defectos o deuda. Su estado requiere evidencia y una decisión explícita; mencionarlos no autoriza su activación.

### IV. Gobernanza común y autoridad documental única

TodoSatcom mantiene dos repositorios de implementación:

- **Frontend:** repositorio `todosat-frontend`.
- **Backend:** repositorio `todosat-backend`.

No se creará un tercer repositorio GitHub para SDD. Las rutas físicas de los repositorios pertenecen a la documentación operacional.

**Backend MUST actuar como custodio común de la gobernanza SDD**, conservando las fuentes editables autoritativas de:

- Constitution.
- Registro de riesgos comunes.
- Gates de producción.
- Backlog común.
- ADR comunes.

La custodia documental no establece superioridad funcional del backend ni transfiere a sus agentes la autoridad de Gerard.

Cada riesgo común, gate de producción y ADR común MUST tener una única fuente autoritativa. Los documentos locales podrán referenciarla y aportar evidencia específica, pero MUST NOT mantener decisiones comunes divergentes.

La ubicación autoritativa y la revisión aplicable de los documentos comunes MUST quedar identificadas de forma verificable.

### V. Constitution única y copia controlada

La Constitution MUST tener un único contenido normativo y una única fuente editable autoritativa, custodiada en backend.

Frontend MUST conservar una copia controlada **idéntica byte a byte** a la revisión autoritativa adoptada. Esa copia MUST NOT utilizarse como origen independiente de enmiendas.

La versión, el hash SHA-256 y la procedencia de la copia MUST registrarse en un documento de control separado, identificando el repositorio, la ruta y la revisión de origen. Los metadatos locales MUST NOT introducir diferencias en el contenido de la Constitution.

Las enmiendas MUST proponerse sobre la fuente autoritativa y, tras su aprobación, sincronizarse mediante el procedimiento autorizado. La sincronización no autoriza por sí misma commit, push, merge o deploy.

Una discrepancia de contenido, versión, hash o procedencia MUST bloquear el trabajo SDD afectado hasta resolverla con evidencia. El agente MUST NOT elegir silenciosamente una versión ni fusionar normas por su cuenta.

### VI. Artefactos locales junto a su implementación

Cada feature MUST declarar su alcance:

- `frontend-only`.
- `backend-only`.
- `cross-repo`.

Para una feature `frontend-only`, SPEC, PLAN, TASKS y QA MUST residir en frontend. Para una feature `backend-only`, MUST residir en backend.

El código y la documentación de implementación MUST evolucionar en el mismo historial Git del repositorio afectado, respetando las autorizaciones de cada operación.

Los documentos locales MUST referenciar la gobernanza común aplicable sin convertirse en una segunda autoridad sobre Constitution, riesgos comunes, gates o ADR comunes.

PLAN y TASKS MUST identificar el repositorio de implementación de cada cambio y sus dependencias. Cambiar el alcance requiere revisión antes de actuar sobre otro repositorio.

### VII. Coordinación determinista de features cross-repo

Las features cross-repo MUST utilizar un ID común y elegir coordinador mediante estas reglas, en este orden:

1. **Backend coordina** si cambia la API, los datos persistidos, los permisos, los eventos, las reglas de negocio backend o el contrato de servicio.
2. **Frontend coordina** si esos contratos permanecen compatibles y el cambio principal afecta al comportamiento visible o la interacción.
3. **Backend coordina como desempate** cuando no exista un propietario claro.

Esta regla es una convención de coordinación, no una jerarquía funcional.

El repositorio coordinador MUST conservar la **SPEC global autoritativa** y el plan de coordinación. El otro repositorio MUST referenciarlos; MUST NOT mantener una segunda SPEC global editable.

Ambos repositorios MUST mantener sus propios PLAN, TASKS y QA locales, vinculados al ID común y a la revisión de la SPEC global aplicable.

La coordinación MUST definir dependencias, compatibilidad, orden de despliegue y estado de publicación. Dos repositorios MUST NOT interpretarse como un despliegue atómico.

La QA cross-repo MUST identificar la pareja exacta:

**`{ frontend SHA, backend SHA }`**

También MUST registrar el orden y estado de despliegue correspondiente, distinguiendo lo previsto de lo ejecutado. Una validación MUST NOT extenderse automáticamente a otra pareja de revisiones.

### VIII. Separación de autorizaciones y control de publicación

Gerard conserva la autoridad de aprobación, aceptación de riesgos, cambios productivos y ratificación de la Constitution.

Las autorizaciones MUST distinguir entre:

- Preparar o proponer cambios.
- Modificar archivos.
- Crear commits.
- Hacer push o merge.
- Ejecutar deploys.
- Operar sobre datos o producción.

Una autorización puede cubrir varias acciones cuando lo indique expresamente. El agente MUST NOT inferir permisos adicionales de una autorización más limitada.

Modificar o aprobar documentación MUST NOT interpretarse como autorización para modificar código. Implementar no autoriza commit, push ni deploy; un commit tampoco autoriza push.

Push o merge a `main` de frontend o backend MUST tratarse como acción de producción, incluso para cambios documentales. La existencia de filtros de deploy no elimina esa exigencia de autorización.

El flujo editorial ordinario ya autorizado:

**Strapi → `publicacion-web` → Netlify Build Hook**

no requiere una nueva autorización técnica para cada publicación normal dentro de su alcance aprobado.

Cambiar ese mecanismo, sus permisos, hooks, destinos o comportamiento de despliegue MUST tratarse como cambio de producción y cumplir los gates aplicables.

La documentación MUST NOT convertirse en una vía indirecta de autorización o publicación productiva.

### IX. Exclusión de cambios documentales del deploy

Los cambios puramente documentales SDD podrán quedar excluidos del deploy automático únicamente mediante mecanismos previamente validados.

La clasificación como documental MUST basarse en su efecto sobre el sistema, no solo en su extensión o ubicación. MUST verificarse que los archivos excluidos no alteran el output ni el comportamiento relevante del build o runtime.

Los filtros MUST preservar los despliegues funcionales y las vías de publicación autorizadas.

Ante errores o ambigüedad, un filtro de omisión MUST NOT concluir silenciosamente que el cambio es solo documental: deberá permitir el flujo normal de build/deploy autorizado —comportamiento *fail-open* respecto de la omisión—. Los controles de autorización y protección de producción MUST seguir siendo *fail-safe*: una falta de autorización o un gate pendiente no se resuelve permitiendo la operación.

Los patrones concretos, configuración de proveedores, pruebas y evidencias MUST mantenerse en documentación operacional, no en el núcleo constitucional.

### X. Evidencia actual y validación honesta

La evidencia actual verificable MUST prevalecer sobre descripciones históricas del estado, sin convertir el comportamiento observado en una decisión normativa aprobada.

Las contradicciones MUST señalarse. Lo desconocido MUST permanecer identificado como tal.

Cada feature MUST permitir relacionar:

**requisito → SPEC → PLAN → TASKS → implementación → QA → commits → deploys**

La trazabilidad MUST identificar las revisiones exactas validadas. Cuando no haya commit o deploy, MUST constar como no realizado.

QA MUST corresponder al cambio y a las revisiones exactas, con resultados y limitaciones explícitos. El agente MUST NOT afirmar que tests, backups, restores, deploys o estados están confirmados sin evidencia, ni presentar pruebas no ejecutadas como superadas.

La validación SHOULD ser proporcional al riesgo y comprobar el comportamiento relevante. Un resultado de laboratorio MUST NOT presentarse como validación productiva sin evidencia aplicable a ese entorno.

### XI. Firewall absoluto entre proyectos y secretos

TodoSatcom MUST mantenerse independiente de GUIAPINEDA y de cualquier otro proyecto.

El agente MUST NOT leer o importar decisiones, código, Constitution, SPECs, configuración, arquitectura ni credenciales de otros proyectos para gobernar o implementar TodoSatcom. Las herramientas estándar autorizadas no constituyen autorización para reutilizar contenido de otros proyectos.

Los secretos MUST NOT almacenarse, mostrarse ni copiarse en documentación, prompts, logs o código versionado.

Las comprobaciones de configuración MUST usar nombres y estados sin revelar valores privados.

## Fuentes operativas y pendientes

El estado operativo y los pendientes vigentes MUST mantenerse en `risks`, `production-gates`, `backlog`, ADRs y los artefactos de feature correspondientes. Los documentos aplicables MUST consultarse antes de actuar.

La Constitution no declara resueltos esos pendientes. Su resolución MUST registrarse en la documentación correspondiente, con la decisión y evidencia aplicables; no requiere una enmienda constitucional mientras no cambien los principios o reglas de esta Constitution.

La transición documental MUST conservar la trazabilidad de los riesgos y pendientes existentes. Cambiar su ubicación no constituye cierre, aceptación ni resolución.

## Transición y preservación histórica

El **repositorio histórico local SDD** MUST conservarse como archivo histórico y procedencia de la adopción inicial.

La Constitution 1.0.0 MUST preservarse sin eliminarla ni reescribirla, incluida su ratificación del **2026-10-04** y la declaración de aprobación de Gerard.

La adopción del nuevo modelo MUST dejar evidencia de:

1. Ratificación explícita de la Constitution 2.0.0.
2. Ubicación de las fuentes comunes autoritativas en backend.
3. Copia idéntica en frontend, con versión, hash y procedencia registrados.
4. Referencias locales coherentes y continuidad de riesgos, gates y pendientes.
5. Cierre documentado de la transición por Gerard.

Hasta completar y validar la transición, el repositorio histórico local SDD MUST NOT declararse retirado como autoridad operativa. Los documentos trasladados MUST identificar su estado transitorio para evitar dos autoridades simultáneas.

Tras ese cierre, el repositorio histórico local SDD dejará de ser autoridad operativa. Sus documentos conservarán valor histórico y de procedencia; MUST NOT utilizarse como fuente vigente para contradecir la gobernanza adoptada.

La ratificación de esta Constitution no autoriza por sí misma su copia, migración, commit, push, merge o despliegue.

## Gobernanza y enmiendas

Gerard decide objetivos, prioridades, requisitos funcionales, aceptación de riesgos y autorización de operaciones sensibles y de producción.

Codex puede inspeccionar, proponer e implementar únicamente dentro del alcance autorizado. La aceptación de un riesgo MUST NOT interpretarse como dispensa implícita de los gates.

Toda propuesta de cambio MUST evaluarse contra la Constitution vigente. Las instrucciones locales y herramientas MUST NOT contradecirla.

Las enmiendas MUST documentar motivo, impacto, versión y fecha, y requerir aprobación explícita de Gerard. Los detalles operativos seguirán en sus documentos específicos.

La versión **2.0.0** cambia el modelo de autoridad documental: de un repositorio SDD separado a gobernanza distribuida entre repositorios de implementación con un custodio común.

**Versión:** 2.0.0
**Estado:** RATIFICADA
**Fecha de ratificación:** 2026-10-08
**Fecha de enmienda efectiva:** 2026-10-08
**Antecedente histórico:** Constitution 1.0.0, ratificada el 2026-10-04; fecha original inalterada.
