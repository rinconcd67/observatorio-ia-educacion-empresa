# Controles públicos del sitemap — 2026-10-15

Tres controles reproducibles dentro del Observatorio comparan dirección y representación del mismo inventario de 94 páginas públicas (30 Skills).

| Archivo | Contenido |
| --- | --- |
| sitemap-control.xml | Copia idéntica del sitemap principal, incluidas las alternancias de idioma. |
| sitemap-simple.xml | Las mismas URL canónicas con únicamente urlset/url/loc. |
| sitemap-control.txt | Las mismas URL, una por línea, UTF-8. |

El generador conserva el sitemap principal y produce los controles en la misma construcción. No incluye datos de sesión, capturas, información de cuenta ni rutas privadas. No cambia navegación, páginas, dominio, permisos ni robots. Los controles no se incluyen como páginas en el sitemap.

Validación local: build, 91 pruebas y control de publicación correctos; los tres inventarios coinciden y cada destino corresponde a una página construida dentro del Observatorio. build-verification.json contiene tamaños y hashes esperados para comprobar la publicación.

## Interpretación prevista
- Si funciona la copia idéntica y falla el principal, se investigará una diferencia asociada al registro o dirección.
- Si funciona el XML básico y falla la copia, se investigarán las diferencias de representación, sin asumir que hreflang es inválido.
- Si solo funciona el texto, se investigará el tratamiento de XML.
- Si todos fallan o no se han leído, no se habrá identificado la causa.

Una respuesta diferente es un indicio que necesita confirmación; las diferencias de programación de rastreo impiden atribuir causalidad únicamente al orden de los resultados. Una prueba en vivo correcta no acredita procesamiento automático ni indexación de las páginas.

Las solicitudes y los resultados privados de Search Console se registran fuera del repositorio público. El protocolo contempla un solo envío inicial por control; no repetir envíos para forzar resultados.

Referencia: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap.
