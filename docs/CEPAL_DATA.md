# CEPALSTAT: datos de contexto

Tres series separadas de las mediciones de adopción de IA: hogares con Internet por quintil (4052), hogares con Internet por zona (4891) y escuelas con Internet para fines pedagógicos (3816). Configuración en `config/cepal-sources.json`.

`node src/import-cepal.mjs` recupera las tres API públicas, valida respuestas y preserva el snapshot anterior si falla alguna o disminuye su cobertura no nula. No hay fallback silencioso. `node src/import-cepal.mjs --offline DIRECTORY` usa explícitamente los archivos `cepalstat-ID-data.json` de una revisión previa y etiqueta cada fuente como `review_snapshot`; no acredita una lectura nueva de la API.

## Esquema

`data/processed/cepal-context.json` contiene `series[]` con metadatos y `observations[]` dentro de cada serie, más `source_runs[]`. Cada serie conserva título ES/EN, origen, definición oficial, URL, actualización declarada de la fuente y resumen: `records`, `non_null`, `missing`, `countries_and_territories`, `country_codes`, `aggregate_records`, `min_year`, `max_year`.

Cada observación conserva `metric_id`, `indicator_id`, `geography_id`, `iso3`, `country`, `geography_type`, `year`, `category_id`, `category`, `category_en`, `value`, `raw_value`, `unit`, `source_id`, `notes`, `missing_reason` y, para escuelas, `report_type_id`/`report_type`. Los agregados tienen `iso3: null`, sin códigos inventados; no deben sumarse o promediarse con países. Las combinaciones ausentes no se crean como ceros. No todos los países tienen todos los años o categorías.

La nota 12256 significa dato nulo; prevalece sobre `value: "0"`. Se mantienen el literal original y el motivo de ausencia. El cero sin esa nota sigue siendo cero. Los códigos de fuente individuales nulos se conservan como `null`, sin atribuirles una fuente individual no declarada; el origen de la serie sigue documentado.

Las tres respuestas de la revisión del 20/10/2026 contienen 3.105 filas (incluidos agregados), 3.103 valores efectivos y dos ausencias señaladas por la fuente. Las filas no equivalen a países, personas ni escuelas únicas. 4052/4891 derivan de ODD/BADEHOG; 3816 redistribuye ODS/UIS y no constituye una medición independiente de esa fuente primaria.

Se guarda hash y tamaño de la respuesta recibida y del snapshot saneado. Los snapshots de `data/raw/cepal-ID.json` son locales e ignorados por Git; excluyen IP del cliente, identificadores de servidor y demás footer técnico. El archivo procesado expone únicamente campos públicos seleccionados. La actualización de metadatos, el año observado y la fecha de recuperación son estados distintos.

Conservar atribución a CEPALSTAT y fuente primaria. [API oficial](https://statistics.cepal.org/portal/cepalstat/open-data.html?lang=es). No se declara una licencia de reutilización distinta de las condiciones y metadatos oficiales. No se mezclan estas series con ILIA, IMF AIPI, Oxford ni porcentajes de adopción de IA.
