# Metodología del Observatorio

## Unidad de análisis

La unidad principal es el país-año-indicador. Cada observación conserva el código ISO3, el nombre del indicador, el valor, la unidad, el periodo y la fuente original.

## Dimensiones analíticas

- **Adopción empresarial:** porcentaje de empresas con diez o más personas empleadas que usan al menos una tecnología de inteligencia artificial.
- **Uso educativo:** porcentaje de individuos que usa herramientas de IA generativa para educación formal y porcentaje de estudiantes que declara uso de IA generativa.
- **Uso individual:** porcentaje de personas de 16 a 74 años que usa herramientas de IA generativa.
- **Preparación nacional:** IMF AI Preparedness Index (AIPI) y contribuciones de infraestructura digital, innovación e integración económica, capital humano y políticas laborales, regulación y ética.
- **Contexto país:** uso de Internet, matrícula terciaria y PIB per cápita. Estas variables describen condiciones estructurales; no conforman un índice oficial de preparación para IA.

## Reglas de comparación

- Los promedios entre países son aritméticos y no ponderados.
- La brecha empresa-educación se expresa en puntos porcentuales y solo se calcula cuando ambas mediciones existen para el mismo país.
- La ausencia de datos no se imputa ni se convierte en cero.
- La última observación disponible se selecciona por país e indicador; el año permanece visible en la tabla normalizada.
- Cuando Eurostat y OCDE informan el mismo indicador empresarial para un país y año, se usa Eurostat. La OCDE amplía la cobertura fuera de ese solapamiento.
- Las métricas de Eurostat y OCDE se interpretan según su población de referencia y no se extrapolan automáticamente al resto del mundo.
- AIPI se expresa en escala de 0 a 1. Sus cuatro componentes en el archivo oficial son contribuciones ponderadas de 0 a 0,25 que suman el índice cuando todos están disponibles.
- AIPI es indicativo: se utiliza para orientar comparaciones descriptivas y no como clasificación competitiva ni evidencia causal.

## Cobertura y límites

La adopción directa de IA continúa concentrada en países cubiertos por Eurostat y OCDE. AIPI amplía la lectura estructural, pero no sustituye mediciones directas de uso. El contexto del Banco Mundial es global y puede presentar periodos distintos por indicador. Las fuentes TALIS, UNESCO IESALC, Oxford Insights y Stanford AI Index permanecen en el registro de expansión hasta contar con rutas reproducibles y revisión metodológica de sus variables.
