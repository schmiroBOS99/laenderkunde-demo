// Lädt Länder- und Eigenschaftsdaten (einmalig, danach aus dem Cache).
let cache = null;

export async function loadData(base = './data/') {
  if (cache) return cache;
  const [countries, properties] = await Promise.all([
    fetch(base + 'countries.json').then(r => r.json()),
    fetch(base + 'properties.json').then(r => r.json()),
  ]);
  cache = { countries, properties };
  return cache;
}

// Länderumrisse (world-atlas, TopoJSON → GeoJSON). Benötigt globales topojson aus lib/.
let atlas = null;

export async function loadAtlas(url = './lib/countries-50m.json') {
  if (atlas) return atlas;
  const topo = await fetch(url).then(r => r.json());
  atlas = topojson.feature(topo, topo.objects.countries).features
    .filter(f => f.id !== '010');   // Antarktis ausblenden
  return atlas;
}
