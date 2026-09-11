# Candidato de actualización del Observatorio — 2026-09-11

## Resultado

Candidato local preparado en rama `update/observatorio-2026-09-11` desde `origin/main` limpio.

## Cambios incluidos

1. Ventana de noticias actualizada con el contenido del PR automático #30.
2. Biblioteca ampliada de 15 a 19 fichas bilingües ES/EN.
3. Sitemap editorial ampliado de 42 a 50 URLs.
4. Corrección de CI para PRs automáticos: los flujos `refresh-news` y `refresh-data` disparan la validación obligatoria por `workflow_dispatch` sobre la rama de revisión y crean el check requerido `validate` sobre el SHA del PR, sin usar `pull_request_target` ni saltar la protección de rama.

## Nuevas fichas de biblioteca

- UNESCO — `The algorithm in the room: Seeing and confronting the implications of AI for the future of education` (2026).
- UNESCO — `Ministerial Statement: Sustaining education as a common good in the age of AI` (2026).
- OECD — `Skills in the AI age` (2026), DOI `10.1787/972bd15e-en`.
- OECD — `PISA findings on artificial intelligence use, reading skills and learning` (2026).

Todas las fichas nuevas declaran `review_scope: official_summary`; no se atribuye lectura completa.

## Titulares incorporados desde PR #30

- OpenAI — `How a researcher uses Codex and ChatGPT to search for new antimicrobial molecules`, 2026-09-10 16:00 UTC.
- Google AI — `3 ways to prep for your next big race with Search`, 2026-09-10 16:00 UTC.
- OpenAI — `Now everyone can put data to work`, 2026-09-10 15:00 UTC.
- OpenAI — `Introducing ChatGPT for Financial Services`, 2026-09-10 07:00 UTC.
- OpenAI — `Expanding AI access and cyber defense for federal, state, local, and tribal governments`, 2026-09-10 07:00 UTC.
- Google AI — `Get ready for the game with new football features in Search`, 2026-09-09 16:00 UTC.
- Google AI — `Recreating a 70-year love story frame by frame`, 2026-09-09 16:00 UTC.

## Validación local

- `npm ci`: 0 vulnerabilidades.
- `npm run build`: OK.
- `npm run check`: 75 tests pass, 0 fail, 1 skipped esperado por `data/raw` ausente en checkout limpio.
- `npm run validate`: OK; 218 países, 5.280 observaciones, 40 países con medición directa.
- `npm run check:publication`: OK.
- `git diff --check`: OK.

## Límites

- No se refrescaron estadísticas globales porque no correspondía revisión mensual ni había nueva evidencia estadística controlada.
- No se modificó branch protection en GitHub.
- No se hizo publicación directa.


## Cierre de publicación

- PR #31 fusionado por vía normal el 2026-09-11, merge commit `999c76a9db1a0db3db9f8d7512c6d1acc7df93dc`.
- `Integridad del observatorio` en `main`: run `34621053064`, success.
- `Publicar observatorio` en `main`: run `34621053032`, success.
- Verificación pública: portada ES/EN HTTP200, sitemap con 50 URLs, biblioteca pública con 19 fichas y ventana de noticias visible con fecha editorial 11 sept 2026.
- La fecha estadística global sigue siendo 4 sept 2026; la actualización editorial de noticias y biblioteca corresponde al 11 sept 2026.
