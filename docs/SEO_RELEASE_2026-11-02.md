# Search visibility — release audit, 2 November 2026

## Local evidence

`npm run build` passed. `node --test test/portal-fallback.test.mjs test/seo-release.test.mjs test/sitemap-controls.test.mjs test/i18n.test.mjs`: 14/14 passed against the candidate build (6 generated-page SEO checks, 3 initial-content unit checks, 2 sitemap controls, 3 language checks). The generated sitemap currently lists 110 canonical URLs (Spanish/English home, library, topics and Skills). Each URL resolves to a generated file and agrees with one static canonical, reciprocal `es`/`en` alternates, and the same Spanish `x-default` in both HTML and sitemap. Editorial/learning pages expose real `<a href>` links to home and their translated counterpart. Metadata descriptions and titles are static; JSON-LD parses; indexed pages have `index,follow`; the 404 document has `noindex` and is absent from the sitemap.

No change to canonical routes or a new sitemap format was needed. Existing diagnostic XML/text controls are preserved. `lastmod` remains omitted rather than substituting the build date for the editorial update date; it is optional and Google expects an accurate significant-update date when present. [Google: build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Implemented improvements and host verification

1. **Initial home content:** the prior shell had an empty `#editorial-portal`; the new hero, discovery paths and source directory depended on JavaScript. `src/lib/portal-fallback.mjs` now supplies meaningful initial HTML in both languages, with a heading/description, three locale-correct resource links and all 30 official sources. The existing interactive renderer replaces this initial content when JavaScript executes. Google can process JavaScript, but initial rendering avoids depending on its rendering queue and supports other crawlers. This is a rendering improvement, not proof that JavaScript caused earlier indexation results. [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
2. **Publisher consistency:** `docs/AUTORIA.md` supports the author's academic affiliation. It does not by itself establish the university as publisher of this independently curated site. Homepage JSON-LD now identifies César David Rincón Godoy as the publisher, consistent with DC metadata; his BIU academic affiliation remains unchanged. The header uses the approved seal at 72 × 72, and About shows it at 180 × 180 with a localized identifier.
3. **Host-root robots:** on GitHub project Pages, `/observatorio-ia-educacion-empresa/robots.txt` is not the host's crawler-control file. Google uses `https://rinconcd67.github.io/robots.txt`. The packaged file can document the sitemap but must not be treated as proof that host-level crawling is allowed. Inspect host-root response, and submit the project's sitemap directly through Search Console. [Google: robots file location](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).

The test suite protects the implemented canonical/language graph across all generated pages. Google's multilingual guidance requires self and return links; an absent reciprocal alternative may be ignored. [Google: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).

## Publication checks to record separately

- Verify production HTML and sitemap return success, with no `X-Robots-Tag: noindex` header, and match the intended deployed commit/build.
- Inspect host-root robots response for actual restrictions.
- In the already verified Search Console property for the project URL prefix, submit the primary `sitemap.xml` once; record the returned status. Keep any old error rows as historical evidence until Google reprocesses them.
- Use URL inspection/live test for the Spanish home, English home and representative library/Skills pages. Request indexing for the meaningful updated entry points if available; sitemap handles discovery of the broader set.
- Record submission, live-test result, discovered URLs, and indexed status as separate observations. Local checks, HTTP success, sitemap submission and indexing are different states.

No current Search Console status is asserted in this audit: the browser account/property must be observed during the publication step. Earlier unknown/unread sitemap states do not establish the present state. Google explicitly describes sitemap submission as a hint, not a guarantee of immediate crawling or indexing. [Google: sitemap submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
