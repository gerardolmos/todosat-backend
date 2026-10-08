# Procedencia de la gobernanza SDD

- Constitution 1.0.0: ratificada por Gerard el 2026-10-04; preservada sin cambios en el repositorio histórico local SDD.
- Constitution 2.0.0: ratificada explícitamente por Gerard el 2026-10-08.
- `todosat-backend` pasa a ser custodio común. La fuente editable de Constitution 2.0.0 es `.specify/memory/constitution.md`; `todosat-frontend` conserva una copia controlada idéntica.
- Estado de transición: **NO CERRADA**. Esta adopción es exclusivamente local y parcial; no retira todavía la autoridad operativa del repositorio histórico local SDD.
- El repositorio histórico local SDD permanece preservado en la revisión `c73cbd545c699f0c4982bad31ad396771577bfd7`.
- En la adopción inicial no se migraron risks, production-gates, backlog ni ADRs; la migración local posterior se registra a continuación.
- En el momento de este registro no existen commits, pushes ni deploys de esta adopción. El commit de origen de Constitution 2.0.0 está pendiente y no debe inferirse del HEAD previo del backend.

## Migración local del núcleo — 2026-10-08

Estado: **EN CURSO; transición NO CERRADA**. Origen: repositorio histórico local SDD, HEAD `c73cbd545c699f0c4982bad31ad396771577bfd7`. Spec Kit **1.1.0**, workflow bundled **1.0.1** con adaptación local; no se atribuye una nueva versión upstream. Constitution 1.0.0 ratificada 2026-10-04 preservada; Constitution 2.0.0 ratificada 2026-10-08 permanece byte-identical en ambos repositorios.

Sin commits/push/deploy de esta adopción. Backend es custodio común y autoridad operativa futura; histórico no retirado. Cierre requiere revisión de diffs, commits aprobados, publicación controlada, verificación final y cierre explícito de Gerard.

FASE 0 se conserva íntegra en fase-0.md como snapshot histórico fechado 2026-10-04; sus afirmaciones no describen automáticamente el presente. Risks conserva sus registros abiertos y su naturaleza de registro inicial; no se acredita remediación. Gates conservan todos sus requisitos.

### Inventario previo completo

A: copia íntegra ambos; B: íntegra backend; C: íntegra frontend; D: adaptar; E: histórico no migrar; F: no necesario. No hay archivos C/F en el origen. No existe AGENTS.md versionado ni ADR de origen.

| Artefacto origen | Clase | Destino | Tratamiento |
|---|---|---|---|
| .agents/skills/speckit-analyze/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-checklist/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-clarify/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-constitution/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-converge/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-implement/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-plan/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-specify/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-tasks/SKILL.md | D | ambos | Adaptación local documentada |
| .agents/skills/speckit-taskstoissues/SKILL.md | D | ambos | Adaptación local documentada |
| .specify/.gitignore | A | ambos | Copia íntegra |
| .specify/init-options.json | A | ambos | Copia íntegra |
| .specify/integration.json | A | ambos | Copia íntegra |
| .specify/integrations/codex.manifest.json | A | ambos | Copia íntegra |
| .specify/integrations/speckit.manifest.json | A | ambos | Copia íntegra |
| .specify/memory/.constitution-template.json | A | ambos | Copia íntegra |
| .specify/memory/constitution.md | E | No migrar | Histórico; Constitution 2.0.0 existente no se sobrescribe |
| .specify/scripts/bash/check-prerequisites.sh | A | ambos | Copia íntegra |
| .specify/scripts/bash/common.sh | A | ambos | Copia íntegra |
| .specify/scripts/bash/create-new-feature.sh | A | ambos | Copia íntegra |
| .specify/scripts/bash/resolve-template.sh | A | ambos | Copia íntegra |
| .specify/scripts/bash/setup-plan.sh | A | ambos | Copia íntegra |
| .specify/scripts/bash/setup-tasks.sh | A | ambos | Copia íntegra |
| .specify/templates/checklist-template.md | A | ambos | Copia íntegra |
| .specify/templates/constitution-template.md | A | ambos | Copia íntegra |
| .specify/templates/plan-template.md | D | ambos | Adaptación local documentada |
| .specify/templates/spec-template.md | D | ambos | Adaptación local documentada |
| .specify/templates/tasks-template.md | D | ambos | Adaptación local documentada |
| .specify/workflows/speckit/workflow.yml | D | ambos | Adaptación local documentada |
| .specify/workflows/workflow-registry.json | D | ambos | Adaptación local documentada |
| README.md | E | No migrar | README obsoleto; sustituido por referencias locales |
| docs/sdd/backlog.md | D | backend | Adaptación de referencias; sin alterar gates ni iniciar backlog |
| docs/sdd/fase-0.md | B | backend | Copia íntegra histórica, fecha 2026-10-04 |
| docs/sdd/production-gates.md | D | backend | Adaptación de referencias; sin alterar gates ni iniciar backlog |
| docs/sdd/risks.md | B | backend | Copia íntegra; riesgos no cerrados |

### Adaptaciones exactas

- spec-template.md, plan-template.md, tasks-template.md: alcance, repo local, ID/coordinador/motivo cross-repo, referencia SPEC global, SHA contraparte y evidencia QA con pareja de SHAs y estado de deploy. tasks-template.md aclara QA obligatoria proporcional y rutas por repo.
- Los diez SKILL.md: bloque inicial común de prioridad constitucional, secuencia completa, autorizaciones, referencia a SPEC global sin duplicación, QA y transición. speckit-constitution añade guardia específica: frontend no origina enmiendas; backend requiere ratificación antes de sobrescribir.
- workflow.yml: añade clarify, analyze, gate de revisión/autorización de implementación y converge. Registry actualiza descripción. No se ha ejecutado el workflow.
- backlog.md: sustituye afirmaciones obsoletas sobre instalación/Constitution, sin iniciar features.
- production-gates.md: corrige referencia al repositorio documental, sin relajar gates.
- AGENTS.md en ambos, README frontend y estructura ADR backend son nuevos.
- governance-reference.json añade transition_status: in-progress; authority_commit sigue null.

Los manifiestos e installed_at originales se conservan íntegros como baseline upstream histórico. Sus hashes no describen las adaptaciones locales; los siguientes hashes registran el snapshot migrado. No ejecutar refresh sin revisar diferencias locales.

### Hashes del snapshot local migrado

| Repo | Archivo | SHA-256 |
|---|---|---|
| backend | .agents/skills/speckit-analyze/SKILL.md | 0b3261b13cc33537f24b3e1f6d5320694c348302c385d0046dc6b958cf2db6cb |
| backend | .agents/skills/speckit-checklist/SKILL.md | 7ac5cba31a27151a1a7b73f691bd478d42750ce2dd734701a07eb0e235ffbd94 |
| backend | .agents/skills/speckit-clarify/SKILL.md | 7d730064edc85e7ac0cea87cf50c21b2d5149a4a1a08cfe03cfbe1b236f5dae9 |
| backend | .agents/skills/speckit-constitution/SKILL.md | 90a87864d21f940e7fa5453cf8f9191dd3e557a4b5df9e36926cd3a6486154a5 |
| backend | .agents/skills/speckit-converge/SKILL.md | 5859c9780ddc012f600e7d35a5691e032fe05861296f226b5665a0ec03135ccd |
| backend | .agents/skills/speckit-implement/SKILL.md | 848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec |
| backend | .agents/skills/speckit-plan/SKILL.md | db2406adfa50103fc04ca8109ac934cd715086fba64365fb404630a88c62bda5 |
| backend | .agents/skills/speckit-specify/SKILL.md | 2794f1dda1338aeaa4df3ffdad1729426d265d3ba86cdc9d6564fe87d62cf9f1 |
| backend | .agents/skills/speckit-tasks/SKILL.md | e00ba17112457e0ff066177dda4e7fd7deb72c636ddac94f19135f4f3123b303 |
| backend | .agents/skills/speckit-taskstoissues/SKILL.md | a349d410c180385215bf5180b13319bd8259199267af24917f4f4d0adcbb6ad2 |
| backend | .specify/.gitignore | 8c908410d177a1ef3d0dee16d7ad55f2ac3333df3104c4d4adee1c9b82f1dbc1 |
| backend | .specify/init-options.json | 065ad1fcc4e5835de3484e93b9acb31c411a74ab6fa1a0c88a863d1796e5e657 |
| backend | .specify/integration.json | 8d2b0b7c9beac2ecb0afbe576f3efb60ad163cc42696b09735780a460363bf6b |
| backend | .specify/integrations/codex.manifest.json | 9faa0acfe2a02b66cc1b45037311fa3be23c47e7e32ee8992cef13616c56d487 |
| backend | .specify/integrations/speckit.manifest.json | 7458b5f47e3ac84407d9e4935992fe7bb86281edaf6a51b95e85f6eb2b844362 |
| backend | .specify/memory/.constitution-template.json | 8fc4b39294bae0c10d59547ad7d415b6f0e890d656cbf7171dd567f4e9054711 |
| backend | .specify/memory/constitution.md | 496e689579ec2bd9340d9b311ea36ee69e084c47309547d2af02fe1184cb14d7 |
| backend | .specify/scripts/bash/check-prerequisites.sh | 13be175548848bd84e96a90cf9be87665c2e68603b2eaa3e19187e7ca8b4fcb0 |
| backend | .specify/scripts/bash/common.sh | e3f72d571b8d27088a0aa6a96068eb6583175fbfa7a48bad465be62b9898f09c |
| backend | .specify/scripts/bash/create-new-feature.sh | 972f03ed8ca5ee17b7baad6d56d821d46269d77abc337496beafb0fe85a725f2 |
| backend | .specify/scripts/bash/resolve-template.sh | 829e227096abc8bf0889889ec9f792f503ca5d395b7836a8a7eb739ee75214e7 |
| backend | .specify/scripts/bash/setup-plan.sh | d0bd298c026446f3c63167130d65e49e4aa4485de6bef18bcdfd57b19aa0de96 |
| backend | .specify/scripts/bash/setup-tasks.sh | 0350b2def158c4dc333cd888fc5a3b10785b3d5c2cf936f93e910242ea9d507d |
| backend | .specify/templates/checklist-template.md | 70bbc48e884fab372ffb09e83e78ff983e28b69caebf8cd9964a02b6836683ac |
| backend | .specify/templates/constitution-template.md | ce7549540fa45543cca797a150201d868e64495fdff39dc38246fb17bd4024b3 |
| backend | .specify/templates/plan-template.md | 4f3a7c1d3af9e03ac59ac43a3fa282bcd20a730abfca564c5bec857b4cab512d |
| backend | .specify/templates/spec-template.md | 681694de7dd76f8d90e5332e89a267b208d2b5f7d25bc4bbcff588233a146c5c |
| backend | .specify/templates/tasks-template.md | 8d6e17d4bfe318faaeb1fad3441a287a52e5063e53347775be4d3dd23dc08a39 |
| backend | .specify/workflows/speckit/workflow.yml | 1a271e5a4e84c8b161883e1a787c7a6b53622b658aaf83500a96e33de823624d |
| backend | .specify/workflows/workflow-registry.json | 563636de8fb39fa7dc95287bdd2f6c03bbb13f20faf7b4857cfc74042cf31366 |
| backend | AGENTS.md | fd4d6ef01dd8e651d1c06d4a83649ded4de3665e6d4f3a48e98e9b4f7cbf2f18 |
| backend | docs/sdd/adr/README.md | 6d441fa9feccaae3c7ec48ec210661e226e6d6dbc0295908a28aa2f2919d06ec |
| backend | docs/sdd/backlog.md | 91d730481d08cfbb845b2d334443963359a82f4112e3f3185575fcc4877963b3 |
| backend | docs/sdd/fase-0.md | a2ce9699a299687c6be5618c47e229a33d9352fc72e3174d9b9b06fe22019af5 |
| backend | docs/sdd/production-gates.md | c3786950b4d928e40488572f967a6299a963370ee390645c44eb68e15564a9d6 |
| backend | docs/sdd/risks.md | 67dde5eef93cceac83341f3c288a5eec39815f5f2f52229cf2056808210de548 |
| frontend | .agents/skills/speckit-analyze/SKILL.md | 0b3261b13cc33537f24b3e1f6d5320694c348302c385d0046dc6b958cf2db6cb |
| frontend | .agents/skills/speckit-checklist/SKILL.md | 7ac5cba31a27151a1a7b73f691bd478d42750ce2dd734701a07eb0e235ffbd94 |
| frontend | .agents/skills/speckit-clarify/SKILL.md | 7d730064edc85e7ac0cea87cf50c21b2d5149a4a1a08cfe03cfbe1b236f5dae9 |
| frontend | .agents/skills/speckit-constitution/SKILL.md | 1f92121244d177413a5f0d2fcb3f0eea240e232f79bcf09b7dadf8e34faf7021 |
| frontend | .agents/skills/speckit-converge/SKILL.md | 5859c9780ddc012f600e7d35a5691e032fe05861296f226b5665a0ec03135ccd |
| frontend | .agents/skills/speckit-implement/SKILL.md | 848a5c9eff7b99e348927cbde6c35378de9fea3fd317941f58fa0b0b79301eec |
| frontend | .agents/skills/speckit-plan/SKILL.md | db2406adfa50103fc04ca8109ac934cd715086fba64365fb404630a88c62bda5 |
| frontend | .agents/skills/speckit-specify/SKILL.md | 2794f1dda1338aeaa4df3ffdad1729426d265d3ba86cdc9d6564fe87d62cf9f1 |
| frontend | .agents/skills/speckit-tasks/SKILL.md | e00ba17112457e0ff066177dda4e7fd7deb72c636ddac94f19135f4f3123b303 |
| frontend | .agents/skills/speckit-taskstoissues/SKILL.md | a349d410c180385215bf5180b13319bd8259199267af24917f4f4d0adcbb6ad2 |
| frontend | .specify/.gitignore | 8c908410d177a1ef3d0dee16d7ad55f2ac3333df3104c4d4adee1c9b82f1dbc1 |
| frontend | .specify/init-options.json | 065ad1fcc4e5835de3484e93b9acb31c411a74ab6fa1a0c88a863d1796e5e657 |
| frontend | .specify/integration.json | 8d2b0b7c9beac2ecb0afbe576f3efb60ad163cc42696b09735780a460363bf6b |
| frontend | .specify/integrations/codex.manifest.json | 9faa0acfe2a02b66cc1b45037311fa3be23c47e7e32ee8992cef13616c56d487 |
| frontend | .specify/integrations/speckit.manifest.json | 7458b5f47e3ac84407d9e4935992fe7bb86281edaf6a51b95e85f6eb2b844362 |
| frontend | .specify/memory/.constitution-template.json | 8fc4b39294bae0c10d59547ad7d415b6f0e890d656cbf7171dd567f4e9054711 |
| frontend | .specify/memory/constitution.md | 496e689579ec2bd9340d9b311ea36ee69e084c47309547d2af02fe1184cb14d7 |
| frontend | .specify/scripts/bash/check-prerequisites.sh | 13be175548848bd84e96a90cf9be87665c2e68603b2eaa3e19187e7ca8b4fcb0 |
| frontend | .specify/scripts/bash/common.sh | e3f72d571b8d27088a0aa6a96068eb6583175fbfa7a48bad465be62b9898f09c |
| frontend | .specify/scripts/bash/create-new-feature.sh | 972f03ed8ca5ee17b7baad6d56d821d46269d77abc337496beafb0fe85a725f2 |
| frontend | .specify/scripts/bash/resolve-template.sh | 829e227096abc8bf0889889ec9f792f503ca5d395b7836a8a7eb739ee75214e7 |
| frontend | .specify/scripts/bash/setup-plan.sh | d0bd298c026446f3c63167130d65e49e4aa4485de6bef18bcdfd57b19aa0de96 |
| frontend | .specify/scripts/bash/setup-tasks.sh | 0350b2def158c4dc333cd888fc5a3b10785b3d5c2cf936f93e910242ea9d507d |
| frontend | .specify/templates/checklist-template.md | 70bbc48e884fab372ffb09e83e78ff983e28b69caebf8cd9964a02b6836683ac |
| frontend | .specify/templates/constitution-template.md | ce7549540fa45543cca797a150201d868e64495fdff39dc38246fb17bd4024b3 |
| frontend | .specify/templates/plan-template.md | 4f3a7c1d3af9e03ac59ac43a3fa282bcd20a730abfca564c5bec857b4cab512d |
| frontend | .specify/templates/spec-template.md | 681694de7dd76f8d90e5332e89a267b208d2b5f7d25bc4bbcff588233a146c5c |
| frontend | .specify/templates/tasks-template.md | 8d6e17d4bfe318faaeb1fad3441a287a52e5063e53347775be4d3dd23dc08a39 |
| frontend | .specify/workflows/speckit/workflow.yml | 1a271e5a4e84c8b161883e1a787c7a6b53622b658aaf83500a96e33de823624d |
| frontend | .specify/workflows/workflow-registry.json | 563636de8fb39fa7dc95287bdd2f6c03bbb13f20faf7b4857cfc74042cf31366 |
| frontend | AGENTS.md | 0cbfc82f867b3f96b25f7280c5830ff3d9e47840087686bc8e57f7ccd9421f58 |
| frontend | docs/sdd/README.md | 76b981eefe0ffbe999a45d681490200bdc547eee2c08419f7c131603c1304810 |
| frontend | docs/sdd/governance-reference.json | f2580d7ec0a82ee2f1652f09afe8fca29f325b89a2d036e91c391190450ad1ed |
