// Lernstand pro Land × Eigenschaft in localStorage. Key: "ISO3|propKey".
const KEY = 'lernstand';

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch { /* Speicher nicht verfügbar */ }
}

// Ab so vielen richtigen Antworten in Folge gilt eine Karte als gelernt.
export const GELERNT_AB = 3;

// Richtige Antworten in Folge; ältere Einträge ohne "serie": 1 bei zuletzt gewusst, sonst 0.
const serieOf = e => e.serie ?? (e.letztes === 'gewusst' ? 1 : 0);

// "neu" | "nicht_gewusst" | "gewusst" | "gelernt"
export function statusOf(progress, iso3, propKey) {
  const e = progress[`${iso3}|${propKey}`];
  if (!e || !e.gefragt) return 'neu';
  if (e.letztes !== 'gewusst') return 'nicht_gewusst';
  return serieOf(e) >= GELERNT_AB ? 'gelernt' : 'gewusst';
}

export function recordAnswer(iso3, propKey, gewusst) {
  const progress = loadProgress();
  const k = `${iso3}|${propKey}`;
  const e = progress[k] ?? { gefragt: 0, gewusst: 0, nicht_gewusst: 0 };
  e.serie_vorher = serieOf(e);   // für reviseAnswer
  e.serie = gewusst ? e.serie_vorher + 1 : 0;
  e.gefragt += 1;
  e[gewusst ? 'gewusst' : 'nicht_gewusst'] += 1;
  e.letztes = gewusst ? 'gewusst' : 'nicht_gewusst';
  e.ts = Date.now();
  progress[k] = e;
  saveProgress(progress);
}

// Korrigiert die zuletzt gespeicherte Antwort (gefragt bleibt gleich).
export function reviseAnswer(iso3, propKey, gewusst) {
  const progress = loadProgress();
  const e = progress[`${iso3}|${propKey}`];
  const neu = gewusst ? 'gewusst' : 'nicht_gewusst';
  if (!e || e.letztes === neu) return;
  e[e.letztes] = Math.max(0, e[e.letztes] - 1);
  e[neu] += 1;
  e.letztes = neu;
  e.serie = gewusst ? (e.serie_vorher ?? 0) + 1 : 0;
  e.ts = Date.now();
  saveProgress(progress);
}

export function exportProgress() {
  return JSON.stringify({ app: 'laender-lernapp', version: 1, exportiert: new Date().toISOString(), lernstand: loadProgress() }, null, 2);
}

const valid = e => e && typeof e === 'object'
  && Number.isFinite(e.gefragt) && Number.isFinite(e.gewusst) && Number.isFinite(e.nicht_gewusst)
  && ['gewusst', 'nicht_gewusst'].includes(e.letztes) && Number.isFinite(e.ts)
  && (e.serie === undefined || Number.isFinite(e.serie));

// Führt einen Export mit dem aktuellen Stand zusammen; pro Key gewinnt der neuere Eintrag.
// Liefert die Anzahl übernommener Einträge; wirft bei ungültiger Datei.
export function importProgress(text) {
  const data = JSON.parse(text);
  const incoming = data?.lernstand;
  if (!incoming || typeof incoming !== 'object') throw new Error('Keine Lernstand-Datei');
  const progress = loadProgress();
  let n = 0;
  for (const [k, e] of Object.entries(incoming)) {
    if (!/^[A-Z0-9]{3}\|\w+$/.test(k) || !valid(e)) continue;
    if (!progress[k] || progress[k].ts < e.ts) { progress[k] = e; n += 1; }
  }
  saveProgress(progress);
  return n;
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignorieren */ }
}
