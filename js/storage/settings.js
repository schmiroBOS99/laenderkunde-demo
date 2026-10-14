// Menü-Einstellungen in localStorage merken.
const KEY = 'einstellungen';

export const DEFAULTS = {
  eigenschaften: null,        // null = alle
  kontinente: null,           // null = alle
  nurUN: true,
  lernstand: ['neu', 'nicht_gewusst', 'gewusst', 'gelernt'],
  anzahl: 10,
};

export function loadSettings() {
  try {
    const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    // Version 1 kannte nur "gelernt" (= heute "gewusst"); beide Stufen übernehmen.
    if (!s.v2 && s.lernstand.includes('gelernt') && !s.lernstand.includes('gewusst')) {
      s.lernstand = [...s.lernstand, 'gewusst'];
    }
    return s;
  } catch {
    return { ...DEFAULTS };
  }
}

// Gewählte Eigenschaften; Eigenschaften, die beim Speichern noch unbekannt waren, sind automatisch gewählt.
// Ältere Einstellungen ohne "bekannt": alles Nicht-Gewählte gilt als neu (einmalig wieder angehakt).
export function selectedProps(settings, alleKeys) {
  if (!settings.eigenschaften) return alleKeys;
  const bekannt = settings.bekannt ?? settings.eigenschaften;
  return alleKeys.filter(k => settings.eigenschaften.includes(k) || !bekannt.includes(k));
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...settings, v2: true }));
  } catch { /* Speicher nicht verfügbar */ }
}
