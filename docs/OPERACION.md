# Operación y actualización

## Requisitos

- Node.js 20 o posterior.
- Acceso HTTPS a las APIs públicas de Eurostat, OCDE y Banco Mundial, a la descarga oficial AIPI del FMI y a la página oficial de Oxford Insights.
- La geometría mundial versionada en `data/reference/world.geo.json`.

## Comandos

```bash
npm test
npm run import:aipi
npm run import:oxford
npm run refresh
npm run check
npm run serve
```

`npm run refresh` descarga las fuentes activas, conserva los archivos crudos fuera de Git, normaliza el snapshot, genera el contrato analítico y empaqueta el dashboard v0.4.0. La publicación se detiene si falla una fuente esencial o una validación estructural. Una fuente opcional indisponible se registra como error y deja sus campos vacíos.

La actualización completa importa AIPI desde el libro oficial y Oxford 2025 desde el bloque JSON publicado en su página oficial. Eurostat conserva precedencia sobre OCDE cuando ambas fuentes presentan el indicador empresarial para el mismo país y año. Ambas importaciones controladas conservan su huella SHA-256 y registran cualquier país no conciliado.

## Frecuencia propuesta

- APIs activas: revisión mensual.
- Catálogos y variables de contexto: revisión trimestral.
- Fuentes descargables: revisión trimestral o después de una nueva edición oficial.

## Trazabilidad

Cada ejecución registra estado, hora de inicio, hora de cierre y SHA-256 del contenido descargado. Los archivos crudos no se versionan; el snapshot normalizado, el artefacto y el HTML sí pueden conservarse como evidencia de una edición.

El empaquetador incrusta datos, GeoJSON, CSS y JavaScript en `dashboard/index.html` y genera `_site/` para la publicación. La validación confirma ocho vistas, mapa mundial, contrato analítico, descargas, autoría, imagen social y ausencia de dependencias remotas en tiempo de lectura.

## Automatización pública

- `ci.yml` reconstruye y valida cada cambio, audita dependencias y revisa el formato del diff.
- `deploy-pages.yml` publica `_site/` únicamente desde `main` después de superar la construcción y las validaciones.
- `refresh-data.yml` se ejecuta el primer día de cada mes, refresca todas las fuentes y abre un pull request si existen cambios. Si la política del repositorio impide esa creación automática, conserva la rama auditada y publica en el resumen un vínculo para abrir la revisión manualmente.
- `create-update-report.mjs` compara el candidato con la línea base y bloquea caídas críticas de cobertura.

La actualización mensual nunca escribe directamente sobre `main`. El informe generado debe revisarse antes de integrar el pull request y activar el despliegue público.
