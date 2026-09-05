# Bibliotecario bilingüe del Observatorio

El bibliotecario mantiene una bandeja de revisión verificable. No modifica el catálogo ni publica páginas. La ejecución local y una tarea recurrente son componentes distintos: este programa no instala ni programa tareas por sí mismo.

## Operación

Desde la raíz del proyecto:

```sh
node src/librarian.mjs --offline
node src/librarian.mjs --check
```

`--offline` valida `data/processed/library.json`: metadatos, enlaces HTTPS, identificadores y URLs duplicados, y presencia de título, resumen, destinatarios y aportes en español e inglés. No accede a la red y conserva las verificaciones de enlaces anteriores. Esta validación estructural no certifica calidad lingüística ni fidelidad de los resúmenes.

`--check` añade consultas secuenciales a las fuentes oficiales permitidas en `config/library-sources.json`. Aplica 12 segundos por documento, máximo de 8 MB y cuatro redirecciones. Comprueba cada destino antes de seguirlo. Produce `reports/library-review.json`; las fichas del catálogo permanecen intactas.

Un 403 se registra como `access_blocked`, no como documento inexistente. También separa errores HTTP, tiempo agotado y problemas de red. La última respuesta correcta se conserva cuando falla una comprobación posterior. Los recursos demasiado grandes quedan pendientes, sin almacenar un hash incompleto. Un hash diferente solo indica bytes diferentes: menús, avisos y contenido dinámico pueden cambiar sin que exista una nueva edición. Incluso un HTTP 200 puede corresponder a una pantalla de desafío y exige revisión si el contenido resulta sospechoso. El proceso devuelve código 1 ante errores de validación o acceso; un cambio potencial de contenido produce una propuesta editorial, no un fallo técnico.

## Flujo semanal de curación

1. Ejecutar la validación y la comprobación de enlaces.
2. Visitar todos los portales de `config/library-sources.json`: UNESCO, BID, OCDE y MIT, incluyendo el [Observatorio UNESCO de Ética y Gobernanza de IA](https://www.unesco.org/ethics-ai/en) y el [portal de ética de la neurotecnología](https://www.unesco.org/en/ethics-neurotech). Buscar novedades por tema y fecha. El script aporta estos portales, pero no descubre publicaciones automáticamente. Un agente de investigación con navegador realiza esta parte. Para neurotecnología, contrastar páginas históricas y borradores con el [texto adoptado en 2025](https://www.unesco.org/en/legal-affairs/recommendation-ethics-neurotechnology). Registrar publicaciones, herramientas y páginas de eventos según su naturaleza; estos enlaces de seguimiento no implican afiliación institucional ni una conexión API.
3. Comparar DOI, título original, idioma y edición con el catálogo antes de proponer un recurso. La detección de URL duplicada no sustituye esta revisión: un documento puede tener varias URLs.
4. Leer el documento o señalar con precisión el alcance disponible en `review_scope` (ficha, resumen o texto completo). Nunca presentar una reseña de texto completo si solo se pudo leer el resumen.
5. Preparar ambas fichas, conservar el título original y declarar el idioma real del documento. Una reseña traducida no es una traducción oficial del documento ni garantiza que exista una edición en ese idioma.
6. Registrar las propuestas y su evidencia; el responsable editorial revisa ambas versiones, pertinencia, atribución y licencia antes de incorporarlas. No redistribuir un PDF sin licencia compatible.
7. Con aprobación, incorporar la ficha al catálogo, ejecutar las pruebas y reconstruir la biblioteca. La publicación remota es un paso separado.

Solo se notifica una novedad pertinente, cambio potencial que requiera revisión, fallo persistente o decisión editorial pendiente. Si no cambia nada relevante, no es necesario emitir un aviso. La primera ejecución crea la referencia técnica; no demuestra la antigüedad ni fecha de publicación del contenido.

Las propuestas automáticas incluyen correcciones del catálogo, problemas de acceso y posibles cambios de contenido. La selección, traducción y evaluación de evidencia permanecen en el flujo editorial humano asistido por IA.

## Seguimiento conectado

La automatización Codex existente «Revisión diaria del Observatorio de IA» fue actualizada para incluir investigación bibliotecaria una vez cada siete días; conserva su horario diario 09:00 America/New_York y evita duplicar avisos. El script comprueba enlaces; la tarea recurrente realiza la búsqueda web y prepara las reseñas. Estado semanal: reports/library-weekly-state.json. Propuestas editoriales: reports/library-proposals.md. No se ha creado otro cron ni activado un despliegue.
