// Rundung und deutsches Zahlenformat für Eigenschaftswerte.
const nf = (opts) => new Intl.NumberFormat('de-DE', opts);
const SIG3 = nf({ maximumSignificantDigits: 3 });
const GANZ = nf({ maximumFractionDigits: 0 });
const DEZ1 = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
const DEZ2 = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STUFEN = [
  [1e12, 'Bio.'],
  [1e9, 'Mrd.'],
  [1e6, 'Mio.'],
];

const roundSig = (v, n = 3) => (v === 0 ? 0 : Number(v.toPrecision(n)));
const ca = (exact, rounded, text) => (exact === rounded ? text : 'ca. ' + text);

// Zahl ohne Einheit nach Rundungsregel.
export function formatNumber(v, rule) {
  switch (rule) {
    case 'gross': {
      const stufe = STUFEN.find(([f]) => Math.abs(v) >= f);
      if (stufe) {
        const r = roundSig(v / stufe[0]);
        return ca(v / stufe[0], r, `${SIG3.format(r)} ${stufe[1]}`);
      }
      return ca(v, roundSig(v), SIG3.format(v));
    }
    case 'sig3': return ca(v, roundSig(v), SIG3.format(v));
    case 'prozent': return GANZ.format(Math.round(v));
    case 'dezimal1': return DEZ1.format(v);
    case 'dezimal2': return DEZ2.format(v);
    case 'ganz': return GANZ.format(v);
    default: return String(v);
  }
}

// Vollständige Anzeige inkl. Einheit und ggf. Namensfeld (z. B. "Zugspitze: ca. 2.960 m").
// Gibt null zurück, wenn das Land keinen Wert hat.
export function formatValue(country, prop) {
  const v = country[prop.key];
  if (v === null || v === undefined || v === '') return null;
  if (prop.typ === 'text') return String(v);
  const zahl = (prop.vorsatz ?? '') + formatNumber(v, prop.rundung);
  const text = prop.einheit ? `${zahl} ${prop.einheit}` : zahl;
  const name = prop.namensfeld && country[prop.namensfeld];
  return name ? `${name}: ${text}` : text;
}
