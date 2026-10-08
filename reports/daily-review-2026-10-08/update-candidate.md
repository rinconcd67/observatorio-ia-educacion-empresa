# Candidato de actualización del Observatorio — 2026-10-08

## Resultado

Candidato local preparado en rama `update/observatorio-2026-10-08` desde `origin/main` limpio (`c132382`). Primer refresco estadístico completo desde la publicación de v0.5.0 (base del 2026-09-04): las once fuentes respondieron, el informe comparativo quedó **APROBADA PARA REVISIÓN HUMANA** y no hay variación en conteos ni en valores respecto de la base publicada.

## Cambios incluidos

1. Corrección del importador de fuentes (`src/refresh.mjs`): la cabecera `accept: text/csv` provocaba HTTP 500 en las dos fuentes SDMX de la OCDE y es rechazada con 406 por Eurostat cuando el formato ya va fijado en la URL. Pasa a `text/csv, */*;q=0.1`. Esta era la causa de que el flujo mensual `Proponer actualización de datos` quedara bloqueado el 2026-09-01 y el 2026-10-01 con 8 de 11 fuentes saludables.
2. Refresco de las once fuentes con fecha efectiva `2026-10-08T17:01:25Z`: huellas SHA-256 de archivos crudos, metadatos HTTP y fechas de ejecución actualizados en `source_runs.json`, `imf_aipi_run.json` y `oxford_readiness_run.json`. Oxford cambió los bytes de su página HTML (613.321 a 613.884 bytes) con observaciones idénticas; AIPI conserva los mismos bytes.
3. Ventana de noticias con doce titulares nuevos de OpenAI, Google AI y Microsoft Research (3 de 3 fuentes RSS), del 23 de septiembre al 8 de octubre de 2026.

## Informe comparativo contra la base publicada

| Indicador | Línea base | Candidato | Variación |
|---|---:|---:|---:|
| Países y economías | 218 | 218 | 0 |
| Observaciones | 5280 | 5280 | 0 |
| Fuentes activas | 11 | 11 | 0 |
| Fuentes saludables | 11 | 11 | 0 |
| Medición directa de IA | 40 | 40 | 0 |
| AIPI | 165 | 165 | 0 |
| Oxford | 194 | 194 | 0 |

Comparación valor a valor entre `data/baselines/published-snapshot.json` y `data/processed/snapshot.json`: 5.199 observaciones comparables, 0 solo en base, 0 solo en candidato, 0 valores distintos. Detalle en `reports/publication-candidate.md`.

## Diagnóstico de la fuente OCDE

- Con `curl`, las URL configuradas respondían 200 mientras el importador recibía 500 tres veces seguidas.
- Aislado con Node: `accept: text/csv` produce 500 en `DSD_ICT_B@DF_BUSINESSES,1.0` y en `DSD_ICT_HH_IND@DF_IND,1.1`; `accept: */*` y `text/csv, */*;q=0.1` producen 200 con `application/vnd.sdmx.data+csv`. Eurostat responde 406 a `text/csv` a secas y 200 a la variante elegida.
- Las versiones de los dataflows en el catálogo SDMX (`1.0` para empresas; `1.0` y `1.1` para individuos) coinciden con la configuración: la versión no era la causa.
- Durante las pruebas en ráfaga la OCDE devolvió 429; el cliente HTTP ya respeta `Retry-After`.

## Titulares incorporados

- OpenAI — `Disrupting AI-enabled “false front” operations`, 2026-10-08.
- Microsoft Research — `Agent Lightning v1.0: A 3,500-Line Lightweight Agentic RL Framework for Training Agents with Any Framework`, 2026-10-07.
- OpenAI — `Helping teens learn, plan, and shape the future of AI`, 2026-10-07.
- Google AI — `Introducing Playground: Create and play custom games`, 2026-10-07.
- OpenAI — `Radisson Hotel Group brings hotel discovery into ChatGPT`, 2026-10-07.
- OpenAI — `GPT-6 and Intelligent UI for everyone`, 2026-10-07.
- Microsoft Research — `What AI gets wrong and what failure teaches us`, 2026-10-06.
- Google AI — `The latest AI news we announced in September 2026`, 2026-10-02.
- Microsoft Research — `Forecasting space weather risks on power grids`, 2026-09-30.
- Microsoft Research — `Introducing Quine: An AI research system designed for the complexity of biology`, 2026-09-29.
- Google AI — `Watch the winning trailer from the Future Vision XPRIZE, The Gifted.`, 2026-09-28.
- Google AI — `Google Beam expands with new regions, partners, and customers`, 2026-09-23.

## Validación local

- `npm ci`: 6 paquetes, sin vulnerabilidades reportadas.
- `npm run import:aipi && npm run import:oxford && npm run refresh:data && npm run refresh:news && npm run build`: OK en el orden canónico.
- `npm run check`: 76 tests pass, 0 fail, 0 skipped (con `data/raw` presente, la prueba de integridad de huellas crudas se ejecuta y pasa).
- `npm run validate`: OK; 218 países, 5.280 observaciones, 40 países con medición directa.
- `npm run check:publication`: APROBADA PARA REVISIÓN HUMANA; 11 controles de aceptación, 11 aprobados; huellas SHA-256 de archivos exactos 11/11.
- `git diff --check`: OK.

## Límites

- No hay datos nuevos: el valor de esta actualización es la verificación de las once fuentes al 8 de octubre y la reparación del importador; la fecha estadística de portada pasa a reflejar el refresco verificado.
- La ejecución local corrió fuera del sandbox de la sesión de trabajo porque Node no resuelve DNS dentro de él; el flujo en GitHub Actions no tiene esa limitación.
- No se modificó branch protection ni se publicó directamente. La integración se hace por pull request con el check requerido `validate`.
- Pendiente aparte: PR #58 (`ci/news-single-rolling-pr`) corrige el flujo diario de titulares y limpia 31 propuestas y 33 ramas antiguas; es independiente de este candidato.
