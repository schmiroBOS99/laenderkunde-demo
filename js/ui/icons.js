// Einfache Linien-Symbole (24×24, Farbe über currentColor).
const PFADE = {
  karten: '<rect x="3" y="7" width="13" height="14" rx="2"/><path d="M7 3h11a2 2 0 0 1 2 2v12"/>',
  globus: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  diagramm: '<path d="M3 21h18M6 17v-5M11 17V6M16 17v-8M21 17v-3"/>',
  zufall: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  wiederholen: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  export: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  import: '<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>',
  loeschen: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  einstellungen: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  hauptstadt: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  unesco: '<path d="M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M2 10l10-6 10 6z"/>',
  reisepass: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
  korruption: '<path d="M12 3v18M8 21h8M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
  lebenserwartung: '<path d="M3 12h4l2-4 3 8 2-4h7"/>',
  alkohol: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8"/>',
  fluss: '<path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/>',
  kueste: '<circle cx="17" cy="7" r="3"/><path d="M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 20c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/>',
  sprache: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  religion: '<circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  touristen: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
  einwohner: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>',
  flaeche: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7v4M10 7v3M14 7v4M18 7v3"/>',
  hoechster_punkt: '<path d="M2 20 9 7l4 7 3-4 6 10z"/>',
  bip: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  geburtenrate: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  medianalter: '<path d="M6 3h12M6 21h12M7 3c0 4 5 6 5 9s-5 5-5 9M17 3c0 4-5 6-5 9s5 5 5 9"/>',
  militaer: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  glueck: '<circle cx="12" cy="12" r="9"/><path d="M8 14a5 5 0 0 0 8 0M9 9.5h.01M15 9.5h.01"/>',
  mordrate: '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
  wald: '<path d="M12 2 5 12h4l-3 5h12l-3-5h4zM12 17v5"/>',
  olympia: '<circle cx="12" cy="15" r="6"/><path d="M8 3l4 6 4-6M12 13v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  niederschlag: '<path d="M7 14a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.3 3.3 0 0 1 17 14z"/><path d="M8 17.5l-1 2.5M12.5 17.5l-1 2.5M17 17.5l-1 2.5"/>',
  wohneigentum: '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>',
  bip_kopf: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M12 13.5v4M10.5 15.5h3"/>',
  temperatur: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  fifa: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10zM12 7V3M16 10l4-1M14.5 14.5l2.5 3.5M9.5 14.5 7 18M8 10 4 9"/>',
  pfeil: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  staatsoberhaupt: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/><path d="M5 19h14"/>',
  regierungschef: '<circle cx="12" cy="6.5" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/><path d="M12 13.5l-1.3 2 1.3 4 1.3-4z"/>',
  ja: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  nein: '<path d="M6 6l12 12M18 6 6 18"/>',
  punkt: '<circle cx="12" cy="12" r="4"/>',
};

export function icon(name, cls = 'icon') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = PFADE[name] ?? PFADE.punkt;
  return svg;
}
