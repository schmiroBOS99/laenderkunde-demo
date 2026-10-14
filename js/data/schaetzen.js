// Schätzfragen für Zahl-Eigenschaften (Feld "schaetzen" in properties.json):
// { einheit: Eingabeeinheit, faktor: Wert je Eingabeeinheit, relativ?: Anteil vom wahren Wert, absolut: Mindesttoleranz }
// Richtig, wenn |Schätzung − Wert| ≤ max(relativ × Wert, absolut) – alles in Eingabeeinheiten.

const zahlFmt = new Intl.NumberFormat('de-DE', { maximumSignificantDigits: 3, maximumFractionDigits: 6 });
const genauFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 6 });
const pctFmt = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 0 });

// Deutsche Eingabe: "84,5", "1.430" (Tausenderpunkt), "0.5" (Punkt als Komma), "-3".
export function parseZahl(text) {
  let t = String(text).trim().replace(/\s/g, '').replace('−', '-');
  if (t === '') return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  return /^-?\d*\.?\d+$/.test(t) ? Number(t) : NaN;
}

export const inEingabe = (prop, wert) => wert / prop.schaetzen.faktor;
export const formatEingabe = x => zahlFmt.format(x);

export function toleranz(prop, wahr) {
  const s = prop.schaetzen;
  return Math.max((s.relativ ?? 0) * Math.abs(wahr), s.absolut ?? 0);
}

// z. B. "±10 % (mind. ±0,05 Mio.)" oder "±8 von 100"
export function toleranzText(prop) {
  const s = prop.schaetzen;
  const abs = `±${genauFmt.format(s.absolut)} ${s.einheit}`;
  return s.relativ ? `±${pctFmt.format(s.relativ)} (mind. ${abs})` : abs;
}

// Prüft eine Schätzung (Eingabeeinheiten); liefert { richtig, abweichung, relativ }.
export function pruefe(prop, wert, schaetzung) {
  const wahr = inEingabe(prop, wert);
  const abweichung = schaetzung - wahr;
  return {
    richtig: Math.abs(abweichung) <= toleranz(prop, wahr) + 1e-9,
    abweichung,
    relativ: wahr !== 0 ? abweichung / Math.abs(wahr) : null,
  };
}

// Kleinster und größter Wert aller Länder (mit Ländernamen), gecacht je Eigenschaft.
const bereichCache = new Map();
export function wertebereich(countries, prop) {
  if (!bereichCache.has(prop.key)) {
    const list = Object.values(countries).filter(c => typeof c[prop.key] === 'number');
    if (list.length === 0) return null;
    const min = list.reduce((a, c) => (c[prop.key] < a[prop.key] ? c : a));
    const max = list.reduce((a, c) => (c[prop.key] > a[prop.key] ? c : a));
    bereichCache.set(prop.key, { min: min[prop.key], max: max[prop.key], minLand: min.name_de, maxLand: max.name_de });
  }
  return bereichCache.get(prop.key);
}

// "0,00044 bis 17.100 Tsd. km²" (in Eingabeeinheit, sonst in der normalen Einheit)
export function bereichText(countries, prop) {
  const b = wertebereich(countries, prop);
  if (!b) return '';
  const f = prop.schaetzen?.faktor ?? 1;
  if (prop.vorsatz) return `${prop.vorsatz}${formatEingabe(b.min / f)} bis ${formatEingabe(b.max / f)}`;
  const einheit = prop.schaetzen?.einheit ?? prop.einheit ?? '';
  return `${formatEingabe(b.min / f)} bis ${formatEingabe(b.max / f)}${einheit ? ' ' + einheit : ''}`;
}
