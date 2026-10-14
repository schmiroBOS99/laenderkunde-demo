// Farbe und Symbol je Eigenschaft. Unbekannte Eigenschaften bekommen reihum eine Farbe.
const FARBEN = ['blue', 'orange', 'yellow', 'pink', 'green', 'purple', 'teal', 'coral'];

const PROP = {
  hauptstadt: 'purple',
  einwohner: 'blue',
  flaeche: 'yellow',
  hoechster_punkt: 'teal',
  bip: 'orange',
  geburtenrate: 'pink',
  medianalter: 'purple',
  militaer: 'blue',
  glueck: 'yellow',
  mordrate: 'coral',
  wald: 'green',
  olympia: 'orange',
  reisepass: 'teal',
  korruption: 'coral',
  lebenserwartung: 'green',
  alkohol: 'orange',
  fluss: 'blue',
  kueste: 'teal',
  sprache: 'pink',
  religion: 'yellow',
  unesco: 'purple',
  touristen: 'pink',
  bip_kopf: 'green',
  temperatur: 'coral',
  fifa: 'green',
  niederschlag: 'blue',
  wohneigentum: 'orange',
};

// Eigenschaften nach Feld "gruppe" (Reihenfolge wie in properties.json): [[gruppe, [prop]]]
export function gruppiert(properties) {
  const m = new Map();
  for (const p of properties) {
    const g = p.gruppe ?? 'Sonstiges';
    if (!m.has(g)) m.set(g, []);
    m.get(g).push(p);
  }
  return [...m];
}

// Lernstand-Stufen (Reihenfolge von „am besten“ zu „neu“); Farben als --st-<key> in base.css.
export const STATUS = [
  ['gelernt', 'Gelernt'],
  ['gewusst', 'Gewusst'],
  ['nicht_gewusst', 'Nicht gewusst'],
  ['neu', 'Neu'],
];
export const statusFarbe = key => `--c: var(--st-${key}); --c-dark: var(--st-${key}-dark)`;

// CSS-Variablen für eine Farbe: --c (Fläche) und --c-dark (Kante/Schatten).
export const farbe = name => `--c: var(--${name}); --c-dark: var(--${name}-dark)`;

export function propFarbe(prop, index = 0) {
  return farbe(PROP[prop.key] ?? FARBEN[index % FARBEN.length]);
}
