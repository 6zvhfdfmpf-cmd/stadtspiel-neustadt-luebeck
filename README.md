# StadtSpiel – Wettbewerb zur Stadtplanung in Neustadt in Holstein

**Für die Klassen 8 bis 10**  
Wer plant Neustadt in Holstein am besten? Die Schüler:innen werden zu Stadtplaner:innen, sammeln Punkte für eine ausgewogene Stadt – und die Besten kommen eine Runde weiter.

## Idee

Neustadt in Holstein liegt an der Lübecker Bucht: rund 16.000 Einwohner, historische Altstadt, Hafen und Ostsee. In 13 Situationen von 2026 bis 2040 entscheidest du über Wohnraum, Klima, Verkehr, Tourismus und Denkmalschutz. Die Karte, die Stadtkasse und das Leben vor Ort verändern sich.

Die Inhalte sind an echte Themen angelehnt (unter anderem Hafenwestseite, Wärmeplanung, Gestaltungssatzung, Ferienwohnungen, Hochwasserschutz). Sie sind vereinfacht und ersetzen keine amtliche Planung.

## Spielen (am Computer)

Öffne **[index.html](index.html)** im Browser, am besten auf einem Laptop oder PC. Maus und Tastatur: Tasten **1, 2 oder 3** wählen eine Option, **Enter** bestätigt.

Für eine gewertete Runde brauchst du:

1. Deinen Namen und deine Klasse (z. B. 8a oder 10b)
2. Den **Rundencode** von der Lehrkraft (damit alle dieselben Ereignisse erleben)
3. Einen Durchlauf – auf demselben Rechner zählt nur der erste Versuch

Am Ende bekommst du einen **Wertungs-Code** (mit QR-Code) für die Lehrkraft.

Ohne Rundencode ist das Spiel eine Übung und zählt nicht.

## So entstehen die Punkte (0–100)

1. **Grundwert:** Durchschnitt aus Wohnen, Grün & Klima und Wirtschaft
2. **Abzug für Ungleichgewicht:** Wenn bester und schwächster Wert mehr als 20 Punkte auseinanderliegen: (Abstand − 20) × 0,45
3. **Abzug für Krise:** Jeder Bereich unter 35 kostet extra Punkte, unter 20 noch einmal
4. **Kasse:** Abzug bei Schulden (höchstens 18), kleiner Bonus bei einem Polster (höchstens 8)

Die genaue Rechnung steht am Ende jeder Runde. Eine einseitige Stadt kann hinter einer ausgewogeneren landen. Die Auswertungsseite berechnet die Punkte aus dem Spielverlauf neu; eine geänderte Zahl im Code wird erkannt.

## Auswertung für Lehrkräfte

Auf **[lehrkraefte.html](lehrkraefte.html)**:

1. Rundencode erzeugen und an die Klasse geben
2. Wertungs-Codes einsammeln (einfügen oder CSV/Textdatei laden)
3. Rangliste insgesamt und pro Klasse sehen
4. Die ersten *N* Plätze (einstellbar) werden mit „kommt eine Runde weiter“ markiert – wahlweise je Klasse oder in der Gesamtrangliste
5. Bei Punktgleichheit zählt zuerst der geringere Abstand der drei Werte, dann die höhere Kasse; unentschiedene Plätze kommen gemeinsam weiter, wenn der Platz in der Grenze liegt
6. Rangliste als CSV speichern oder drucken

Es gibt keinen Server. Codes und Rangliste bleiben im Browser.

## Technik

- Reines HTML, CSS und JavaScript, für Computer und Laptops gestaltet (Handy bleibt bedienbar)
- Keine API-Schlüssel, keine externen Dienste
- Optional als PWA speicherbar
- Schriftarten laden bei Verbindung nach, Systemschriften greifen als Fallback
- Open Source (MIT), anpassbar in `js/data.js`

---

**Zielgruppe:** Lehrkräfte und Schüler:innen der Klassen 8 bis 10  
**Status:** Wettbewerbsprototyp, Schwerpunkt Neustadt in Holstein, Zeitraum 2026–2040
