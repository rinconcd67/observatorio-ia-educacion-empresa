# Biblioteca bilingüe, bibliotecario y guías temáticas

Candidato local v0.5.0. Revisión: 4 septiembre 2026, America/New_York.

## Implementado

- Estantería visual con 12 publicaciones oficiales: cuatro UNESCO, cuatro BID, cuatro OCDE. Cubiertas editoriales propias; sin copiar logos, portadas ni PDFs.
- 24 fichas estáticas ES/EN con título original, reseña, aportes, destinatarios, organismo, año, idioma de edición, alcance de revisión y enlace oficial. Todas las reseñas iniciales se basan en fichas/resúmenes oficiales: no se atribuye lectura íntegra.
- Búsqueda sin distinción de mayúsculas/tildes, filtros por organismo, tema y año, contador, resultado vacío y restablecimiento; aliases BID/IDB y OCDE/OECD. Mesa de novedades con fechas de incorporación separadas del año bibliográfico.
- Tres guías: IA en educación, IA y docentes en América Latina, IA en empresas; cada una ES/EN, con referencias y lecturas relacionadas.
- Acceso desde la navegación y portada del observatorio. Ventana lateral de noticias conservada en el panel.
- 34 páginas editoriales nuevas: dos estanterías, 24 fichas, dos índices temáticos y seis guías. Sitemap final: 36 URLs, incluyendo las dos portadas del panel.
- Canonical por página, alternancias hreflang recíprocas, HTML legible sin JavaScript y datos estructurados coherentes. No se garantiza indexación ni posición en Google.

## Bibliotecario

Validación del catálogo, consultas con límites, preservación del último resultado válido y propuestas de revisión. La automatización existente «Revisión diaria del Observatorio de IA» está activa y fue ampliada para investigar novedades una vez cada siete días, sin crear una tarea duplicada. El script comprueba enlaces; el agente recurrente investiga portales oficiales y prepara propuestas bilingües. Nuevas incorporaciones y modificaciones sustantivas requieren revisión editorial; no hay publicación remota autónoma.

Primera comprobación: 12 fichas válidas, seis HTTP200 y seis bloqueos HTTP403. Las doce páginas se verificaron mediante lectura web. Los bloqueos no se registran como documentos retirados ni se confunden cambios HTML con nuevas ediciones. Evidencia: library-review.json y library-sources-2026-09-04.md.

## Verificación

72/72 pruebas aprobadas, validación analítica/paquete ES/EN y control de publicación aprobados; git diff --check limpio. Comprobación de todas las rutas internas bajo subruta GitHub Pages, alternancias recíprocas y sitemap.

QA Chrome escritorio y Playwright a 390×844: sin desbordamiento horizontal (scrollWidth=390), lectura de fichas, cambio ES→EN conservando publicación, búsqueda combinada con organismo, restablecimiento a 12 libros, búsqueda vacía informativa, IDB=4 y OECD=4 resultados. Consola de biblioteca: cero errores/avisos. Se corrigieron enlaces temáticos vacíos, aliases de búsqueda y contador singular.

Las 5.280 observaciones y los 40 países con medición directa del panel no se alteran por añadir libros o guías.

## Estado y siguientes pasos

Implementado y verificado localmente, sin stage/commit/push/despliegue en esta ampliación. No se envió sitemap a Google ni se comprobó nueva indexación pública. Antes de publicar, revisar el alcance acumulado y el informe publication-candidate.md; cierre Git y despliegue por separado. Tras despliegue, verificar las rutas públicas y enviar el sitemap en Search Console.

- Biblioteca ES: http://127.0.0.1:4173/biblioteca/
- Library EN: http://127.0.0.1:4173/en/library/
- Temas ES: http://127.0.0.1:4173/temas/
- Topics EN: http://127.0.0.1:4173/en/topics/

## Referencias de diseño SEO

- [Google: versiones localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google: sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: contenido útil y fiable](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
