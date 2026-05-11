# KanzleiCockpit · UI Preview

Statische UI-Vorschau für KanzleiCockpit. Zeigt 11 Feature-Screens
nacheinander, jeder mit kurzer Erklärung darüber. Keine Marketing-Page.

## Screens

1. **Datev-Import & Mapping** — Wizard mit Sachkonten-Zuordnung, Parser-Status.
2. **Executive Cockpit** — KPIs, 12-Mt-Trend, Alerts.
3. **Abteilungs-Analyse** — Umsatz vs. Kosten, Stunden, Drilldown per Klick.
4. **Anwalts-Matrix** — Sankey Associate→Partner, Top-Biller, Auslastung×Realization.
5. **Anwalts-Profil** — Stunden, Mandanten-Anteil, offene Akten.
6. **Mandanten-Liste** — Sortier- &amp; filterbare Tabelle mit Sparkline-Trends.
7. **Mandanten-Detail** — 24-Mt-Trend, Soll/Haben, OPOS-Aging, Team, Akten.
8. **Geografische Verteilung** — Weltkarte mit YoY-Farbcodierung, Länder-Ranking.
9. **Neuaufträge & Pipeline** — Trend, Quelle, Funnel, heißeste Leads.
10. **Buchungs-Stream** — Live-Buchungssatz-Tabelle, Tagesfluss, OPOS-Aging.
11. **Quartals-Briefing** — PDF-Vorlagen-Vorschau (Cover + Innenseite).

## Deployment (GitHub Pages)

1. Repository → **Settings → Pages**
2. Source: `Deploy from a branch`
3. Branch der `index.html` enthält · Folder `/ (root)`
4. Erreichbar unter `https://<user>.github.io/<repo>/`.

`.nojekyll` schaltet die Jekyll-Pipeline aus, sonst würde `assets/` ggf. ignoriert.

## Lokal

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Struktur

```
index.html         11 Sections, gemeinsame Theme.
assets/app.js      ECharts-Charts, Tabellen-Logik, Scrollspy.
.nojekyll          GitHub-Pages-Konfig.
```

Keine Build-Schritte. Tailwind &amp; ECharts via CDN.

## Hinweise

* Daten sind synthetisch (fiktive Kanzlei „Brenner & Voss Partner mbB").
* Weltkarten-GeoJSON wird zur Laufzeit von einem Public CDN geladen
  — schlägt der Abruf fehl, gibt es einen „Erneut versuchen"-Link.
