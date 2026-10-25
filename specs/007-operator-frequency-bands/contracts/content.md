# Contrato
Operador REST incorpora bandas_frecuencia: string opcional, sin default, sin required. No populate extra al ser escalar. Ausente/null/vacío/blancos no produce fila. Texto no vacío se escapa mediante Astro; sin HTML, no enum/unidades implícitas. No cambia resto de técnicas ni Home. Frontend puede desplegarse antes y omitir campo ausente; backend añade columna nullable bajo deploy autorizado.
No cambios API de escritura personalizados ni migración de registros.
