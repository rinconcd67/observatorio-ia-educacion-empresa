# Diccionario de datos

## Observaciones normalizadas

| Campo | Definición |
|---|---|
| `iso3` | Código de país ISO 3166-1 alfa-3. |
| `country` | Nombre del país según el catálogo del Banco Mundial. |
| `region` | Región del Banco Mundial. |
| `income_group` | Grupo de ingreso del Banco Mundial. |
| `year` | Año de la observación. |
| `sector` | Educación, empresa o contexto. |
| `metric_id` | Identificador estable del indicador normalizado. |
| `metric_name` | Nombre legible del indicador. |
| `value` | Valor numérico sin imputación. |
| `unit` | Porcentaje o dólares estadounidenses corrientes. |
| `source_id` | Identificador estable de la fuente. |
| `source_dataset` | Tabla o código del conjunto de datos original. |

## Indicadores activos

| `metric_id` | Unidad | Fuente |
|---|---|---|
| `enterprise_ai_adoption` | Porcentaje de empresas | Eurostat `isoc_eb_ai` |
| `formal_education_genai_use` | Porcentaje de individuos | Eurostat `isoc_ai_iaiu` |
| `student_genai_use` | Porcentaje de estudiantes | Eurostat `isoc_ai_iaiu` |
| `internet_users` | Porcentaje de individuos | Banco Mundial `IT.NET.USER.ZS` |
| `tertiary_enrollment` | Porcentaje bruto | Banco Mundial `SE.TER.ENRR` |
| `gdp_per_capita` | USD corrientes | Banco Mundial `NY.GDP.PCAP.CD` |
