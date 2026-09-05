# Mejora 5: América Latina y dimensión docente

Revisión: 4 de septiembre de 2026 (America/New_York). Candidato local v0.5.0.

## Entrega

Módulo bilingüe en Educación, acceso desde portada y notas complementarias en las fichas de Brasil, Chile, Colombia y Costa Rica. Se conserva la ventana lateral de noticias. Incluye descarga JSON y registro de consultas.

| País | Usó IA en su trabajo | Alta necesidad de formación en IA |
|---|---:|---:|
| Brasil | 56% | 39% |
| Chile | 55% | 41% |
| Colombia | 53% | 43% |
| Costa Rica | 52% | 55% |

Fuente: notas nacionales OCDE TALIS 2024 publicadas 7 octubre 2025; docentes de secundaria inferior (CINE 2), autorreporte, valores enteros publicados. Son dimensiones no excluyentes. La selección no representa toda América Latina: no se calcula promedio regional, diferencia entre columnas ni impacto causal.

Brasil: TIC Educação 2025 incorpora 22% de escuelas con guía de IA y 37% que permiten uso estudiantil para actividades educativas. Campo agosto 2025–abril 2026; publicación 4 agosto 2026; 2.404 escuelas, entrevistas telefónicas a gestores. Permiso no equivale a uso efectivo. Población institucional distinta de TALIS y de los módulos docentes TIC Educação 2024.

Se incorpora el marco UNESCO (15 competencias, cinco dimensiones, tres niveles) como referencia formativa, su observatorio regional como conexión institucional y el proyecto BID RG-T4991 como seguimiento de evaluación. No se incorporan todavía resultados causales de aprendizaje.

## Integridad y límites

Ocho observaciones docentes y dos institucionales se mantienen en capa complementaria: no alteran las 5.280 observaciones, los 218 países ni los 40 países de medición directa del panel original. Cada registro conserva población, periodo, método y fuente.

Las diez páginas oficiales se revisaron mediante lectura web. La comprobación adicional por HTTP directo descargó cinco páginas (Cetic.br y UNESCO) y obtuvo 403 en cuatro notas OCDE y BID. Se conservan los errores reales; no se fabrica una descarga ni una huella. El registro registra recuperación de documentos, no certifica automáticamente sus cifras. Comando reproducible: npm run verify:education-sources; devuelve fallo si una descarga no puede completarse. Los cambios numéricos requieren revisión editorial.

## Verificación

60/60 pruebas aprobadas; validación de datos y paquete ES/EN aprobada; informe de publicación generado; git diff --check limpio. Revisión en Chrome de Educación ES/EN, tabla y convivencia con ventana de noticias; ficha de Colombia comprobada con 53%/43%. Se corrigió el contraste de encabezados de tabla.

Estado: implementado y comprobado localmente. Sin commit, push ni despliegue. Próximo hito: páginas temáticas para búsqueda orgánica.

## Fuentes oficiales

- [talis2024_bra](https://www.oecd.org/en/publications/results-from-talis-2024-country-notes_e127f9e2-en/brazil_1e93d3b5-en.html)
- [talis2024_chl](https://www.oecd.org/en/publications/results-from-talis-2024-country-notes_e127f9e2-en/chile_e31949b6-en.html)
- [talis2024_col](https://www.oecd.org/en/publications/results-from-talis-2024-country-notes_e127f9e2-en/colombia_8f1df220-en.html)
- [talis2024_cri](https://www.oecd.org/en/publications/results-from-talis-2024-country-notes_e127f9e2-en/costa-rica_90152658-en.html)
- [cetic2025_e5a](https://cetic.br/pt/tics/educacao/2025/escolas/E5A/expandido/)
- [cetic2025_e5b](https://cetic.br/pt/tics/educacao/2025/escolas/E5B/)
- [cetic2025_method](https://cetic.br/pt/noticia/tic-educacao-2025-mostra-que-8-em-cada-10-escolas-brasileiras-debatem-impacto-do-uso-de-telas-na-saude-mental-dos-alunos/)
- [unesco_teacher_framework](https://www.unesco.org/en/articles/ai-competency-framework-teachers)
- [unesco_lac_observatory](https://www.unesco.org/en/articles/observatory-artificial-intelligence-education-latin-america-and-caribbean)
- [idb_rg_t4991](https://www.iadb.org/en/project/RG-T4991)
