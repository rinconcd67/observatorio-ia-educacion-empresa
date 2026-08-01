# Metodología del Observatorio

## Unidad de análisis

La unidad principal es el país-año-indicador. Cada observación conserva el código ISO3, el nombre del indicador, el valor, la unidad, el periodo y la fuente original.

## Dimensiones analíticas

- **Adopción empresarial:** porcentaje de empresas con diez o más personas empleadas que usan al menos una tecnología de inteligencia artificial.
- **Uso educativo:** porcentaje de individuos que usa herramientas de IA generativa para educación formal y porcentaje de estudiantes que declara uso de IA generativa.
- **Contexto país:** uso de Internet, matrícula terciaria y PIB per cápita. Estas variables describen condiciones estructurales; no conforman un índice oficial de preparación para IA.

## Reglas de comparación

- Los promedios entre países son aritméticos y no ponderados.
- La brecha empresa-educación se expresa en puntos porcentuales y solo se calcula cuando ambas mediciones existen para el mismo país.
- La ausencia de datos no se imputa ni se convierte en cero.
- La última observación disponible se selecciona por país e indicador; el año permanece visible en la tabla normalizada.
- Las métricas de Eurostat se interpretan según su población de referencia y no se extrapolan automáticamente al resto del mundo.

## Límites de la primera versión

La adopción directa de IA se concentra en países cubiertos por Eurostat. El contexto del Banco Mundial es global, pero no sustituye mediciones directas de uso de IA. Las fuentes TALIS, UNESCO IESALC, IMF AIPI, Oxford Insights y Stanford AI Index permanecen en el registro de expansión hasta contar con una ruta de descarga reproducible y una revisión metodológica de sus variables.
