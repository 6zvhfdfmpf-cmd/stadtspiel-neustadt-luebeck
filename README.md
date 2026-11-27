# StadtSpiel – Stadtplanung in Neustadt in Holstein

**Prototyp für Schulen**  
Stadtplanung spielerisch begreifen am Beispiel von **Neustadt in Holstein**.

## Idee

Neustadt in Holstein liegt an der Lübecker Bucht: rund 16.000 Einwohner, historische Altstadt, Hafen und Ostsee. In diesem Serious Game werden Schüler:innen zu Stadtplaner:innen. Zwischen **2026 und 2040** treffen sie an echten Orten der Stadt Entscheidungen zu Wohnraum, Klima, Verkehr, Tourismus und Denkmalschutz – und sehen, wie sich die Karte, die Stadtkasse und das Leben vor Ort verändern.

Die Situationen sind an reale Themen angelehnt (unter anderem Hafenwestseite, Wärmeplanung, Gestaltungssatzung, Ferienwohnungen, Hochwasserschutz und den Uferweg nach Pelzerhaken). Die Inhalte sind vereinfacht und für den Unterricht aufbereitet; sie ersetzen keine amtliche Planung.

## Spielen

Öffne **[index.html](index.html)** im Browser. Das Spiel ist eine statische Website und läuft auf dem Handy.

Zusätzlich gibt es eine Seite für den Unterricht: **[lehrkraefte.html](lehrkraefte.html)**.

## Was du im Spiel tust

1. Wähle eine Schwierigkeit (optional einen Klassencode eingeben) und schau dir die stilisierte Karte an
2. Ein kurzes Tutorial erklärt Karte, Orte und Werte
3. Spiele 13 Situationen in vier Kapiteln von 2026 bis 2038 – die Karte nimmt den Bildschirm ein und lässt sich vergrößern, zoomen und verschieben
4. Sieh, wie Gebäude, Bäume, Wege, Schiffe oder Schutzanlagen erscheinen
5. Reagiere auf Ereignisse wie Sturmflut, Hitzesommer oder Fördergeld
6. Höre unterschiedliche Stimmen aus der Stadt und achte auf die Kasse
7. Erhalte 2040 eine Auswertung mit Zeitraffer der Karte, Zielkonflikten, Auszeichnungen, Reflexionsfragen, QR-Code und einem Bild zum Speichern

Der Spielstand wird automatisch im Browser gespeichert. Ton ist standardmäßig aus. Es gibt einen Dunkelmodus.

## Klassenmodus

Lehrkräfte erzeugen auf der [Lehrkräfte-Seite](lehrkraefte.html) einen kurzen **Klassencode**. Alle Schüler:innen geben denselben Code beim Start ein und erleben dieselben Zufallsereignisse.

Am Ende entsteht ein **Ergebniscode** (und ein QR-Code, lokal im Browser). Den Code kann die Lehrkraft auf derselben Seite einfügen: Die Klasse wird verglichen, ohne dass Daten an einen Server gehen.

## Für Schulen

- Open Source (MIT)
- Drei Schwierigkeitsgrade, Lexikon, Reflexionsfragen, Hinweise für Lehrkräfte
- Klassenvergleich, Ergebnisbild (PNG) und Druckansicht
- Anpassbar (Szenarien und Ereignisse in `js/data.js`)
- Gut geeignet für Politik, Geografie, Wirtschaft oder Projektwochen

## Technik

- Reines HTML, CSS und JavaScript (kein Framework)
- Mobil zuerst gestaltet
- Keine API-Schlüssel, keine externen Kartendienste, kein Server für Codes oder Export
- Optional als PWA speicherbar, mit Service Worker für Offline-Dateien
- Schriftarten laden bei vorhandener Verbindung nach, Systemschriften greifen als Fallback

---

**Zielgruppe:** Schulleitung, Lehrkräfte und Schüler:innen  
**Status:** Erweiterter Prototyp, Schwerpunkt Neustadt in Holstein, Zeitraum 2026–2040
