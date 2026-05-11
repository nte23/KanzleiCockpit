# KanzleiCockpit · UI Preview

Statische UI-Vorschau für KanzleiCockpit. 14 Feature-Screens
nacheinander, jeder mit kurzer Erklärung darüber. Keine Marketing-Page.

## Screens

1. **Buchhaltungs-Import &amp; Konten-Mapping** — Wizard mit Quellen-Selektor (DATEV, Lexware, Addison, Stotax, SAP B1, Generic CSV).
2. **Executive Cockpit** — KPIs, 12-Mt-Trend, Top-Mandanten, Alerts.
3. **Kosten-Struktur** — Personal / Wachstums-Investment (Marketing, Reisen, Fortbildung) / Run (Raum, IT, Versich., AfA) / durchlaufende Posten.
4. **Abteilungs-Analyse** — Drilldown per Klick.
5. **Anwalts-Matrix** — Sankey, Top-Biller, Auslastung×Realization.
6. **Anwalts-Profil** — Stunden, Mandanten-Anteil, offene Akten.
7. **Mandanten-Liste** — sortier- &amp; filterbare Tabelle mit Sparkline-Trends.
8. **Mandanten-Detail** — 24-Mt-Trend, Soll/Haben, OPOS-Aging, Team, Akten.
9. **Geografische Verteilung** — Weltkarte + Länder-Ranking.
10. **Neuaufträge &amp; Pipeline** — Trend, Quelle, Funnel, heißeste Leads.
11. **Marketing &amp; Akquise-ROI** — Kanal-Attribution, Konferenz-ROI, Reise→Umsatz-Korrelation.
12. **Liquiditäts-Forecast 13 Wochen** — Bestandsverlauf, wöchentliche Flows, kritische Wochen, Stresstest.
13. **Buchungs-Stream** — Live-Tabelle, Tagesfluss, OPOS-Aging.
14. **Briefing-Bibliothek** — 5 PDF-Vorlagen (Quartals-Briefing, Mandanten-Onepager, Partner-Jahresgespräch, Bench-Report, Liquiditäts-Memo) — klickbar wechseln.

## Was geht aus der Buchhaltung allein, was nicht

**Drin (alles oben):** Umsatz/Kosten-Analyse, Mandanten- und Anwalts-Profitabilität,
Sankey-Stundenflüsse, OPOS-Aging, Marketing-/Reise-ROI, 13-Wochen-Liquidität,
automatische Briefings.

**Mit zusätzlicher Datenquelle möglich:** Frist-Management (IPMS / Aktenverwaltung),
Conflict-Check (Mandantenverwaltung), Pitch-Tracking (CRM), Time-to-Cash auf
Akten-Ebene (Zeiterfassung), automatische Mandanten-Korrespondenz-Volumen
(Outlook/Gmail).

**Nicht aus der Buchhaltung:** Mandantenzufriedenheit, Skill-Matrix, Wissensstand
der Anwälte — separate Erhebung nötig.

## Deployment (GitHub Pages)

1. Repository → **Settings → Pages**
2. Source: `Deploy from a branch`
3. Branch · Folder `/ (root)`
4. Erreichbar unter `https://<user>.github.io/<repo>/`

`.nojekyll` schaltet die Jekyll-Pipeline aus.

## Lokal

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Struktur

```
index.html         14 Sections, gemeinsame Theme.
assets/app.js      ECharts-Charts, Tabellen-Logik, Briefing-Templates, Scrollspy.
.nojekyll          GitHub-Pages-Konfig.
```

Kein Build. Tailwind &amp; ECharts via CDN.

## Hinweise

* Daten sind synthetisch (fiktive Kanzlei „Brenner &amp; Voss Partner mbB").
* Weltkarten-GeoJSON wird zur Laufzeit von einem Public CDN geladen
  — schlägt der Abruf fehl, gibt es einen „Erneut versuchen"-Link.
* Jede Section ist auf ~700 px Höhe optimiert und passt komfortabel
  auf einen Standard-Bildschirm.
