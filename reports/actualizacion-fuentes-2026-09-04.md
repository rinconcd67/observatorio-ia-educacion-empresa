# Actualización de fuentes — 4 de septiembre de 2026

Resultado: candidato local v0.5.0 aprobado para revisión humana; no publicado.

## Investigación y evidencia

La documentación oficial OCDE mantiene la API SDMX y el parámetro format=csvfilewithlabels. No se encontró evidencia que exigiera migrar los endpoints configurados. Se verificaron las dos URL con Python, Node y el conector exacto, obteniendo HTTP 200; la actualización completa posterior también obtuvo 200 al primer intento. Los errores HTTP 500 anteriores son compatibles con indisponibilidad transitoria, sin causa interna confirmada.

- Documentación API: https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html
- Recomendaciones operativas: https://www.oecd.org/en/data/insights/data-explainers/2024/11/Api-best-practices-and-recommendations.html
- Oxford oficial: https://oxfordinsights.com/ai-readiness/government-ai-readiness-index-2025/

OCDE empresas: DSD_ICT_B@DF_BUSINESSES 1.0, 88 registros, 2023–2025. OCDE uso individual: DSD_ICT_HH_IND@DF_IND 1.1, 28 registros, 2025. Respuesta SDMX-CSV versión 2 compatible con el lector por nombres de columnas. Se conservan filtros y precedencia Eurostat.

Oxford: HTML distinto, 1.358 observaciones normalizadas idénticas. Se conserva SHA-256 byte-exacto y se añade huella del contenido estadístico ordenado. La comparación se recalcula desde ambos snapshots, incluido el legado; cambios reales, vacíos y duplicados bloquean.

## Resultado de la actualización

- Fecha de consulta: 2026-09-04T23:58:34.204Z.
- 11/11 fuentes operativas; 5.280 observaciones; 218 países/economías; 40 países con medición directa.
- Frente a la base publicada: 0 registros añadidos, 0 eliminados y 0 valores cambiados.
- AIPI 2023, Oxford 2025; máximo 2025 en fuentes dinámicas consultadas. La revisión actual no implica observaciones de 2026.

## Correcciones

Reintentos limitados para 408/429/500/502/503/504, espera exponencial y respeto de Retry-After; errores permanentes no se reintentan. Se registran estado HTTP e intentos. Una ejecución con fuentes fallidas queda degraded. CSV vacío/incompatible falla explícitamente; blancos no se convierten en cero.

El informe exige base/candidato distintos y la publicación ejecuta el control comparativo contra data/baselines/published-snapshot.json, extraído de HEAD de la v0.4.0 publicada. El workflow mensual también utiliza esa base y contempla el dashboard inglés. La base deberá avanzar únicamente después de verificar una publicación aprobada.

## Verificación

50/50 pruebas aprobadas, incluidas integridad de los 11 archivos raw, reintentos, valores ausentes, huella semántica y fuentes ausentes. Validación estructural y gate de publicación aprobados. Verificación visual/funcional local de Global y Fuentes ES/EN; fechas, cobertura, 11 conectores y periodos correctos. No se efectuó auditoría exhaustiva móvil/accesibilidad.

Vista previa: http://127.0.0.1:4173/?view=sources (requiere servidor local activo).

Ver informe reproducible en publication-candidate.md y trazabilidad completa en data/processed/source_runs.json. No se ejecutó stage, commit, push ni publicación.
