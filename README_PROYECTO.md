# Proyecto: Observatorio de IA en Educación y Empresa por Países

Fecha de apertura: 2026-08-01  
Responsable académico: César David Rincón Godoy

## Propósito

Construir un sistema de monitoreo continuo sobre los avances, usos, brechas y condiciones de adopción de la inteligencia artificial en los sectores educativo y empresarial, con comparación por países y regiones. El sistema debe servir como tablero académico, insumo de investigación doctoral y base para análisis institucional sobre gestión académica, toma de decisiones y transformación digital.

## Tesis del sistema

El tablero no debe limitarse a mostrar rankings de IA. Debe separar tres dimensiones que suelen mezclarse en los informes internacionales:

- **Uso real de IA:** docentes, estudiantes, individuos o empresas que reportan uso de herramientas o tecnologías de IA.
- **Capacidad de adopción:** infraestructura digital, capital humano, regulación, innovación y madurez tecnológica del país.
- **Gobernanza educativa y empresarial:** políticas, estrategias, presupuesto, evaluación, gestión de riesgos y uso responsable de IA.

Esta separación permite explicar por qué un país puede tener alta preparación tecnológica, pero baja adopción educativa; o alta adopción empresarial, pero débil gobernanza institucional.

## Fuentes priorizadas

| Fuente | Cobertura | Sector | Tipo de acceso | Valor para el tablero |
|---|---:|---|---|---|
| OECD TALIS 2024 | Países/sistemas participantes | Educación escolar | Descarga pública en CSV/R/SPSS/Stata | Uso de IA por docentes, prácticas pedagógicas, barreras y percepciones |
| OECD ICT Access and Usage by Businesses | OECD, socios y datos Eurostat integrados | Empresas | API SDMX gratuito | Adopción de IA por empresas, tamaño, industria y año |
| OECD ICT Access and Usage by Households and Individuals | OECD y socios | Individuos/educación formal | API SDMX gratuito | Uso de IA generativa por estudiantes, empleo, edad, ingreso y educación |
| Eurostat `isoc_eb_ai` | Unión Europea | Empresas | API gratuito JSON-stat/SDMX/CSV | Uso de tecnologías de IA por empresas europeas, tipo de tecnología y tamaño |
| Eurostat `isoc_ai_iaiu` | Unión Europea | Individuos/educación formal/trabajo | API gratuito JSON-stat/SDMX/CSV | Uso de IA generativa en los últimos tres meses, incluyendo educación formal |
| UNESCO DataHub / UIS SDG 4 | Global | Educación | API gratuito y descarga masiva | Indicadores educativos de contexto: acceso, gasto, logro, docentes, equidad |
| UNESCO IESALC 2026 | América Latina y el Caribe | Educación superior | Artículo abierto; no se confirmó API | Adopción y gobernanza de IA en instituciones de educación superior |
| World Bank EdStats / Indicators API | Global | Educación y contexto país | API gratuito sin llave | Indicadores comparables de educación, economía, población y conectividad |
| IMF AI Preparedness Index | 173-174 países | Preparación país | DataMapper/API parcial y descarga | Índice de preparación para adopción de IA y cuatro dimensiones estructurales |
| Oxford Insights Government AI Readiness | 195 gobiernos | Gobierno/política pública | Descarga de datos; no API estable confirmado | Preparación gubernamental para aprovechar IA en beneficio público |
| Stanford AI Index | Global | Economía, educación, I+D, opinión pública | Datos públicos descargables | Tendencias globales, economía de IA, educación y adopción social |

## Validación inicial de APIs gratuitas

Pruebas locales realizadas el 2026-08-01:

- **World Bank Indicators API:** responde `HTTP 200`; no requiere llave; permite JSON.
- **UNESCO DataHub API:** responde `HTTP 200`; expone límites de uso visibles (`X-RateLimit-Limit: 10000`).
- **Eurostat Statistics API:** responde `HTTP 200`; gratuito; CORS habilitado; formatos JSON-stat, SDMX y CSV.
- **OECD SDMX API:** responde `HTTP 200`; gratuito; soporta CSV con etiquetas y JSON SDMX; útil para automatización.
- **IMF DataMapper API:** responde para metadatos e indicadores; el indicador `AIPI` aparece en el catálogo, pero la ruta directa probada no devolvió serie numérica. Debe integrarse por descarga completa del dataset o con validación adicional del endpoint exacto.
- **OECD TALIS 2024:** fuente confirmada por navegación oficial; la página bloquea `curl` con Cloudflare, por lo que se recomienda descarga programada controlada desde los archivos públicos o carga manual versionada.

## Modelo de datos propuesto

### Tabla `country`

- `iso3`
- `country_name`
- `region_un`
- `region_world_bank`
- `income_group`
- `oecd_member`
- `eu_member`

### Tabla `ai_education_adoption`

- `iso3`
- `year`
- `education_level`
- `population_group`
- `indicator_code`
- `indicator_name`
- `value`
- `unit`
- `source`
- `method_note`

Ejemplos de indicadores: docentes que usan IA, uso de IA para planificar clases, uso de IA para evaluación, uso de IA generativa para educación formal, existencia de políticas institucionales de IA.

### Tabla `ai_business_adoption`

- `iso3`
- `year`
- `enterprise_size`
- `industry`
- `ai_technology_type`
- `indicator_code`
- `value`
- `unit`
- `source`

Ejemplos de indicadores: empresas que usan IA, empresas que usan IA generativa, uso de IA por sector, tamaño de empresa y tipo de tecnología.

### Tabla `ai_country_readiness`

- `iso3`
- `year`
- `readiness_index`
- `digital_infrastructure`
- `human_capital`
- `innovation`
- `regulation_ethics`
- `government_readiness`
- `source`

### Tabla `source_run_log`

- `source_id`
- `run_at`
- `status`
- `records_loaded`
- `latest_period`
- `checksum`
- `notes`

## Dashboard propuesto

### Vista 1: Radar país

Muestra un país seleccionado con tres dimensiones:

- Adopción educativa de IA.
- Adopción empresarial de IA.
- Preparación estructural y gobernanza.

Debe incluir comparación contra región, grupo de ingreso, OECD/EU cuando aplique y promedio global disponible.

### Vista 2: Mapa mundial

Mapa por país con selector de métrica:

- Uso docente de IA.
- Uso de IA generativa para educación formal.
- Empresas que usan IA.
- Preparación AIPI.
- Readiness gubernamental.

### Vista 3: Educación

Panel para observar:

- Uso de IA por docentes.
- Uso de IA por estudiantes o individuos en educación formal.
- Barreras docentes: falta de habilidades, políticas escolares, privacidad, sesgos, integridad académica.
- Gobernanza universitaria en América Latina y el Caribe.

### Vista 4: Empresa

Panel para observar:

- Porcentaje de empresas que usan IA.
- Evolución anual.
- Tamaño de empresa.
- Industria.
- Tipo de tecnología: minería de texto, generación de lenguaje, generación de imagen/audio/video, reconocimiento de voz, automatización de flujos, aprendizaje automático y robótica autónoma.

### Vista 5: Brechas y oportunidades

Cruces analíticos:

- Alta preparación, baja adopción educativa.
- Alta adopción empresarial, baja gobernanza.
- Alta adopción individual, baja política institucional.
- Brecha entre empresas grandes y pequeñas.
- Brecha entre uso pedagógico y uso administrativo.

## Arquitectura técnica recomendada

### Capa 1: Ingesta

- Conectores API para OECD SDMX, Eurostat, UNESCO DataHub y World Bank.
- Conectores de descarga controlada para TALIS, Stanford AI Index, Oxford Insights e IMF AIPI.
- Registro de ejecuciones con fecha, estado, número de registros y periodo más reciente.

### Capa 2: Normalización

- Homologación de países por ISO3.
- Conversión de unidades a porcentajes comparables.
- Separación entre indicadores de uso, preparación y gobernanza.
- Conservación del indicador original y la fuente exacta.

### Capa 3: Métricas

- Índice de adopción educativa.
- Índice de adopción empresarial.
- Índice de preparación país.
- Brecha de adopción educativa-empresarial.
- Brecha de preparación-adopción.
- Índice de gobernanza institucional.

### Capa 4: Tablero

- Dashboard interactivo con filtros por país, región, año, fuente, sector y grupo de ingreso.
- Gráficos de tendencia, mapa, ranking, radar país y matriz de brechas.
- Tabla de trazabilidad con fuente, fecha de actualización y nota metodológica.

### Capa 5: Monitoreo continuo

- Actualización mensual para APIs.
- Actualización trimestral para datasets descargables.
- Alertas cuando una fuente cambie de estructura, periodo o cobertura.
- Bitácora académica de cambios para uso en investigación doctoral.

## Primer producto mínimo viable

El MVP debe concentrarse en indicadores que ya tienen acceso gratuito y estructura programable:

- Empresas que usan IA por país: OECD SDMX y Eurostat.
- Individuos que usan IA generativa para educación formal: Eurostat y OECD SDMX.
- Contexto educativo: UNESCO DataHub y World Bank EdStats.
- Preparación país: IMF AIPI por descarga completa y Oxford Insights por descarga.
- Uso docente de IA: TALIS 2024 por descarga controlada.

## Decisión técnica inicial

El sistema debe construirse como un proyecto reproducible, no como una presentación aislada. La recomendación es iniciar con:

- `data_sources/`: conectores y metadatos.
- `data_raw/`: descargas originales versionadas fuera de entregables académicos.
- `data_processed/`: tablas normalizadas.
- `dashboard/`: interfaz interactiva.
- `docs/`: metodología, bitácora, diccionario de datos y evidencia de fuentes.

## Fuentes oficiales consultadas

- OECD TALIS 2024 Database: https://www.oecd.org/en/data/datasets/talis-2024-database.html
- OECD Teaching for Today’s World, TALIS 2024: https://www.oecd.org/en/publications/results-from-talis-2024_90df6235-en/full-report/teaching-for-today-s-world_eefb146b.html
- OECD Data API: https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html
- OECD ICT Access and Usage by Businesses: https://data-explorer.oecd.org/
- OECD ICT Access and Usage by Households and Individuals: https://data-explorer.oecd.org/
- Eurostat API: https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction
- Eurostat `isoc_eb_ai`: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251211-2
- Eurostat `isoc_ai_iaiu`: https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251216-3
- UNESCO DataHub UIS: https://data.unesco.org/explore/dataset/uis001/api/
- UNESCO UIS Bulk Download: https://databrowser.uis.unesco.org/resources/bulk
- UNESCO IESALC 2026: https://ess.iesalc.unesco.org/index.php/ess3/article/view/v37i2-dt-14
- World Bank Indicators API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
- World Bank EdStats: https://datatopics.worldbank.org/education/
- IMF AIPI: https://www.imf.org/external/datamapper/datasets/AIPI
- IMF DataMapper API: https://www.imf.org/external/datamapper/api/
- Oxford Insights Government AI Readiness Index: https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/
- Stanford AI Index 2026: https://hai.stanford.edu/ai-index/2026-ai-index-report
