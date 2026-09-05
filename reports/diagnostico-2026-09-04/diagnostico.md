# Diagnóstico del Observatorio de IA — 4 de septiembre de 2026

La web pública consultada en Chrome conserva v0.4.0 y fecha 1-agosto-2026. Se ejecutó la actualización en copia aislada; no se publicó ni se alteró el candidato preexistente.

| Métrica | Base publicada | Prueba de hoy |
|---|---:|---:|
| Países del catálogo | 218 | 218 |
| Observaciones | 5.280 | 5.164 |
| Fuentes saludables en su ejecución | 11/11 | 9/11 |
| Países con medición directa | 40 | 36 |

## Evidencia y decisión

Ambas consultas OCDE devolvieron HTTP 500 hoy. El candidato pierde 116 observaciones y cuatro países con medición directa. Su publicación está bloqueada por el control de aceptación. Pasan 39/39 pruebas, validación de estructura y 6/6 pruebas de integridad: esos resultados no equivalen a una actualización publicable.

Oxford: los 1.358 registros normalizados descargados hoy son idénticos a los de HEAD local, coherente con la base pública. La huella del HTML cambió; la alerta no demuestra una variación estadística. Se necesitan huellas separadas de archivo y contenido normalizado.

Las fuentes dinámicas exitosas llegan a 2025; AIPI mantiene edición 2023 y Oxford edición 2025. Consultar hoy no convierte sus indicadores en datos de 2026.

## Prioridades propuestas

1. Recuperar las consultas OCDE y definir conservación explícita del último dato válido con fecha y estado degradado cuando una fuente falla.
2. Hacer obligatorio el informe comparativo antes del despliegue. El comando npm report:update compara actualmente un snapshot consigo mismo; exigir base y candidato distintos.
3. Separar hash del HTML y hash estadístico Oxford; revisar diferencias por país e indicador.
4. Rechazar nulos y cadenas vacías antes de Number() en normalizadores. Es una vulnerabilidad del código, no corrupción demostrada del conjunto actual.
5. Mostrar fecha de revisión, año observado y cobertura junto a cada indicador. Educación formal cubre 35 países, 34 de Europa y Asia Central; el catálogo de 218 no equivale a medición global de uso.
6. Añadir síntesis editorial con tres hallazgos, cambios de la última actualización y límites. Conservar la presentación visual sobria existente.
7. Reforzar América Latina mediante fuentes y fichas comparables; añadir evidencia docente, institucional y resultados educativos cuando existan, sin equiparar uso con aprendizaje.

## Fuente externa verificada

UNESCO mantiene un Observatorio de IA en Educación para América Latina y el Caribe que reúne 33 ministerios. Conviene incorporarlo como referencia regional y canal de evidencia, sin asumir que ofrece una serie estadística directamente compatible.
https://www.unesco.org/en/articles/observatory-artificial-intelligence-education-latin-america-and-caribbean

## Alcance

Se revisaron en Chrome Global, Fuentes, Educación y Empresa, presentación visual Global, archivos locales, ingesta oficial y controles. No constituye auditoría exhaustiva de todas las vistas, accesibilidad o dispositivos.

<memory project="ObservatorioIAEducacionEmpresa">
- Estado actual: diagnóstico vigente al 2026-09-04; web v0.4.0; candidato probado en copia aislada y bloqueado.
- Decisiones clave: mantener publicación hasta recuperar cobertura; diferenciar revisión y año estadístico.
- Versiones anteriores: v0.4.0 pública; v0.5.0 local preexistente.
- Contextos relevantes: OCDE HTTP 500 confirmado hoy; Oxford normalizado idéntico; 39/39 pruebas y 6/6 integridad.
- Próximos hitos: corregir conectores, hacer efectivo el control de despliegue y preparar candidato revisable.
</memory>
