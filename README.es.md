# Observatorio Global de IA en Educación y Empresa

**Español** | [English](README.md)

Sistema reproducible para monitorear adopción, brechas y condiciones de contexto de la inteligencia artificial por país. El proyecto mantiene separados los datos crudos, las tablas normalizadas, el contrato analítico y el dashboard entregable.

## Estado de la versión 0.4.0

- Dashboard autocontenido y de solo lectura con identidad visual propia.
- Mapa mundial interactivo y siete regiones normalizadas en español.
- Ocho vistas: Global, Regiones, Países, Educación, Empresa, Gobernanza, Fuentes y Acerca.
- Comparadores país-región-mundo y cobertura explícita por indicador.
- Once fuentes operativas entre APIs públicas y descargas oficiales controladas.
- 218 países y economías en el catálogo maestro.
- 5.280 observaciones normalizadas.
- 40 países con medición directa de uso o adopción de IA, 165 con índice AIPI completo y 194 con Oxford Government AI Readiness 2025.
- Integración de OCDE para ampliar la adopción empresarial y el uso individual de IA generativa fuera de Eurostat.
- Integración del IMF AI Preparedness Index 2023 y sus cuatro contribuciones estructurales.
- Integración del Oxford Government AI Readiness Index 2025 y sus seis pilares en escala de 0 a 100.
- Validaciones de rango, integridad ISO, cobertura, procedencia y estructura del dashboard.
- Fuentes opcionales indisponibles visibles en la interfaz; no se imputan valores.
- Autoría, ORCID, cita recomendada, política de datos, privacidad y declaración de asistencia técnica visibles.
- Sitio público empaquetado para GitHub Pages con metadatos SEO, vista social y descargas CSV/JSON.
- Dos rutas públicas equivalentes: español en `/` e inglés en `/en/`, alimentadas por un único contrato analítico.
- Interfaz, mapas, gráficos, tablas, tooltips, fechas y formatos numéricos localizados en ambos idiomas.
- Metadatos internacionales `hreflang`, manifiestos bilingües y vistas sociales por idioma.
- Actualización mensual gobernada mediante informe comparativo y pull request; la automatización no publica datos nuevos sin revisión humana.

## Inicio rápido

```bash
npm test
npm run refresh
npm run check
npm run serve
```

Los dashboards canónicos se encuentran en `dashboard/index.html` y `dashboard/en/index.html`. `npm run build` genera además `_site/`, el paquete que GitHub Pages publica. Ambos incorporan los mismos datos, estilos, lógica y geometría mundial; `npm run serve` ofrece la vista pública local en `http://127.0.0.1:4173`.

URLs públicas:

- Español: `https://rinconcd67.github.io/observatorio-ia-educacion-empresa/`.
- Inglés: `https://rinconcd67.github.io/observatorio-ia-educacion-empresa/en/`.

## Estructura

```text
config/             Registro de conectores activos
data/raw/           Respuestas originales, excluidas de Git
data/processed/     Snapshot y tablas normalizadas
dashboard/          Artefacto canónico y HTML autocontenido
_site/              Paquete público generado, excluido de Git
data/reference/     Geometrías y referencias públicas versionadas
docs/               Metodología, diccionario y operación
reports/            Informes comparativos de actualización
src/                Ingesta, transformación, validación y servidor
test/               Pruebas unitarias
```

## Principio de confianza

El dashboard no reemplaza los datos ausentes por cero ni convierte indicadores generales de conectividad o economía en un supuesto índice de preparación para IA. Cada visual conserva fuente, filtros, fecha de ejecución y ruta reproducible.

La descripción académica ampliada y el inventario inicial se conservan en `README_PROYECTO.md` y `FUENTES_DATOS_IA.json`.

La geometría cartográfica procede de `johan/world.geo.json`, publicada en dominio público mediante UNLICENSE. Los límites se utilizan exclusivamente para visualización analítica y no expresan posición institucional sobre fronteras o territorios.

## Autoría

Dirección intelectual, metodología y aprobación: César David Rincón Godoy ([ORCID 0009-0003-2112-3851](https://orcid.org/0009-0003-2112-3851)). OpenAI Codex presta asistencia técnica en arquitectura, ingeniería de datos, programación, documentación y pruebas, sin figurar como autor académico.
