# Publicación verificada de CEPAL, ILIA y Skills

Fecha de comprobación pública: 20/10/2026, 21:31 America/New_York.

- Implementación: `f7b14360c28e9cc08861b4424d4ec902b3e99269`.
- [PR #69](https://github.com/rinconcd67/observatorio-ia-educacion-empresa/pull/69) fusionado por vía normal, sin bypass, en `cfc8490ca813f252fed2b3b6063c6ff9ad6ab45b`.
- [Validación del PR](https://github.com/rinconcd67/observatorio-ia-educacion-empresa/actions/runs/39527571235): success y check asociado al head de implementación.
- [Integridad de main](https://github.com/rinconcd67/observatorio-ia-educacion-empresa/actions/runs/39527704176): success.
- [Despliegue GitHub Pages](https://github.com/rinconcd67/observatorio-ia-educacion-empresa/actions/runs/39527704163): success para el merge indicado.

## Comprobación del sitio público

[Observatorio — datos CEPAL](https://rinconcd67.github.io/observatorio-ia-educacion-empresa/?view=education#cepal-context), [biblioteca](https://rinconcd67.github.io/observatorio-ia-educacion-empresa/biblioteca/), [Skills](https://rinconcd67.github.io/observatorio-ia-educacion-empresa/skills/).

Se comprobaron las 106 páginas del sitemap, todas HTTP 200 y con HTML idéntico byte a byte al build validado. También coinciden las ocho descargas/controles comprobados: los tres catálogos JSON, artefacto global, CSV global y los tres controles de sitemap. El inventario tiene 38 páginas Skills. Los controles no se reenviaron a Search Console.

La publicación contiene tres series CEPALSTAT con 3.105 registros, incluidos 220 agregados diferenciados de países/territorios; 3.103 valores y dos ausencias. En navegador público se confirmó que Nicaragua/secundaria básica/2022 y Venezuela/primaria/2022 muestran ausencia, no cero, conforme a nota 12256. No se observaron errores de consola en esa comprobación.

La biblioteca tiene 28 documentos con las dos fichas ILIA añadidas. Skills tiene 14 fichas: se añadieron tres cursos de IA en español y Python como complemento técnico, conservando las cuatro rutas. Los catálogos y todas sus fichas ES/EN coinciden con el candidato revisado. Los indicadores globales anteriores permanecen idénticos.

## Validación y custodia

Antes de publicar: build y gate de publicación correctos; 99 pruebas locales aprobadas, cero fallos y cero omitidas; auditoría de dependencias con cero vulnerabilidades; diff revisado y stage selectivo de 24 archivos. CI en GitHub confirmó sus pasos de validación y publicación. La validación local usó los raw públicos previos verificados por SHA-256; éstos siguen ignorados y no se publican en Git.

El checkout original conserva los mismos 175 archivos, estado Git y HEAD. Las capturas, referencias privadas y comprobaciones detalladas se conservan fuera del repositorio público. Este registro sólo contiene datos y enlaces públicos de la publicación.

Este documento cierra la evidencia de la publicación funcional del PR #69. Su incorporación documental posterior no cambia el sitio generado. Los hashes de recursos públicos se conservan en `publication.json`. Publicación HTTP no acredita indexación por Google; no se solicitó indexación ni se cambió ninguna propiedad en esta ejecución.
