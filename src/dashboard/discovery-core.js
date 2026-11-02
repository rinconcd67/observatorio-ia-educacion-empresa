/* Shared, dependency-free search contract used by the preview and regression tests. */
(() => {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function search(items, query, kind = '') {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return items.filter(item => (!kind || item.kind === kind) && tokens.every(token => normalize([item.title,item.description,item.keywords].join(' ')).includes(token)));
  }
  function filterSources(items, region = '', type = '') {
    return items.filter(item => (!region || item.region === region) && (!type || item.type === type));
  }
  globalThis.ObservatoryDiscovery = Object.freeze({ normalize, search, filterSources });
})();
