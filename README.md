# Observatorio de IA en Educación y Empresa

Sistema reproducible para monitorear adopción, brechas y condiciones de contexto de la inteligencia artificial por país. El proyecto mantiene separados los datos crudos, las tablas normalizadas, el contrato analítico y el dashboard entregable.

## Estado de la versión 0.1.0

- Dashboard autocontenido y de solo lectura.
- Siete conectores configurados; cuatro fuentes esenciales operativas en el primer snapshot.
- 217 países en el catálogo maestro.
- 201 observaciones directas de adopción de IA.
- Validaciones de rango, integridad ISO, cobertura, procedencia y estructura del dashboard.
- Fuentes opcionales indisponibles visibles en la interfaz; no se imputan valores.

## Inicio rápido

```bash
npm test
npm run refresh
npm run validate
npm run serve
```

El dashboard generado se encuentra en `dashboard/index.html`. Es autocontenido y puede abrirse directamente; `npm run serve` ofrece una vista local en `http://127.0.0.1:4173`.

## Estructura

```text
config/             Registro de conectores activos
data/raw/           Respuestas originales, excluidas de Git
data/processed/     Snapshot y tablas normalizadas
dashboard/          Artefacto canónico y HTML autocontenido
docs/               Metodología, diccionario y operación
src/                Ingesta, transformación, validación y servidor
test/               Pruebas unitarias
```

## Principio de confianza

El dashboard no reemplaza los datos ausentes por cero ni convierte indicadores generales de conectividad o economía en un supuesto índice de preparación para IA. Cada visual conserva fuente, filtros, fecha de ejecución y ruta reproducible.

La descripción académica ampliada y el inventario inicial se conservan en `README_PROYECTO.md` y `FUENTES_DATOS_IA.json`.
