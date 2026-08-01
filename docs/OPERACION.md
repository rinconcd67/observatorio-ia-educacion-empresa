# Operación y actualización

## Requisitos

- Node.js 20 o posterior.
- Acceso HTTPS a las APIs públicas de Eurostat y Banco Mundial.
- Para regenerar el HTML autocontenido, una instalación local del complemento Data Analytics de Codex.

## Comandos

```bash
npm test
npm run refresh
npm run validate
npm run serve
```

`npm run refresh` descarga las fuentes activas, conserva los archivos crudos fuera de Git, normaliza el snapshot, genera el artefacto y empaqueta el dashboard. La publicación se detiene si falla una fuente esencial o una validación estructural. Una fuente opcional indisponible se registra como error, deja sus campos vacíos y produce un aviso visible de cobertura.

## Frecuencia propuesta

- APIs activas: revisión mensual.
- Catálogos y variables de contexto: revisión trimestral.
- Fuentes descargables: revisión trimestral o después de una nueva edición oficial.

## Trazabilidad

Cada ejecución registra estado, hora de inicio, hora de cierre y SHA-256 del contenido descargado. Los archivos crudos no se versionan; el snapshot normalizado, el artefacto y el HTML sí pueden conservarse como evidencia de una edición.
