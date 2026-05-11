# KanzleiCockpit · POC / UI-Mockup

Proof-of-Concept-Vorschau für ein Business-Dashboard für Kanzleien, das
**vollständig im Kanzlei-Netzwerk läuft** — ohne Cloud, ohne Internet-Verbindung,
optional anbindbar an lokale LLMs (Ollama, LM Studio, llama.cpp).

Diese Repository enthält ausschließlich ein UI-Mockup mit synthetischen Daten
zur internen Bewertung. Keine lauffähige Anwendung.

## Konzept

Eine kleine ausführbare Datei auf einer Kanzlei-Workstation. Liest 1× pro Monat
den Buchhaltungs-Export, schreibt eine lokale SQLite-Datenbank und serviert ein
Web-UI auf Port 8080, das aus dem Kanzlei-LAN erreichbar ist.

Garantien:

- Kein Outbound-Traffic
- Keine Telemetrie / keine Crash-Reports
- Keine externen API-Calls
- Keine Cloud-Abhängigkeit
- Updates ausschließlich über signierte Offline-Bundles
- LLM-Plugin im Standard deaktiviert; wenn aktiviert, ausschließlich gegen
  lokalen Endpunkt (z.&nbsp;B. `http://localhost:11434` für Ollama)

## Screens

Tour durch 14 geplante Screens (synthetische Daten, fiktive Kanzlei
„Brenner &amp; Voss Partner mbB"):

1. **Buchhaltungs-Import &amp; Konten-Mapping** — Wizard mit Quellen-Selektor (DATEV, Lexware, Addison, Stotax, SAP B1, Generic CSV).
2. **Executive Cockpit** — KPIs, 12-Mt-Trend, Top-Mandanten, Alerts.
3. **Kosten-Struktur** — Personal / Wachstums-Investment / Run / durchlaufende Posten.
4. **Abteilungs-Analyse** — Drilldown per Klick.
5. **Anwalts-Matrix** — Sankey, Top-Biller, Auslastung × Realization.
6. **Anwalts-Profil** — Stunden, Mandanten-Anteil, offene Akten.
7. **Mandanten-Liste** — sortier- &amp; filterbare Tabelle mit Sparklines.
8. **Mandanten-Detail** — 24-Mt-Trend, Soll/Haben, OPOS-Aging, Team, Akten.
9. **Geografische Verteilung** — Weltkarte + Länder-Ranking.
10. **Neuaufträge &amp; Pipeline** — Trend, Quelle, Funnel, heißeste Leads.
11. **Marketing &amp; Akquise-ROI** — Kanal-Attribution, Konferenz-ROI, Reise→Umsatz.
12. **Liquiditäts-Forecast 13 Wochen** — Bestand, Flows, kritische Wochen, Stresstest.
13. **Buchungs-Stream** — Live-Tabelle, Tagesfluss, OPOS-Aging.
14. **Briefing-Bibliothek** — 5 PDF-Vorlagen (Quartal · Mandanten-Onepager · Partner-Jahresgespräch · Bench-Report · Liquiditäts-Memo).

## Stack-Idee (für die spätere Anwendung)

| Schicht           | Vorschlag                                                          |
|-------------------|---------------------------------------------------------------------|
| Binary            | Go oder Rust — single-file, ~ 30 MB                                |
| Datenbank         | SQLite mit SQLCipher (lokal verschlüsselt)                         |
| Web-UI            | HTMX + Tailwind, embedded via Go `embed` / Rust `rust-embed`       |
| Charts            | ECharts (offline-Bundle eingebettet)                                |
| PDF-Engine        | Typst oder ChromeDP via Headless Chrome                            |
| LLM-Plugin        | OpenAI-kompatible API gegen Ollama/LM Studio (lokaler Endpunkt)    |
| Import-Parser     | pro Quelle (DATEV / Lexware / Addison / Stotax / SAP / CSV)        |
| Updates           | signierte Offline-Bundles, manuelle Installation                    |

Der Mockup selbst ist statisches HTML/JS und steht im Repo zum Anschauen.

## Deployment des Mockups (GitHub Pages)

1. **Settings → Pages** → Branch · Folder `/ (root)`
2. Erreichbar unter `https://<user>.github.io/<repo>/`

`.nojekyll` schaltet die Jekyll-Pipeline aus.

## Lokal anschauen

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Struktur

```
index.html         Hero · Architektur · 14-Screen-Tour
assets/app.js      ECharts, Tabellen-Logik, Briefing-Templates, Scrollspy
.nojekyll          GitHub-Pages-Konfig
```

Kein Build. Tailwind &amp; ECharts via CDN — beim Bauen der echten App werden
diese als Offline-Bundle eingebettet.
