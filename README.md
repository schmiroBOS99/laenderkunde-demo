# Länderkunde Lernapp (Demo)

Prototyp einer Lernplattform für Länderstatistiken: Karteikarten, Schätzfragen und eine Weltkarte, die den Lernfortschritt zeigt. Läuft komplett im Browser, ohne Backend und ohne Build-Schritt.

## Was die App kann

- **Karteikarten** zu 197 Ländern mit 29 Eigenschaften, zum Beispiel Hauptstadt, Einwohner, Fläche, Lebenserwartung, BIP, FIFA-Rang oder UNESCO-Welterbe.
- **Schätzfragen** für Zahlenwerte und Ranglisten. Eine Schätzung gilt als richtig, wenn sie innerhalb einer Toleranz liegt (relativ zum wahren Wert, mit einer Mindesttoleranz). Eingaben im deutschen Format wie `1.430` oder `84,5` werden verstanden.
- **Weltkarte** (D3) mit dem Lernstand je Land.
- **Lernstand-Seite** mit dem Fortschritt je Land und Eigenschaft.
- **Filter** nach Kontinent, Eigenschaften, UN-Mitgliedschaft und Lernstand.

## Lernlogik

- Jede Kombination aus Land und Eigenschaft hat einen Status: `neu`, `nicht gewusst`, `gewusst` oder `gelernt`.
- Nach drei richtigen Antworten in Folge gilt eine Karte als gelernt, eine falsche Antwort setzt die Serie zurück.
- Bei der Auswahl kommen zuerst Länder, die noch nie abgefragt wurden, danach die, die am längsten nicht dran waren. So rotiert die App über mehrere Runden durch alle Länder.
- Der Lernstand liegt im `localStorage` des Browsers, es werden keine Daten an einen Server geschickt.

## Starten

Die App nutzt ES-Module und muss deshalb über einen kleinen Webserver geöffnet werden, nicht per Doppelklick auf `index.html`:

```bash
git clone https://github.com/schmiroBOS99/laenderkunde-demo.git
cd laenderkunde-demo
python3 -m http.server 8000
```

Danach `http://localhost:8000` im Browser öffnen. Die Seiten werden über den URL-Hash gewechselt (`#/`, `#/lernen`, `#/karte`, `#/lernstand`).

## Aufbau

```
index.html          Einstieg
data/               countries.json (Länderwerte), properties.json (Eigenschaften, Quellen, Schätz-Konfiguration)
js/main.js          Start, Routing über den URL-Hash
js/data/            Daten laden, Auswahl, Rangberechnung, Schätzlogik
js/storage/         Lernstand, Einstellungen, Verlauf (localStorage)
js/ui/              Oberfläche: Spiel, Karte, Menü, Lernstand, Schätzkarte
css/                Gestaltung
lib/                D3, topojson-client, Kartendaten, Schrift (lokal eingebunden)
assets/flags/       Flaggen
```

## Stand und Grenzen

Dies ist ein Prototyp. Es gibt keine Benutzerkonten, der Lernstand gilt nur für den jeweiligen Browser, und die Daten sind ein fester Stand (Datenjahr und Quelle je Eigenschaft in `properties.json`). Die Seite ist als `noindex` markiert und nicht zur Indexierung durch Suchmaschinen gedacht.

## Daten und Lizenzen

Daten: Weltbank (CC BY 4.0), Our World in Data (CC BY 4.0), Wikidata (CC0), UNESCO, CIA World Factbook,
Passport Index Dataset (MIT), FIFA, Wikipedia (CC BY-SA). Flaggen: flag-icons (MIT). Schrift: Nunito (OFL).
Karte: world-atlas / Natural Earth. Bibliotheken: D3, topojson-client (ISC).
