const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

/** Initial, crawlable content; the interactive portal replaces this after startup. */
export function renderPortalFallback(localeName, catalogue) {
  if (!['es', 'en'].includes(localeName)) throw new Error('Unsupported portal locale');
  if (!Array.isArray(catalogue?.items)) throw new Error('Official source catalogue is missing');
  const es = localeName === 'es';
  const say = (spanish, english) => es ? spanish : english;
  const sources = catalogue.items.map(item => {
    const url = new URL(item.url);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Unsafe official source URL: ${item.id}`);
    const copy = item[localeName];
    if (!copy?.title || !copy?.description) throw new Error(`Missing official source translation: ${item.id}/${localeName}`);
    return `<li><a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(item.name)}</strong> · ${escapeHtml(copy.title)}</a><p>${escapeHtml(copy.description)}</p></li>`;
  }).join('\n');
  return `<div class="portal-static" data-portal-fallback="${localeName}">
    <section class="portal-hero">
      <div class="hero-copy">
        <p class="eyebrow">${say('CONOCIMIENTO ABIERTO · POSIBILIDADES REALES', 'OPEN KNOWLEDGE · REAL POSSIBILITIES')}</p>
        <h1>${say('Entiende la IA.<br><em>Imagina lo que sigue.</em>', 'Understand AI.<br><em>Imagine what’s next.</em>')}</h1>
        <p class="portal-deck">${say('Descubre cómo la inteligencia artificial transforma la educación y el trabajo. Explora datos, encuentra ideas y desarrolla nuevas habilidades.', 'Discover how artificial intelligence is transforming education and work. Explore data, find ideas and build new skills.')}</p>
        <div class="hero-actions">
          <a class="portal-button" href="${es ? 'biblioteca/' : 'library/'}">${say('Explorar la biblioteca', 'Explore the library')}</a>
          <a class="portal-secondary" href="skills/">${say('Aprender IA', 'Learn AI')}</a>
          <a class="portal-secondary" href="${es ? 'temas/' : 'topics/'}">${say('Guías temáticas', 'Topic guides')}</a>
        </div>
        <p class="hero-footnote">${say('Fuentes oficiales. Mirada global. Conexión latinoamericana.', 'Official sources. Global perspective. Latin American connections.')}</p>
      </div>
      <figure class="hero-art"><img src="${es ? '' : '../'}assets/learning-together.webp" width="1536" height="1024" alt="${say('Personas conectando aprendizaje, investigación y trabajo alrededor de un computador.', 'People connecting learning, research and work around a computer.')}" fetchpriority="high"><figcaption>${say('Aprender. Compartir. Transformar.', 'Learn. Share. Transform.')}</figcaption></figure>
    </section>
    <section class="editorial-section" aria-labelledby="static-sources-title">
      <p class="eyebrow">${say('UNA MIRADA AL MUNDO', 'A WINDOW ON THE WORLD')}</p>
      <h2 id="static-sources-title">${say('Fuentes oficiales para explorar la inteligencia artificial', 'Official sources to explore artificial intelligence')}</h2>
      <p>${escapeHtml(catalogue.scope?.[localeName] ?? '')}</p>
      <ul class="static-sources">${sources}</ul>
    </section>
  </div>`;
}
