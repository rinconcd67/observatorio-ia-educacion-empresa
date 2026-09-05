# Portal editorial y radar de IA — 4 septiembre 2026

Implementado en candidato local v0.5.0, sin publicación ni operaciones Git remotas.

- Vigencia: año de observación separado de fecha de revisión; contexto junto a indicadores Global, Educación, Empresa, Gobernanza, Regiones y Países.
- Cobertura: portada destaca 40/218 países con uso directo. Educación: 35/218, 34 en Europa y Asia Central. Cálculo desde artefacto, sin cifras editoriales fijas.
- Lectura ejecutiva: tres claves interpretativas y altas/cambios/bajas calculados frente a base publicada. Vínculos a metodología y vistas de evidencia.
- Portal bilingüe ES/EN con tipografía editorial, titulares enlazados y acceso directo a datos.
- Radar: 12 titulares, máximo 4 por fuente, OpenAI/Google AI/Microsoft Research. Solo título original, fecha y enlace oficial; sin artículos completos ni imágenes externas.
- RSS real consultado 4 septiembre 20:09 Nueva York. No es actualización en tiempo real. Ante fallos mantiene copia válida y muestra estado stale y última consulta exitosa en JSON.
- Actualización manual: npm run refresh:news y npm run build. npm run refresh incorpora titulares. Requiere python3 para parser XML estándar.
- Flujo diario de propuestas preparado en .github/workflows/refresh-news.yml, 11:30 UTC; requiere incorporar cambios al repositorio remoto y revisión humana de propuestas. No activado ni ejecutado remotamente.
- QA: 57 pruebas aprobadas, validación estructural y control de publicación; portada y titulares ES/EN revisados visualmente en Chrome. CSS contempla pantallas estrechas; no se hizo prueba física de móvil.

Fuentes RSS:
https://openai.com/news/rss.xml
https://blog.google/technology/ai/rss/
https://www.microsoft.com/en-us/research/feed/

Alcance editorial: canales de los propios proveedores, no cobertura periodística independiente exhaustiva. El crecimiento de audiencia no ha sido medido ni se garantiza. La incorporación de fuentes académicas, multilaterales y regionales debe ampliar perspectivas en una siguiente fase.
