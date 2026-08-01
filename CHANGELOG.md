# Historial de cambios

## 0.4.0 - 2026-08-01

- Se incorporó una versión inglesa completa en `/en/`, equivalente a la ruta española y alimentada por el mismo contrato analítico.
- Se localizaron navegación, mapas, tooltips, tablas, gráficos, nombres geográficos, fechas y formatos numéricos.
- Se añadió un selector ES/EN que conserva la vista, el país y el indicador activos.
- Se publicaron metadatos `hreflang`, URL canónicas, datos estructurados, manifiestos e imágenes sociales por idioma.
- Se incorporaron versiones inglesas de autoría, privacidad y política de datos.
- Se ampliaron el empaquetado y las validaciones para comprobar paridad funcional, cobertura y checksums entre ambas rutas.

## 0.3.1 - 2026-08-01

- Se incorporaron autoría verificable, ORCID, ficha técnica, cita recomendada y declaración de asistencia técnica.
- Se añadieron licencias diferenciadas para código y contenido, aviso legal, privacidad, seguridad y política de datos.
- Se creó la vista Acerca y se ampliaron las rutas compartibles por vista, país e indicador.
- Se empaquetó un sitio público para GitHub Pages con CSV, JSON, estado, metadatos estructurados e imagen social.
- Se sustituyó una dependencia local del importador AIPI por una dependencia pública fijada y auditable.
- Se creó CI de integridad, despliegue a Pages y actualización mensual mediante pull request gobernado.
- Se añadieron controles de regresión de cobertura e informe comparativo automático.

## 0.3.0 - 2026-08-01

- Se reconstruyó la capa visual como una aplicación local propia y autocontenida.
- Se añadió un mapa mundial interactivo con siete indicadores seleccionables.
- Se incorporaron siete vistas temáticas y filtros por región y país.
- Se añadieron promedios globales, cuartiles AIPI y comparadores país-región-mundo.
- Se integró Oxford Government AI Readiness 2025 para 194 países conciliados, con índice total, seis pilares y comparación independiente frente a AIPI.
- Se amplió el selector cartográfico con preparación gubernamental y la vista Gobernanza con cruce entre ambos índices globales.
- Se tradujeron regiones, grupos de ingreso y nombres de países al español cuando existe código ISO2.
- Se reemplazó la tendencia empresarial de cuatro periodos por barras discretas más honestas.
- Se incorporaron validaciones de mapa, navegación, autocontención y ausencia de dependencias remotas.

## 0.2.0 - 2026-08-01

- Se amplió la cobertura empresarial e individual mediante dos consultas filtradas de la API SDMX de la OCDE.
- Se incorporó el IMF AI Preparedness Index 2023 mediante descarga oficial controlada.
- Se estableció precedencia de Eurostat sobre OCDE en coincidencias del mismo país y año.
- Se añadieron visualizaciones de uso individual y preparación frente a adopción, sin convertir AIPI en ranking.
- Se ampliaron las validaciones de rango, cobertura y parsing CSV.

## 0.1.0 - 2026-08-01

- Se estableció un workroot y repositorio independiente.
- Se incorporaron siete conectores públicos sin llave.
- Se implementó normalización por ISO3, trazabilidad por fuente y controles de calidad.
- Se definió un dashboard con métricas de cobertura, tendencias, rankings, brechas, radar país y salud de fuentes.
