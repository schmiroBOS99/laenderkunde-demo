// Zuletzt abgefragte Länder (neueste zuerst), damit neue Runden zuerst andere Länder zeigen.
const KEY = 'verlauf';
const MAX = 500;

export function loadVerlauf() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function merkeVerlauf(iso3s) {
  const neu = [...iso3s, ...loadVerlauf().filter(x => !iso3s.includes(x))].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(neu));
  } catch { /* Speicher nicht verfügbar */ }
}
