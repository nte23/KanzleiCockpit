# KanzleiCockpit

Landing Page für **KanzleiCockpit** – das Finanz-Cockpit für moderne Patentanwaltskanzleien.
Aus Datev-Export wird Entscheidungsgrundlage.

## Deployment (GitHub Pages)

1. Repository → **Settings → Pages**
2. Source: `Deploy from a branch`
3. Branch: `main` (oder die Branch, auf der `index.html` liegt) · Folder: `/ (root)`
4. Speichern. Die Seite ist nach ein paar Sekunden unter `https://<user>.github.io/<repo>/` erreichbar.

Die Datei `.nojekyll` verhindert Jekyll-Verarbeitung – nötig, weil wir `assets/` direkt ausliefern.

## Lokal ansehen

Reichste, einfachste Variante:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Oder einfach `index.html` im Browser öffnen.

## Struktur

```
index.html         Eine HTML-Datei, alle Sektionen.
assets/app.js      ECharts-Charts, Tab-Logik, synthetische Demo-Daten.
.nojekyll          Disable GitHub-Pages-Jekyll-Pipeline.
```

Keine Build-Schritte. Tailwind und ECharts werden via CDN geladen.

## Hinweise

* Alle Daten in der Demo sind synthetisch und repräsentieren eine fiktive Kanzlei
  „Brenner & Voss Partner mbB".
* Die Weltkarte lädt GeoJSON von einem öffentlichen CDN – fällt sie aus, gibt es einen
  „Erneut versuchen"-Link.
