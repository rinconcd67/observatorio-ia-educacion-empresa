<memory project="ObservatorioIAEducacionEmpresa">
- Estado actual: v0.4.0 permanece pública; candidato local v0.5.0 revisado al 2026-09-04T23:58:34Z, 11/11 fuentes, 5.280 observaciones, 218 países y 40 con medición directa. Listo para revisión humana; sin commit, push ni despliegue en esta sesión.
- Decisiones clave: mantener APIs oficiales OCDE; HTTP 500 previo transitorio, HTTP 200 posterior con URL idéntica. Reintentos limitados, Retry-After, validación de CSV y rechazo de ausencias. Oxford conserva hash de archivo y separa hash estadístico; no bloquea cambios HTML con datos iguales. Publicación exige comparación contra base publicada versionada.
- Versiones anteriores: v0.4.0 publicada 2026-08-01; candidato 2026-08-10 degradado 9/11 fuentes y 5.164 observaciones; prueba inicial 2026-09-04 igualmente bloqueada, preservada en reports/diagnostico-2026-09-04.
- Contextos relevantes: ninguna alta, baja o cambio de valor frente a base publicada; cambia verificación y robustez técnica. AIPI edición 2023, Oxford 2025 y series dinámicas hasta 2025. Interfaz ES/EN indica Revisado/Reviewed.
- Portal editorial 2026-09-04: mejoras 2/3/4 implementadas localmente; portada ES/EN, periodos/cobertura visibles, tres claves y diferencias desde base. Radar RSS con 12 titulares de OpenAI, Google AI y Microsoft Research, 3/3 fuentes; workflow diario de propuestas preparado, no activado. 57 pruebas y validación aprobadas.
- Seguimiento: automatización Codex activa revisi-n-diaria-del-observatorio-de-ia, diaria 09:00 America/New_York; actualiza candidato local y avisa ante cambios relevantes/fallos; sin publicación ni Git remoto autónomos.
- Ajuste visual solicitado: noticias en ventana lateral independiente a la derecha, con scroll propio, minimizar/reabrir; eliminada la cuadrícula de titulares encima de los datos. Verificado visualmente y controles funcionando en Chrome.
- Próximos hitos: revisar reports/publication-candidate.md y reports/actualizacion-fuentes-2026-09-04.md; autorizar cierre Git/publicación por separado; actualizar baseline solo tras comprobar una nueva publicación. Mejora 5 implementada localmente; siguiente ampliación: páginas temáticas SEO.
- Mejora 5 (2026-09-04): módulo ES/EN América Latina y docentes; TALIS 2024 Brasil/Chile/Colombia/Costa Rica (8 observaciones), TIC Educação 2025 Brasil (2 indicadores escolares), marco UNESCO y seguimiento BID. Capa complementaria sin modificar métricas globales; sin resultados causales incorporados. 60/60 pruebas, QA Chrome ES/EN y ficha Colombia. Fuentes revisadas en web; descarga HTTP directa 5/10, con 403 OCDE/BID registrados. Detalle: reports/mejora-5-latinoamerica-docentes-2026-09-04.md. Próximo hito: páginas temáticas; publicación remota sigue pendiente.
- Biblioteca (2026-09-04): ejecutadas estantería visual, búsqueda/filtros, mesa de novedades, 12 publicaciones UNESCO/BID/OCDE y 24 fichas ES/EN; todas declaran lectura de ficha/resumen oficial. Rutas /biblioteca/ y /en/library/. Tres guías temáticas ES/EN, canonical/hreflang y sitemap de 36 URLs. Bibliotecario implementado; automatización existente ampliada con curación cada siete días y propuestas para revisión humana. Primera consulta directa: 6 HTTP200 y 6 HTTP403 registrados; fuentes leídas en web. 72 pruebas, enlaces internos y QA móvil verificados; sin publicación remota. Próximo hito: revisión editorial final y cierre Git/publicación por separado.
- Publicación autorizada expresamente (2026-09-04): preparar PR, controles CI, integración y despliegue de todas las mejoras v0.5.0. El permiso cubre el cierre Git necesario de esta versión. Resultado público pendiente de verificación en este punto.
- v0.5.0 publicada y verificada por HTTP200: PR #18, merge ed7129f, Actions 33936391840 success. Artifact y CSV públicos coinciden por SHA-256; baseline promovida tras verificación. Nueva incorporación solicitada: MIT, noticia25ago2026 e informe13ago2026 (40p completas revisadas), ficha ES/EN y PDF oficial; catálogo13 obras,38URLs. Publicación de este suplemento en preparación.
- Actualización candidata 2026-09-11: rama limpia `update/observatorio-2026-09-11` preparada desde `origin/main`. Incluye titulares del PR #30, biblioteca ampliada de 15 a 19 fichas ES/EN, sitemap editorial de 50 URLs y corrección CI para PRs automáticos: los flujos `refresh-news` y `refresh-data` disparan `workflow_dispatch` sobre la rama de revisión y crean el check requerido `validate` sobre el SHA del PR, sin usar `pull_request_target` ni saltar la protección de rama. Nuevas fichas: UNESCO `The algorithm in the room` 2026; UNESCO `Ministerial Statement: Sustaining education as a common good in the age of AI` 2026; OCDE `Skills in the AI age` 2026 DOI `10.1787/972bd15e-en`; OCDE `PISA findings on artificial intelligence use, reading skills and learning` 2026. Validación local: `npm ci`, `npm run build`, `npm run check`, `npm run validate`, `npm run check:publication` y `git diff --check` OK; 75 tests pass, 0 fail, 1 skipped esperado por `data/raw` ausente. No se refrescaron estadísticas globales, no se modificó branch protection y no se publicó directamente. Reporte: reports/daily-review-2026-09-11/update-candidate.md.
- Publicación verificada 2026-09-11: PR #31 fusionado por vía normal, sin bypass administrativo, merge commit `999c76a9db1a0db3db9f8d7512c6d1acc7df93dc`. GitHub Actions en `main` verde: `Integridad del observatorio` run `34621053064` success y `Publicar observatorio` run `34621053032` success. Verificación pública HTTP200: portada ES, portada EN, sitemap con 50 URLs y biblioteca pública con 19 fichas; la portada distingue `Datos estadísticos 4 sept 2026 · Noticias y biblioteca 11 sept 2026`. La ventana de noticias quedó visible en Chrome con `Fuentes oficiales · 11 sept 2026`, 12 titulares RSS y selección editorial MIT. Se mantiene la distinción: no hubo refresco estadístico global posterior al 2026-09-04; la actualización del 2026-09-11 corresponde a noticias, biblioteca, sitemap y automatización CI.

- Actualización candidata 2026-10-08: rama `update/observatorio-2026-10-08` desde `origin/main` (`c132382`). Primer refresco estadístico completo desde v0.5.0: 11/11 fuentes, 5.280 observaciones, 0 valores distintos frente a la base publicada, informe comparativo APROBADA PARA REVISIÓN HUMANA, 76/76 pruebas. Causa raíz del bloqueo del flujo mensual (2026-09-01 y 2026-10-01, 8/11 fuentes): la cabecera `accept: text/csv` provoca HTTP 500 en el SDMX de la OCDE y 406 en Eurostat; corregida en `src/refresh.mjs` a `text/csv, */*;q=0.1`, verificada con Node contra ambas APIs. Oxford cambió bytes HTML con observaciones idénticas. Doce titulares nuevos (23 sept a 8 oct). Reporte: reports/daily-review-2026-10-08/update-candidate.md. Aparte, PR #58 corrige el flujo diario de titulares (propuesta única sobre `automation/news-review` y autolimpieza de 31 propuestas y 33 ramas antiguas). Publicación remota pendiente de pull request y revisión humana.
</memory>

<memory project="ObservatorioIAEducacionEmpresa">
- Estado actual: Skills candidato local15oct2026,4rutas,10fichas,8ES+2EN,aprendizaje gratuito; no publicado.
- Decisiones: Google EducatorSeries incluida con idioma inglés/coreano explícito; diferenciar costo herramientas, credencial y formación; ofertasintro alternativas.
- Versiones anteriores: baseaa11f04/PR63 MITLegacy; checkout original175archivos sin cambios.
- Verificación:89pruebas y gate local aprobados;30páginas Skills ES/EN;94URL sitemap candidato sin enviar; QA escritorio y móvil.
- Próximo hito: revisión humana en http://127.0.0.1:4181/skills/ antes de cualquier publicación. Evidencia reports/skills-2026-10-15/CANDIDATO.md.
</memory>

<autorizacion fecha="2026-10-15">Usuario aprueba publicar Skills con cuatro rutas y diez fichas, validaciones previas, verificación pública y cierre Git limpio. Checkout original preservado. Referencia remota actualizada a74f9438 antes del cambio.</autorizacion>

<memory project="Observatorio Skills" fecha="2026-10-15">
- Estado actual: publicado y verificado; PR #64, despliegue 38781149345.
- Decisiones clave: cuatro rutas, diez fichas, ocho en español; formación gratuita separada de costos de herramientas o credenciales.
- Versiones anteriores: candidato local aprobado; implementación c25a113; integración 338f341.
- Contextos relevantes: checkout original preservado, 175 archivos sin diferencias; 30 páginas públicas coinciden con el build.
- Próximos hitos: mantener fuentes y condiciones; seguimiento de indexación independiente de publicación.
</memory>

<memory project="Observatorio sitemap controls" fecha="2026-10-15">
- Estado actual: controles publicados mediante PR #66 (0ee2379), despliegue 38794697594 y comparación pública de hashes correcta.
- Decisiones clave: mismo inventario público de 94 URL; copia XML idéntica, XML básico y texto plano; alcance exclusivo de la subcarpeta del Observatorio.
- Versiones anteriores: sitemap principal y páginas Skills conservados byte a byte.
- Contextos relevantes: 91 pruebas correctas; evidencias privadas y comparación de Search Console fuera del repositorio público; ningún cambio en la raíz ni en otros proyectos.
- Próximos hitos: contrastar publicación con hashes y comparar una lectura automática posterior al envío único de cada control; no inferir causa mientras los resultados sean inconclusos.
</memory>

<memory project="Observatorio-CEPAL-ILIA-Skills" fecha="2026-10-20">
- Estado actual: candidato local en copia aislada, listo para revisión humana; sin publicación.
- Decisiones clave: CEPALSTAT 4052/4891/3816; 3.105 registros con 220 agregados separados y dos ausencias por nota; dos ILIA con lectura parcial; tres cursos IA y Python complemento.
- Versiones anteriores: main42097ff; catálogo anterior26documentos/10Skills; candidato28/14 y106URL.
- Verificación:99pruebas aprobadas,0fallos,0omitidas;106HTTP200local;QAES/EN y móvil; original175archivos,estadoGit yHEADpreservados.
- Próximos hitos: revisión en http://127.0.0.1:4182/?view=education#cepal-context ; publicación y cierreGit pendientes de autorización.
</memory>

<autorizacion fecha="2026-10-20" proyecto="CEPAL-ILIA-Skills">
El usuario aprueba publicar el candidato revisado: stage selectivo, commit, push, PR y despliegue tras validar, verificación pública y cierre Git limpio. El permiso se limita al Observatorio y exige preservar el checkout original. Las 99 pruebas locales y la auditoría del diff fueron satisfactorias; CI, merge y publicación deben verificarse por separado.
</autorizacion>

<memory project="Observatorio-CEPAL-ILIA-Skills" fecha="2026-10-20">
- Estado actual: publicado y verificado mediante PR69; implementaciónf7b1436,mergecfc8490,despliegue39527704163success.
- Decisiones clave: tres seriesCEPAL de contexto con3.105registros,220agregadosseparados y2ausencias; biblioteca28fichas con2ILIA; Skills14fichas,12ES+2EN,Pythoncomplemento y4rutas.
- Versiones anteriores: candidato validado99pruebas; origenmain42097ff. Las26fichasdocumentales y10Skills previas se conservan.
- Verificación pública:106páginasHTTP200idénticas albuild,38Skills;8recursos coincidentes; CI asociada alPR ymaincorrecta; original175archivos,estadoGit yHEADpreservados.
- Contextos relevantes: sin cambios en la raíz ni en otros proyectos; sin envío aSearchConsole,la publicación no prueba indexación. Evidencia pública reports/cepal-ilia-skills-2026-10-20/PUBLICACION.md.
- Próximos hitos: mantenimiento de fuentes y seguimiento independiente de indexación.
</memory>
