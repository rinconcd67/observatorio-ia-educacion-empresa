# Informe de actualización del observatorio

**Decisión automática:** BLOQUEADA

La automatización valida integridad y cobertura, pero no autoriza por sí sola la publicación. Los cambios deben revisarse e integrarse mediante pull request.

## Comparación

| Indicador | Línea base | Candidato | Variación |
|---|---:|---:|---:|
| Países y economías | 218 | 218 | 0 |
| Observaciones | 5280 | 5164 | -116 |
| Fuentes activas | 11 | 11 | 0 |
| Fuentes saludables | 11 | 9 | -2 |
| Medición directa de IA | 40 | 36 | -4 |
| AIPI | 165 | 165 | 0 |
| Oxford | 194 | 194 | 0 |

## Controles de aceptación

| Resultado | Control | Valor observado |
|---|---|---:|
| APROBADO | Estado del snapshot | ready |
| APROBADO | Cobertura de países | 218 |
| APROBADO | Retención mínima de observaciones | 5164 |
| BLOQUEADO | Fuentes activas saludables | 9/11 |
| APROBADO | Países con medición directa de IA | 36 |
| APROBADO | Cobertura AIPI | 165 |
| APROBADO | Cobertura Oxford | 194 |
| APROBADO | Sin regresión del año máximo por fuente | 0 regresiones |
| BLOQUEADO | Ediciones fijadas sin cambios silenciosos | oxford_government_ai_readiness_2025 |
| APROBADO | Huellas SHA-256 de archivos exactos | 9/9 |

## Estado de las fuentes

| Fuente | Ventana solicitada | Máx. anterior | Máx. candidato | Registros | Estado | Decisión |
|---|---|---:|---:|---:|---|---|
| eurostat_enterprise_ai | abierto–abierto | 2025 | 2025 | 131 | ok | APROBADO |
| eurostat_formal_education_ai | 2025–abierto | 2025 | 2025 | 35 | ok | APROBADO |
| eurostat_student_ai | 2025–abierto | 2025 | 2025 | 35 | ok | APROBADO |
| oecd_ict_businesses | 2023–abierto | 2025 | - | - | error | BLOQUEADO |
| oecd_individual_genai | 2025–abierto | 2025 | - | - | error | BLOQUEADO |
| world_bank_countries | abierto–abierto | - | - | - | ok | APROBADO |
| world_bank_internet | 2020–2026 | 2025 | 2025 | 919 | ok | APROBADO |
| world_bank_tertiary | 2020–2026 | 2025 | 2025 | 615 | ok | APROBADO |
| world_bank_gdp_per_capita | 2020–2026 | 2025 | 2025 | 1219 | ok | APROBADO |
| imf_aipi | edición 2023 | 2023 | 2023 | 852 | ok | APROBADO |
| oxford_government_ai_readiness_2025 | edición 2025 | 2025 | 2025 | 1358 | ok | BLOQUEADO |

## Trazabilidad

- Línea base: 2026-08-01T16:23:03.407Z
- Candidato: 2026-09-04T23:47:29.622Z
- Autor responsable: César David Rincón Godoy
- ORCID: https://orcid.org/0009-0003-2112-3851
