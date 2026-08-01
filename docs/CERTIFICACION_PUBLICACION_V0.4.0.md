# Certificación interna de publicación y disponibilidad

## Identificación

| Campo | Valor |
|---|---|
| Certificado | OIAEE-CERT-PUB-004 |
| Obra | Observatorio Global de Inteligencia Artificial en Educación y Empresa |
| Versión | 0.4.0 |
| Titular y responsable | César David Rincón Godoy |
| ORCID | https://orcid.org/0009-0003-2112-3851 |
| Fecha de comprobación | 1 de agosto de 2026, 18:28 UTC |
| Naturaleza | Certificación interna de estado técnico |

## Objeto de la certificación

Esta certificación deja constancia de que la versión 0.4.0 del Observatorio se encuentra desplegada, activa y disponible públicamente mediante HTTPS en GitHub Pages. También documenta la correspondencia entre los artefactos canónicos del repositorio y los archivos entregados por el sitio público.

## Activos certificados

| Activo | URL | Resultado |
|---|---|---|
| Sitio en español | https://rinconcd67.github.io/observatorio-ia-educacion-empresa/ | HTTP 200; HTML UTF-8 |
| Sitio en inglés | https://rinconcd67.github.io/observatorio-ia-educacion-empresa/en/ | HTTP 200; HTML UTF-8 |
| Sitemap | https://rinconcd67.github.io/observatorio-ia-educacion-empresa/sitemap.xml | HTTP 200; XML |
| Directivas de rastreo | https://rinconcd67.github.io/observatorio-ia-educacion-empresa/robots.txt | HTTP 200; rastreo permitido |
| Repositorio | https://github.com/rinconcd67/observatorio-ia-educacion-empresa | Público; rama `main` |
| Release | https://github.com/rinconcd67/observatorio-ia-educacion-empresa/releases/tag/v0.4.0 | Publicada; no es borrador ni prerelease |

## Evidencia criptográfica

| Artefacto | SHA-256 local y público |
|---|---|
| `dashboard/index.html` | `1c5d44f50a8bb2a42bbfa6f81a4f170459b146c9fc267d46a4eaeb119d17add2` |
| `dashboard/en/index.html` | `9c423d947fe8263c23cf38fedcbfda2071568e34f26fb59ef53090635a3ff6d7` |
| `src/public/sitemap.xml` | `1419b601061b5338df565222678078d8cffbfa44ec3accdcfc304235395866b7` |
| `src/public/robots.txt` | `74487169744d35cb989cff5dc16d70e53215bceb7f6285de1ba349b232823cf2` |

La igualdad de las huellas demuestra que el contenido servido durante la comprobación coincide byte por byte con los artefactos canónicos locales.

## Evidencia de integración y despliegue

| Control | Identificador | Commit | Resultado |
|---|---:|---|---|
| Integridad del observatorio | `30711938287` | `9077220a591f236ab22dd23e3537a8e9209a85cc` | `success` |
| Publicar observatorio | `30711938228` | `9077220a591f236ab22dd23e3537a8e9209a85cc` | `success` |

El workflow de despliegue concluyó el 1 de agosto de 2026 a las 18:11:17 UTC. Las páginas públicas informaron como última modificación las 18:11:10 UTC.

## Estado en Google

- La propiedad URL-prefix del observatorio fue verificada en Google Search Console.
- El sitemap fue enviado y aceptado para procesamiento.
- La ruta española fue añadida a la cola prioritaria de rastreo.
- La ruta inglesa fue añadida a la cola prioritaria de rastreo.

Estas acciones no equivalen a una garantía de aparición inmediata en los resultados de Google. La indexación, clasificación y fecha de aparición dependen exclusivamente del procesamiento posterior de Google.

## Dictamen

Con base en las respuestas HTTP, la visibilidad del repositorio, la release publicada, los resultados exitosos de GitHub Actions y la paridad SHA-256, se certifica internamente que:

> **El Observatorio Global de Inteligencia Artificial en Educación y Empresa, versión 0.4.0, se encuentra activo, íntegro y disponible públicamente en su sitio web bilingüe.**

## Alcance y limitación

Esta es una certificación interna de disponibilidad e integridad técnica emitida por el responsable del proyecto. No constituye una auditoría independiente, una certificación de un tercero ni una garantía de disponibilidad ininterrumpida del proveedor de alojamiento.

**Responsable:** César David Rincón Godoy

**ORCID:** https://orcid.org/0009-0003-2112-3851

**Programa:** Doctorado en Educación e Inteligencia Artificial, Broward International University

**Fecha:** 1 de agosto de 2026
