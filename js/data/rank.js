// Rangberechnung zur Laufzeit: Platz 1 = höchster Wert (bei richtung "aufsteigend" der niedrigste,
// z. B. FIFA-Platz). Gleiche Werte teilen sich den Platz. Gesamtzahl = Anzahl Länder mit Wert.
// Texteigenschaften haben keinen Rang.
const cache = new Map();

function buildRanks(countries, prop) {
  const key = prop.key;
  const vz = prop.richtung === 'aufsteigend' ? 1 : -1;
  const list = Object.values(countries)
    .filter(c => typeof c[key] === 'number')
    .sort((a, b) => vz * (a[key] - b[key]));
  const ranks = new Map();
  list.forEach((c, i) => {
    const prev = list[i - 1];
    const platz = prev && prev[key] === c[key] ? ranks.get(prev.iso3).platz : i + 1;
    ranks.set(c.iso3, { platz, von: list.length });
  });
  return ranks;
}

// Liefert { platz, von } oder null (kein Wert bzw. Texteigenschaft).
// scopeKey benennt die Vergleichsgruppe (z. B. "Europa"), damit Teilmengen getrennt gecacht werden.
export function getRank(countries, prop, iso3, scopeKey = 'welt') {
  if (prop.typ !== 'zahl') return null;
  const k = `${prop.key}|${scopeKey}`;
  if (!cache.has(k)) cache.set(k, buildRanks(countries, prop));
  return cache.get(k).get(iso3) ?? null;
}

export function formatRank(rank) {
  return rank ? `Platz ${rank.platz} von ${rank.von}` : '';
}

export function clearRankCache() {
  cache.clear();
}
