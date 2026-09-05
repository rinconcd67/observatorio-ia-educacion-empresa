# Contexto educativo e inversión pública: integración API

## Alcance

CIMA / BID: puntajes promedio PISA de matemáticas, lectura y ciencias. Selección de totales nacionales, fuente PISA, sin mezclar PISA-D, ERCE o desagregaciones. 171 observaciones de 15 países en 2006–2022 (cobertura variable por ciclo). Los agregados LAC y OECD no se presentan como países ni se recalculan. Fuente y licencia: https://data.iadb.org/es/dataset/cima-indicators ; DOI https://doi.org/10.60966/x0se6zl1 ; CC BY 4.0.

Inversión educativa: gasto público total en educación, como porcentaje del PIB y del gasto público total. Fuente original UNESCO UIS, distribución mediante API Banco Mundial WDI. Ventana inicial 2000–2025 para los 26 países listados por CIMA. 930 valores disponibles y 422 valores nulos; estos se conservan como ausencias. No son inversión exclusiva en IA ni una separación entre gasto corriente y capital. No se atribuyen estas series a la API CIMA.

Metodología y fuente de gasto: https://data.worldbank.org/indicator/SE.XPD.TOTL.GD.ZS y https://data.worldbank.org/indicator/SE.XPD.TOTL.GB.ZS . Ambas páginas identifican UNESCO UIS como origen y CC BY 4.0 como licencia. Puntajes PISA: https://cima.iadb.org/home/learning . Las series no identifican impactos causales de IA.

## Operación

- `npm run import:cima`: consulta CKAN por páginas de 50 registros, con orden por `_id`; valida filtros, totales, duplicados y cobertura. Conserva respuestas exactas y hashes en `data/processed/cima-context.json`.
- `npm run import:education-finance`: consulta dos series mediante API World Bank v2 para 2000:2025; conserva nulos, respuestas y hashes en `data/processed/education-finance.json`. Ampliar deliberadamente la ventana al revisar nuevas ediciones; el final de la ventana no significa que todos los países tengan datos en ese año.
- `npm run build && npm run check && npm run check:publication`: construye la instantánea pública y verifica su integridad. Las importaciones son pasos explícitos, no se repiten durante cada build.

Los importadores escriben el archivo al terminar y validarlo, por sustitución atómica. Un error de acceso, formato o regresión de cobertura detiene el proceso y conserva el archivo anterior. Cambios de valores con cobertura conservada quedan visibles en el diff para revisión; no implican publicación automática. La consulta de descubrimiento de indicadores CIMA devolvió posteriormente HTTP202 con HTML, por lo que no se usa como evidencia de ausencia de series de gasto. La consulta filtrada de los tres indicadores sí produjo seis páginas JSON válidas.

La web ofrece filtros, fechas estadísticas, fecha de extracción, unidades, enlaces oficiales y descarga JSON con trazabilidad. La vista educativa y la portada enlazan al contexto CIMA. Los datos se mantienen fuera de las 5.280 observaciones de adopción y preparación originales y no intervienen en la brecha empresa–educación.
