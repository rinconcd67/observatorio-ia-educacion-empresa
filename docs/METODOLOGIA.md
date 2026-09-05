# Metodología del Observatorio

## Unidad de análisis

La unidad principal es el país-año-indicador. Cada observación conserva el código ISO3, el nombre del indicador, el valor, la unidad, el periodo y la fuente original.

## Dimensiones analíticas

- **Adopción empresarial:** porcentaje de empresas con diez o más personas empleadas que usan al menos una tecnología de inteligencia artificial.
- **Uso educativo:** porcentaje de individuos que usa herramientas de IA generativa para educación formal y porcentaje de estudiantes que declara uso de IA generativa.
- **Uso individual:** porcentaje de personas de 16 a 74 años que usa herramientas de IA generativa.
- **Preparación nacional:** IMF AI Preparedness Index (AIPI) y Oxford Government AI Readiness Index 2025. Se conservan por separado porque sus periodos, escalas y metodologías no son equivalentes.
- **Contexto país:** uso de Internet, matrícula terciaria y PIB per cápita. Estas variables describen condiciones estructurales; no conforman un índice oficial de preparación para IA.

## Reglas de comparación

- Los promedios entre países son aritméticos y no ponderados.
- La brecha empresa-educación se expresa en puntos porcentuales y solo se calcula con observaciones del mismo país y el mismo año. Si existen varios años comunes, se utiliza el más reciente; los últimos valores individuales se conservan por separado.
- La ausencia de datos no se imputa ni se convierte en cero.
- La última observación disponible se selecciona por país e indicador; el año permanece visible en la tabla normalizada.
- Cuando ambos indicadores existen pero no comparten ningún año, la brecha permanece nula y se declara `no_common_year`; no se aplica tolerancia temporal ni imputación.
- Cuando Eurostat y OCDE informan el mismo indicador empresarial para un país y año, se usa Eurostat. La OCDE amplía la cobertura fuera de ese solapamiento.
- Las métricas de Eurostat y OCDE se interpretan según su población de referencia y no se extrapolan automáticamente al resto del mundo.
- AIPI se expresa en escala de 0 a 1. Sus cuatro componentes en el archivo oficial son contribuciones ponderadas de 0 a 0,25 que suman el índice cuando todos están disponibles.
- AIPI es indicativo: se utiliza para orientar comparaciones descriptivas y no como clasificación competitiva ni evidencia causal.
- Oxford 2025 se expresa en escala de 0 a 100 e incluye capacidad de política pública, infraestructura de IA, gobernanza, adopción en el sector público, desarrollo y difusión, y resiliencia.
- AIPI y Oxford no se promedian entre sí ni se transforman en un índice compuesto. Su cruce por país es exclusivamente descriptivo.
- Las regiones se normalizan a siete agrupaciones del catálogo del Banco Mundial y se presentan en español.
- Toda visual regional muestra el número de países con observación; el promedio regional no implica cobertura completa.
- El mapa conserva en gris los países sin dato para que la ausencia no se confunda con un valor bajo.

## Ventanas temporales y ediciones

- Las APIs dinámicas declaran una política temporal explícita. Eurostat educativo consulta desde 2025 sin año final; OCDE conserva un inicio abierto; Banco Mundial resuelve el final con el año UTC de ejecución.
- AIPI 2023 y Oxford 2025 son ediciones fijadas. Una modificación de su SHA-256 sin cambio de edición bloquea la actualización para revisión humana.
- Cada ejecución conserva la ventana solicitada y los años mínimo y máximo efectivamente recibidos. Un retroceso del año máximo bloquea el candidato.

## Cobertura y límites

La adopción directa de IA continúa concentrada en países cubiertos por Eurostat y OCDE. AIPI y Oxford amplían la lectura estructural, pero no sustituyen mediciones directas de uso. El contexto del Banco Mundial es global y puede presentar periodos distintos por indicador. La fuente Oxford contiene 195 gobiernos; 194 se conciliaron con el catálogo maestro y Taiwán permanece registrado como no conciliado. TALIS 2024 se incorporó como capa documental complementaria para cuatro países latinoamericanos, junto a indicadores institucionales de TIC Educação 2025. Sus poblaciones y periodos se mantienen separados de las métricas globales. UNESCO IESALC y Stanford AI Index permanecen en el registro de expansión. La biblioteca ofrece reseñas bilingües de publicaciones oficiales; sus fichas declaran el alcance de lectura y no se contabilizan como observaciones estadísticas.
