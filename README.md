# Observatorio de IA en Educación y Empresa

Sistema reproducible para monitorear adopción, brechas y condiciones de contexto de la inteligencia artificial por país. El proyecto mantiene separados los datos crudos, las tablas normalizadas, el contrato analítico y el dashboard entregable.

## Estado de la versión 0.2.0

- Dashboard autocontenido y de solo lectura.
- Diez fuentes configuradas entre APIs públicas y descargas oficiales controladas; nueve operativas en el snapshot vigente.
- 218 países y economías en el catálogo maestro.
- 3.307 observaciones normalizadas.
- 40 países con medición directa de uso o adopción de IA y 165 con índice AIPI completo.
- Integración de OCDE para ampliar la adopción empresarial y el uso individual de IA generativa fuera de Eurostat.
- Integración del IMF AI Preparedness Index 2023 y sus cuatro contribuciones estructurales.
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
