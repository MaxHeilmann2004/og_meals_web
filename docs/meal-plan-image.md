# Speiseplan-Bild: Konfiguration

`GET /api/meal-plan-image` liefert den reduzierten Speiseplan eines Tages als PNG. Dieses Dokument beschreibt alle Konfigurationsmöglichkeiten: Authentifizierung, Query-Parameter, Antwort-Header, Fehlercodes und die Einstellungen im Code.

## Inhalt

- [Authentifizierung](#authentifizierung)
- [Query-Parameter](#query-parameter)
- [Antwort](#antwort)
- [Fehlercodes](#fehlercodes)
- [Caching](#caching)
- [Logging und Diagnose](#logging-und-diagnose)
- [Einstellungen im Code](#einstellungen-im-code)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Beispiele](#beispiele)

## Authentifizierung

Der Endpunkt braucht einen gültigen Verifizierungscode. Er wird in dieser Reihenfolge gesucht, die erste Fundstelle gewinnt:

| Priorität | Quelle | Beispiel |
| --- | --- | --- |
| 1 | Header `x-verification-code` | `-H "x-verification-code: <code>"` |
| 2 | Query-Parameter `verification` | `?verification=<code>` |
| 3 | Cookie `og-meals-verification` | wird vom Browser automatisch mitgesendet |

Der Cookie erlaubt es, die URL direkt in einem bereits verifizierten Browser zu öffnen (praktisch zum Debuggen). Der Code wird beim Backend (`GET /verification`) geprüft. Der Code selbst wird nie geloggt, nur seine Quelle (`header`, `query`, `cookie`).

Der Parameter `verification` darf nur einmal angegeben werden (sonst 400).

## Query-Parameter

Alle Parameter sind optional.

| Parameter | Standard | Erlaubte Werte | Beschreibung |
| --- | --- | --- | --- |
| `date` | heute (Europe/Berlin) | `YYYY-MM-DD`, gültiges Datum | Tag des Speiseplans. Ohne Angabe wird der heutige Tag verwendet; Samstag und Sonntag springen auf den folgenden Montag. |
| `width` | `1300` | Ganzzahl `320` bis `2400` | Bildbreite in px (vor `scale`). Die Anzahl der Spalten richtet sich nach der Breite (siehe unten). |
| `scale` | `1` | Ganzzahl `1` bis `3` | Pixeldichte. Das Bild wird `scale`-mal so groß und dadurch schärfer, das Layout bleibt gleich. Breite 1300 mit `scale=2` ergibt 2600 px. |
| `textScale` | `1` | Zahl `0.5` bis `3` (Dezimalpunkt, auf 2 Stellen gerundet) | Textgröße. Skaliert alle Texte sowie die Bewertungssterne und Feature-Icons. Die Kartenhöhe wächst mit dem Text, Spaltenzahl und Kartenbreite bleiben gleich. |
| `theme` | `light` | `light`, `dark` | Farbschema. |
| `studentPrices` | aus | `1` = an, alles andere = aus | Zeigt zusätzlich den Studentenpreis (der reguläre Preis wird durchgestrichen). Gerichte ohne Studentenpreis zeigen nur den regulären Preis. |
| `transparent` | aus | `1` = an, alles andere = aus | Transparenter Hintergrund statt der Hintergrundfarbe des Themes. |
| `inline` | aus | `1` = an, alles andere = aus | Zeigt das Bild im Browser an (`Content-Disposition: inline`) statt es herunterzuladen (`attachment`). |
| `verification` | – | Verifizierungscode | Alternative zum Header, siehe [Authentifizierung](#authentifizierung). |

Ungültige Werte (außerhalb des Bereichs, keine Zahl, falsches Datum, unbekanntes Theme) ergeben `400`. Unbekannte Parameter werden ignoriert. Die Flags `studentPrices`, `transparent` und `inline` werden nur mit genau `1` aktiv. Bei `width` und `scale` werden Dezimalzahlen auf ganze Zahlen gerundet.

### Spalten und Breite

Das Raster bildet `repeat(auto-fill, minmax(400px, 1fr))` der Speiseplan-Seite nach, bei 16 px Seitenrand und 16 px Abstand. Die Spaltenzahl hängt nur von `width` ab, nicht von `scale` oder `textScale`:

| `width` | Spalten |
| --- | --- |
| 320 bis 847 | 1 |
| 848 bis 1263 | 2 |
| 1264 bis 1679 | 3 |
| 1680 bis 2095 | 4 |
| 2096 bis 2400 | 5 |

### Zusammenspiel von `scale` und `textScale`

- Mehr Pixel bei gleichem Layout: `scale` erhöhen.
- Größere Schrift bei gleicher Bildbreite: `textScale` erhöhen (das Bild wird entsprechend höher).
- Größere Schrift bei gleicher Optik: `width` und `textScale` gemeinsam anpassen, weil die Spaltenzahl von `width` abhängt.
- Hohe Werte (`width=2400`, `scale=3`) liefern sehr große Bilder und brauchen entsprechend länger.

## Antwort

Bei Erfolg: `200` mit dem PNG im Body.

| Header | Wert |
| --- | --- |
| `Content-Type` | `image/png` |
| `Content-Disposition` | `attachment; filename="speiseplan-<datum>.png"`, mit `inline=1` `inline; ...` |
| `Cache-Control` | `private, no-store` (der Browser cacht nicht; der Server cacht intern, siehe [Caching](#caching)) |
| `Server-Timing` | Dauer der einzelnen Schritte (`verification`, `page`, `images`, `satori`, `resvg`, ...) und `total`; sichtbar im Network-Tab der Browser-DevTools |
| `X-Meal-Plan-Image-Request` | Request-ID, passend zu den Log-Zeilen des Servers |

Das Bild enthält pro Kantine einen Abschnitt mit dem Kantinennamen und einer Karte pro Gericht (ein Bild pro Gericht). Kantinen ohne passende Gerichte werden weggelassen. Gibt es für den Tag gar keine Gerichte, zeigt das Bild den Hinweis „Keine Gerichte für diesen Tag verfügbar.“

## Fehlercodes

| Code | Ursache |
| --- | --- |
| `400` | Ungültiger Parameter, oder `verification` mehrfach angegeben |
| `401` | Kein Code angegeben oder das Backend lehnt den Code ab |
| `502` | Die Gerichte konnten nicht vom Backend geladen werden |
| `503` | Verifizierung ist auf dem Server nicht eingerichtet oder das Backend ist nicht erreichbar |
| `500` | Unerwarteter Fehler beim Rendern (Details im Server-Log über die Request-ID) |

## Caching

Gerenderte Bilder werden im Arbeitsspeicher des Servers gehalten. Parallele Anfragen mit denselben Parametern teilen sich einen einzigen Render-Vorgang.

| Einstellung | Wert | Ort |
| --- | --- | --- |
| Gültigkeit | 5 Minuten | `CACHE_TTL_MS` in `server/utils/mealPlanImage/render.ts` |
| Maximale Einträge | 24 (der älteste wird zuerst verdrängt) | `CACHE_MAX_ENTRIES` in `server/utils/mealPlanImage/render.ts` |
| Cache-Schlüssel | `date`, `width`, `scale`, `textScale`, `theme`, `studentPrices`, `transparent` | `cacheKey` in `server/utils/mealPlanImage/render.ts` |

`inline` und der Verifizierungscode gehören nicht zum Schlüssel. Wer ein frisch gerendertes Bild erzwingen will, ändert einen Parameter des Schlüssels geringfügig (z. B. `textScale=1.01`) oder wartet fünf Minuten. Der Cache geht beim Neustart des Servers verloren; der erste Render danach dauert länger, weil Module und Schriften geladen werden.

## Logging und Diagnose

Jede Anfrage bekommt eine kurze Request-ID. Der Server loggt mit dem Präfix `[meal-plan-image] <id>` unter anderem:

- Eingang der Anfrage und Quelle des Codes, Dauer der Verifizierung
- Start des Renders mit Parametern, Hinweis auf den ersten Render seit Serverstart und Cache-Status der Antwort (`hit`, `joined`, `miss`)
- Dauer der Backend-Anfrage und der SSR-Seite, Parsen, Schriften
- jedes Bild einzeln (Header, Download, Größenänderung, Größe) und eine Zusammenfassung
- Satori, resvg und die Gesamtdauer der Antwort

Bilder, die länger als 1 s brauchen, und fehlgeschlagene Bilder werden als Warnung geloggt. Ein Bild, das nicht geladen werden kann, wird durch den Platzhalter ersetzt, der Render schlägt dadurch nicht fehl.

## Einstellungen im Code

Diese Werte sind nicht per URL änderbar, sondern im Quelltext.

### Auswahl der Gerichte: `app/config/mealPlanImage.ts`

| Konstante | Aktuell | Bedeutung |
| --- | --- | --- |
| `MEAL_PLAN_IMAGE_CANTEEN_IDS` | `8` (Elbe), `2` (bonprix) | Kantinen-IDs, die im Bild erscheinen |
| `MEAL_PLAN_IMAGE_CATEGORIES` | Grill, The Original, F&T Vegan, Pasta, Pizza, Heimatküche, Vital, Live-Counter | Kategorien, die im Bild erscheinen |
| `MEAL_PLAN_IMAGE_DEFAULT_WIDTH` | `1300` | Standardbreite |
| `MEAL_PLAN_IMAGE_MIN_WIDTH` / `MEAL_PLAN_IMAGE_MAX_WIDTH` | `320` / `2400` | Grenzen für `width` |
| `MEAL_PLAN_IMAGE_MAX_SCALE` | `3` | Obergrenze für `scale` |
| `MEAL_PLAN_IMAGE_MIN_TEXT_SCALE` / `MEAL_PLAN_IMAGE_MAX_TEXT_SCALE` | `0.5` / `3` | Grenzen für `textScale` |

Kategorien werden über den normalisierten Namen verglichen (Groß-/Kleinschreibung, Umlaute und Sonderzeichen spielen keine Rolle), „F&T Vegan“ und „f t vegan“ sind also gleichwertig. Geprüft werden `category.unifiedName` und `category.name` des Gerichts. Die Gerichte eines Tages werden wie in der App gefiltert (ohne Filter) und nach Kategorie sortiert, die Kantinen stehen in der Reihenfolge der App. Pro Gericht wird das erste Bild verwendet; ohne Bild erscheint der Platzhalter „Kein Bild verfügbar“.

### Farben: `app/config/mealPlanImageTheme.ts`

Satori kann keine CSS-Variablen auflösen, deshalb sind die Farben der beiden Themes (`light`, `dark`) hier gespiegelt: `background`, `onSurface`, `onSurfaceVariant`, `primary` (Sterne), `surfaceContainerHighest` (Bildhintergrund) und `placeholderOverlay`. Ändern sich die Farben in `app/assets/css/theme.css`, müssen sie hier nachgezogen werden. Die Schriftfamilie steht in `MEAL_PLAN_IMAGE_FONT_FAMILY`.

### Layout: `app/utils/meal/imageLayout.ts`

| Konstante | Wert | Bedeutung |
| --- | --- | --- |
| `MEAL_PLAN_IMAGE_PADDING_X` | `16` px | Seitenrand |
| `MEAL_PLAN_IMAGE_GRID_GAP` | `16` px | Abstand zwischen den Karten |
| `MEAL_PLAN_IMAGE_CARD_MIN_WIDTH` | `400` px | Mindestbreite einer Karte; bestimmt die Spaltenzahl |
| `MEAL_PLAN_IMAGE_CARD_PADDING` | `12` px | Innenabstand der Karte |

Das Seitenverhältnis der Gerichtefotos ist 16:9.

### Schrift: `server/assets/fonts`

Outfit (OFL-Lizenz) in den Schnitten 400, 500 und 700 als `.woff`. Satori und resvg brauchen die Schrift als Datei, Systemschriften werden bewusst nicht geladen (das Scannen der Systemschriften kostete beim ersten Render mehrere Sekunden).

### Bilder: `server/utils/mealPlanImage/images.ts`

- Es werden nur Bilder von gleichem Ursprung geladen: Pfade unter `/api/backend/`, `/icons/`, `/ic_ai.svg` und `/meal_placeholder.webp`. Alles andere wird durch den Platzhalter ersetzt (Schutz vor SSRF).
- Alle Rasterbilder werden zu JPEG umkodiert und auf die benötigte Größe verkleinert (Satori kann kein WebP).
- Ab 1000 ms (`SLOW_ASSET_MS`) gilt ein Bild im Log als langsam.

### Interne Render-Seite: `nuxt.config.ts`

- Die Seite `/__image/meal-plan` rendert die Vue-Komponenten aus `app/components/meal-plan-image/`. Sie ist nur mit einem geheimen, pro Prozess zufällig erzeugten Header erreichbar (`server/middleware/meal-plan-image-guard.ts`), von außen antwortet sie mit 404.
- `/__image/**` wird mit `Cache-Control: private, no-store` ausgeliefert.
- `nitro.serverAssets` stellt das Verzeichnis `public` für den Renderer bereit, damit Icons ohne HTTP-Aufruf gelesen werden.

## Umgebungsvariablen

Der Endpunkt hat keine eigenen Umgebungsvariablen. Er verwendet die allgemeinen Einstellungen der App:

| Variable | Standard | Bedeutung |
| --- | --- | --- |
| `NUXT_PUBLIC_API_BASE_URL` | `https://3b-meals.mh-home.net` | Backend, bei dem der Code geprüft wird und von dem Gerichte und Bilder kommen |

## Beispiele

```bash
# Standard (heute, hell, 1300 px) als Download
curl -H "x-verification-code: <code>" -o speiseplan.png \
  "https://<host>/api/meal-plan-image"

# Bestimmter Tag, dunkel, doppelte Pixeldichte
curl -H "x-verification-code: <code>" -o speiseplan.png \
  "https://<host>/api/meal-plan-image?date=2026-10-19&theme=dark&scale=2"

# Breit mit 5 Spalten, größere Schrift, transparenter Hintergrund, Studentenpreise
curl -H "x-verification-code: <code>" -o speiseplan.png \
  "https://<host>/api/meal-plan-image?width=2400&textScale=1.4&transparent=1&studentPrices=1"

# Im Browser anzeigen (Cookie reicht, wenn man bereits verifiziert ist)
https://<host>/api/meal-plan-image?inline=1&textScale=1.25
```
