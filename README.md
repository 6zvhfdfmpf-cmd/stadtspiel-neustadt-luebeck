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

1. Wähle eine Schwierigkeit und schau dir die stilisierte Karte an
2. Bearbeite 13 Planungssituationen von 2026 bis 2038
3. Sieh, wie Gebäude, Bäume, Wege oder Schutzanlagen auf der Karte erscheinen
4. Reagiere auf Ereignisse wie Sturmflut, Hitzesommer oder Fördergeld
5. Höre kurze Stimmen aus der Stadt und achte auf die Kasse
6. Erhalte 2040 eine Auswertung mit Zielkonflikten, Auszeichnungen und Reflexionsfragen

Der Spielstand wird automatisch im Browser gespeichert. Ton ist standardmäßig aus (kann eingeschaltet werden). Die Zusammenfassung lässt sich drucken.

## Für Schulen

- Open Source (MIT)
- Drei Schwierigkeitsgrade, Lexikon, Reflexionsfragen, Hinweise für Lehrkräfte
- Anpassbar (Szenarien und Ereignisse in `js/data.js`)
- Gut geeignet für Politik, Geografie, Wirtschaft oder Projektwochen

## Technik

- Reines HTML, CSS und JavaScript (kein Framework)
- Mobil zuerst gestaltet
- Keine API-Schlüssel, keine externen Kartendienste
- Optional als PWA speicherbar, mit Service Worker für Offline-Dateien
- Schriftarten laden bei vorhandener Verbindung nach, Systemschriften greifen als Fallback

## Nächste Schritte (Ideen)

- Klassenmodus / Gruppenwertung
- Export als PDF-Datei
- Weitere Ortsteile oder Vergleich mit einer zweiten Stadt

---

**Zielgruppe:** Schulleitung, Lehrkräfte und Schüler:innen  
**Status:** Erweiterter Prototyp, Schwerpunkt Neustadt in Holstein, Zeitraum 2026–2040
