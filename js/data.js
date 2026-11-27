/* StadtSpiel – Daten. Vereinfacht für den Unterricht, Stand 2026, keine amtliche Planung. */
window.STADTSPIEL = {
  city: "Neustadt in Holstein",
  years: { start: 2026, end: 2040 },
  difficulties: {
    leicht: {
      label: "Leicht",
      hint: "Mehr Spielraum, mildere Zufallsereignisse.",
      startStats: { wohnen: 55, gruen: 55, wirtschaft: 55 },
      budget: 120,
      eventChance: 0.22,
      eventScale: 0.7
    },
    standard: {
      label: "Standard",
      hint: "Ausgewogene Herausforderung für den Unterricht.",
      startStats: { wohnen: 50, gruen: 50, wirtschaft: 50 },
      budget: 90,
      eventChance: 0.38,
      eventScale: 1
    },
    schwer: {
      label: "Anspruchsvoll",
      hint: "Engere Kasse und deutlichere Folgen.",
      startStats: { wohnen: 50, gruen: 50, wirtschaft: 50 },
      budget: 65,
      eventChance: 0.52,
      eventScale: 1.25
    }
  },
  intro: {
    kicker: "Serious Game zur Stadtplanung",
    title: "Du planst Neustadt in Holstein",
    lead: "Rund 16.000 Menschen leben hier an der Lübecker Bucht – zwischen historischer Altstadt, Hafen und Ostsee.",
    body: "Von 2026 bis 2040 entscheidest du an echten Orten der Stadt. Jede Wahl verändert die Karte, die Stadtkasse und die Werte Wohnen, Grün & Klima und Wirtschaft. Achte auf die Balance – und auf überraschende Ereignisse wie Sturmflut oder Fördergeld."
  },
  terms: {
    staedtebaufoerderung: {
      name: "Städtebauförderung",
      text: "Geld von Bund und Land, mit dem Städte Quartiere erneuern können – zum Beispiel Straßen, Plätze oder den Hafen."
    },
    gestaltungssatzung: {
      name: "Gestaltungssatzung",
      text: "Eine städtische Regel, die festlegt, wie Gebäude in einem Gebiet aussehen dürfen. In der Altstadt soll so das historische Bild geschützt werden."
    },
    waermeplanung: {
      name: "Wärmeplanung",
      text: "Ein Plan der Stadt, wie Häuser künftig klimafreundlich geheizt werden sollen – etwa durch Wärmenetze statt vieler einzelner Heizungen."
    },
    waermenetz: {
      name: "Wärmenetz",
      text: "Leitungen, die Wärme zentral erzeugen und an viele Gebäude verteilen, ähnlich wie bei Strom oder Wasser."
    },
    ferienwohnung: {
      name: "Ferienwohnung",
      text: "Eine Wohnung, die vor allem an Urlaubsgäste vermietet wird und dann nicht als dauerhafter Wohnsitz zur Verfügung steht."
    },
    bebauungsplan: {
      name: "Bebauungsplan",
      text: "Ein verbindlicher Plan der Stadt, der festlegt, was in einem Gebiet gebaut und wie Flächen genutzt werden dürfen."
    },
    hochwasserschutz: {
      name: "Hochwasserschutz",
      text: "Maßnahmen wie Wälle, Mauern oder Dünen, die Orte vor Sturmflut und hohem Wasser schützen sollen."
    },
    nachverdichtung: {
      name: "Nachverdichtung",
      text: "Zusätzlicher Wohnraum in schon bebauten Gebieten, zum Beispiel durch Aufstockung oder das Schließen von Baulücken."
    },
    entsiegelung: {
      name: "Entsiegelung",
      text: "Das Entfernen von Asphalt oder Pflaster, damit Regen versickern kann und mehr Grün wächst."
    },
    zoeb: {
      name: "ZOB",
      text: "Zentraler Omnibusbahnhof: der wichtige Umsteigepunkt für Busse, in Neustadt am erneuerten Bahnhofsumfeld."
    },
    oepnv: {
      name: "ÖPNV",
      text: "Öffentlicher Personennahverkehr: Bus und Bahn für den Alltag, ohne eigenes Auto."
    }
  },
  personas: [
    { id: "lea", name: "Lea", role: "Schülerin" },
    { id: "joris", name: "Joris", role: "Fischer" },
    { id: "mona", name: "Mona", role: "Hotelierin" },
    { id: "helga", name: "Helga", role: "Rentnerin" },
    { id: "tariq", name: "Tariq", role: "Familienvater" },
    { id: "britta", name: "Britta", role: "Einzelhändlerin" },
    { id: "nils", name: "Nils", role: "Stadtwerke" }
  ],
  scenarios: [
    {
      id: "hafenwestseite",
      year: 2026,
      place: "hafen",
      placeLabel: "Hafenwestseite",
      title: "Hafenwestseite neu denken",
      text: "Auf der Hafenwestseite entsteht ein neues Quartier – mit {staedtebaufoerderung}, Promenade und einer besseren Verbindung von Bahnhof, Hafen und Innenstadt. Historische Elemente wie Kaimauern sollen bleiben. Was hat für dich Vorrang?",
      options: [
        {
          label: "Wohnen, Kultur und Tourismus mischen",
          desc: "Ein lebendiges Quartier – mit mehr Verkehr und weniger Freifläche.",
          w: 12, g: -7, wi: 9, cost: 7,
          flags: { hafen: "mix" },
          feedback: "Das Quartier wird belebt und bietet neuen Wohnraum. Gleichzeitig steigen Verkehr und Nutzungsdruck.",
          voice: { id: "mona", text: "Gäste wollen am Wasser übernachten – aber bitte nicht zu voll." }
        },
        {
          label: "Promenade und Freiflächen in den Mittelpunkt",
          desc: "Hohe Aufenthaltsqualität, aber weniger neuer Wohnraum.",
          w: -7, g: 16, wi: 2, cost: 6,
          flags: { hafen: "green" },
          feedback: "Hafen und Ostseeblick werden zum öffentlichen Ort. Neuer dauerhafter Wohnraum entsteht aber nur wenig.",
          voice: { id: "helga", text: "Endlich Platz zum Luftholen am Hafen. Das tut der Stadt gut." }
        },
        {
          label: "Maritime Betriebe und Hafenarbeit sichern",
          desc: "Arbeitsplätze am Wasser, weniger Wohn- und Grünfläche.",
          w: -11, g: -11, wi: 18, cost: 4,
          flags: { hafen: "industry" },
          feedback: "Die Wirtschaft am Hafen bleibt stark. Wohnen und Grün müssen zurückstehen.",
          voice: { id: "joris", text: "Solange wir hier noch arbeiten können, bleibt der Hafen ein Hafen." }
        }
      ]
    },
    {
      id: "altstadt",
      year: 2027,
      place: "altstadt",
      placeLabel: "Altstadt",
      title: "Altstadt und Gestaltungssatzung",
      text: "Die {gestaltungssatzung} legt fest, wie Gebäude in der Altstadt aussehen dürfen. Typisch sind Backstein, der große Markt und die Stadtkirche. Zugleich wird diskutiert, Solaranlagen besser zu ermöglichen, und es fehlt Wohnraum.",
      options: [
        {
          label: "Sehr streng am historischen Bild festhalten",
          desc: "Das Stadtbild bleibt einheitlich – Vorhaben werden schwieriger.",
          w: -5, g: -7, wi: -5, cost: 4,
          flags: { altstadt: "strict" },
          feedback: "Das historische Bild bleibt klar erkennbar. Dafür wird es schwerer, Wohnraum zu schaffen und Dächer für Solarenergie zu nutzen.",
          voice: { id: "helga", text: "Wenn die Altstadt sich zu stark verändert, erkennt man sie bald nicht mehr." }
        },
        {
          label: "Kompromiss: Solar integrieren, maßvoll ergänzen",
          desc: "Schutz des Stadtbildes, aber nicht um jeden Preis.",
          w: 5, g: 9, wi: 4, cost: 4,
          flags: { altstadt: "solar" },
          feedback: "Solaranlagen und behutsame Ergänzungen werden möglich, wenn sie sich einfügen. Die Konflikte bleiben überschaubar.",
          voice: { id: "nils", text: "Wenn die Dächer mitmachen, kommen wir dem Klimaziel näher." }
        },
        {
          label: "Mehr Wohnraum, lockerere Gestaltung",
          desc: "Schneller neuer Wohnraum – das Stadtbild verändert sich.",
          w: 14, g: -5, wi: 7, cost: 5,
          flags: { altstadt: "loose" },
          feedback: "Es entsteht spürbar mehr Wohnraum. Das gewohnte Bild der Altstadt gerät unter Druck.",
          voice: { id: "tariq", text: "Wir brauchen Wohnungen – nicht nur schöne Fassaden." }
        }
      ]
    },
    {
      id: "waerme",
      year: 2028,
      place: "hafen",
      placeLabel: "Wärmenetz am Hafen",
      title: "Wärmeplanung und Klimaziel 2035",
      text: "Neustadt will bis 2035 klimaneutral werden. Seit 2024 gibt es eine kommunale {waermeplanung}. Am Hafen nutzt eine Meerwasser-Wärmepumpe die Ostsee für ein {waermenetz}. Wie soll die Wärmeversorgung weitergehen?",
      options: [
        {
          label: "Wärmenetze in bestehenden Quartieren ausbauen",
          desc: "Wirksam fürs Klima, teuer und langsam.",
          w: 2, g: 16, wi: -10, cost: 11,
          flags: { heat: "strong" },
          feedback: "Viele Haushalte könnten perspektivisch klimafreundlich heizen. Das belastet die Kasse spürbar.",
          voice: { id: "nils", text: "Teuer jetzt – aber 2035 merkt man, ob wir investiert haben." }
        },
        {
          label: "Hafenquartier als Vorbild, anderswo offen bleiben",
          desc: "Ein starkes Leuchtturmprojekt, ungleicher Fortschritt.",
          w: 2, g: 7, wi: 5, cost: 5,
          flags: { heat: "medium" },
          feedback: "Das neue Quartier zeigt, was möglich ist. Im Bestand bleibt der Fortschritt ungleich.",
          voice: { id: "britta", text: "Am Hafen glänzt es – in meiner Straße bleibt die alte Heizung." }
        },
        {
          label: "Vor allem auf private Investitionen setzen",
          desc: "Günstiger für den Haushalt, unsicherer Effekt.",
          w: 5, g: -6, wi: 11, cost: 3,
          flags: { heat: "weak" },
          feedback: "Die Stadt spart kurzfristig Geld. Ob das Klimaziel erreicht wird, ist unsicher.",
          voice: { id: "tariq", text: "Nicht jede Familie kann sich eine neue Heizung einfach so leisten." }
        }
      ]
    },
    {
      id: "wohnen-tourismus",
      year: 2029,
      place: "wohnen",
      placeLabel: "Nähe Altstadt und Hafen",
      title: "Wohnen oder Ferienwohnungen?",
      text: "Nahe Altstadt und Hafen ist Wohnraum begehrt. Manche Eigentümer möchten {ferienwohnung}en an Gäste vermieten. Die Stadt kann das mit einem {bebauungsplan} steuern, damit dauerhaftes Wohnen nicht verdrängt wird.",
      options: [
        {
          label: "Dauerhaftes Wohnen klar absichern",
          desc: "Weniger Verdrängung, weniger touristische Betten.",
          w: 16, g: 2, wi: -11, cost: 3,
          flags: { holiday: "restricted" },
          feedback: "Menschen, die hier leben und arbeiten, finden eher eine Wohnung. Der Tourismus verliert Betten.",
          voice: { id: "tariq", text: "Endlich eine Chance, dass Wohnungen Wohnungen bleiben." }
        },
        {
          label: "Steuern: nur in bestimmten Lagen zulassen",
          desc: "Ein Mittelweg zwischen Wohnen und Gästen.",
          w: 7, g: 0, wi: 6, cost: 3,
          flags: { holiday: "balanced" },
          feedback: "In Wohnstraßen bleibt der Alltag geschützt, in geeigneten Lagen bleiben Gäste willkommen.",
          voice: { id: "britta", text: "Ein paar Gäste sind gut fürs Geschäft – aber nicht in jeder zweiten Wohnung." }
        },
        {
          label: "Tourismus und Ferienwohnungen ausweiten",
          desc: "Mehr Gäste und Umsatz – Wohnraum wird knapper.",
          w: -14, g: -5, wi: 16, cost: 4,
          flags: { holiday: "open" },
          feedback: "Vermietung und Einzelhandel profitieren. Für dauerhaftes Wohnen wird es enger.",
          voice: { id: "mona", text: "Die Saison trägt uns – ohne Betten bleibt das Hotel allein." }
        }
      ]
    },
    {
      id: "verkehr",
      year: 2030,
      place: "verkehr",
      placeLabel: "Innenstadt und Promenade",
      title: "Verkehr in Innenstadt und an der Promenade",
      text: "In der Innenstadt und an der Promenade in Pelzerhaken teilen sich Fußgänger, Rad und Autos den Raum. Mehr Gäste bedeuten mehr Bewegung – Anwohner wünschen sich Sicherheit, Händler gute Erreichbarkeit.",
      options: [
        {
          label: "Fußwege stärken und Autos zurücknehmen",
          desc: "Mehr Sicherheit und Aufenthalt, Kritik von Autofahrenden.",
          w: 5, g: 13, wi: -7, cost: 6,
          flags: { traffic: "walk" },
          feedback: "Zu Fuß und mit dem Rad wird es angenehmer. Manche Gäste und Händler fürchten um die Erreichbarkeit.",
          voice: { id: "lea", text: "Mit dem Rad zur Schule fühlt sich das sofort sicherer an." }
        },
        {
          label: "Parken am Rand, Bus und Rad verbessern",
          desc: "Ein Kompromiss mit Aufwand und Umstellung.",
          w: 4, g: 7, wi: 2, cost: 6,
          flags: { traffic: "transit" },
          feedback: "Die Innenstadt wird ruhiger, ohne das Auto ganz zu verbannen. Der Nutzen entsteht nur, wenn die Anschlüsse stimmen.",
          voice: { id: "britta", text: "Wenn die Gäste trotzdem herkommen, ist mir der Kompromiss recht." }
        },
        {
          label: "Autoverkehr und Parkplätze weitgehend erhalten",
          desc: "Bequem fürs Auto, eng für Fuß und Klima.",
          w: -4, g: -11, wi: 8, cost: 3,
          flags: { traffic: "cars" },
          feedback: "Händler und Autogäste bleiben gewohnt erreichbar. Lärm und Abgase bleiben.",
          voice: { id: "mona", text: "Viele Gäste kommen nun einmal mit dem Auto – das darf man nicht vergessen." }
        }
      ]
    },
    {
      id: "hochwasser",
      year: 2031,
      place: "pelzerhaken",
      placeLabel: "Pelzerhaken",
      title: "Schutz vor Sturmflut",
      text: "Die Ostseeküste ist bei Sturmfluten gefährdet, besonders tiefer liegende Bereiche wie in Pelzerhaken. {hochwasserschutz} ist teuer und greift in die Landschaft ein. Zugleich braucht die ganze Stadt Vorsorge.",
      options: [
        {
          label: "Zügig technische Schutzanlagen bauen",
          desc: "Schneller Schutz, starker Eingriff ins Küstenbild.",
          w: 9, g: -9, wi: 4, cost: 12,
          flags: { flood: "hard" },
          feedback: "Wohnen und Betriebe hinter dem Schutz sind sicherer. Wälle oder Mauern verändern Strand und Landschaft deutlich.",
          voice: { id: "helga", text: "Ich will nachts ruhig schlafen, wenn der Wind von der Ostsee kommt." }
        },
        {
          label: "Naturnah schützen und die ganze Stadt mitdenken",
          desc: "Rücksicht auf Küste und Ortsteile, langsamer und teurer.",
          w: 4, g: 13, wi: -7, cost: 10,
          flags: { flood: "nature" },
          feedback: "Dünen, Grün und Vorsorge in mehreren Ortsteilen werden mitgedacht. Der Schutz braucht Zeit.",
          voice: { id: "lea", text: "Wenn die Dünen bleiben, bleibt auch das, was Neustadt besonders macht." }
        },
        {
          label: "Nur das Nötigste, Kosten sparen",
          desc: "Entlastet den Haushalt, erhöht das Risiko.",
          w: -12, g: -11, wi: 9, cost: 4,
          flags: { flood: "minimal" },
          feedback: "Kurzfristig bleibt mehr Geld für anderes. Bei der nächsten schweren Sturmflut wäre die Stadt stärker gefährdet.",
          voice: { id: "joris", text: "Das Meer holt sich, was man ihm nicht zutraut. Das habe ich schon gesehen." }
        }
      ]
    },
    {
      id: "wohnungsdruck",
      year: 2032,
      place: "stadtrand",
      placeLabel: "Stadtrand und Innenentwicklung",
      title: "Wo soll neuer Wohnraum entstehen?",
      text: "Es fehlen bezahlbare Wohnungen. Eine Möglichkeit ist Bauen am Stadtrand, eine andere die {nachverdichtung} in schon bebauten Quartieren. Beides hat Folgen für Natur, Verkehr und Nachbarschaft.",
      options: [
        {
          label: "Neues Wohnquartier am Stadtrand",
          desc: "Viel Wohnraum in kurzer Zeit, hoher Flächenverbrauch.",
          w: 18, g: -16, wi: 7, cost: 8,
          flags: { housing: "sprawl" },
          feedback: "Es entsteht rasch viel Wohnraum. Dafür gehen Flächen verloren, und der Verkehr muss nach außen mitwachsen.",
          voice: { id: "tariq", text: "Ein Haus mit Garten klingt gut – wenn der Bus dann auch noch fährt." }
        },
        {
          label: "Innenentwicklung und Aufstockung",
          desc: "Sparsamer mit Fläche, dafür Konflikte im Bestand.",
          w: 9, g: 7, wi: -2, cost: 6,
          flags: { housing: "infill" },
          feedback: "Die Stadt wächst nach innen und schont die Landschaft. In bestehenden Quartieren kann es Streit geben.",
          voice: { id: "helga", text: "Wenn über uns aufgestockt wird, will ich wenigstens mitreden dürfen." }
        },
        {
          label: "Geförderten Wohnungsbau gezielt stärken",
          desc: "Mehr bezahlbare Wohnungen, abhängig von Förderung.",
          w: 13, g: 2, wi: -7, cost: 9,
          flags: { housing: "social" },
          feedback: "Menschen mit kleinerem Einkommen haben bessere Chancen auf eine Wohnung. Die Kasse wird stärker gebraucht.",
          voice: { id: "lea", text: "Meine große Schwester sucht schon ewig etwas Bezahlbares." }
        }
      ]
    },
    {
      id: "uferweg",
      year: 2033,
      place: "ufer",
      placeLabel: "Ufer zwischen Stadt und Pelzerhaken",
      title: "Der Weg an der Küste",
      text: "Über die Wiederherstellung des Uferwanderwegs zwischen Neustadt und Pelzerhaken wurde in der Stadt bereits beraten. Der Weg verbindet Stadt, Natur und Strand – kostet Pflege und kann empfindliche Uferbereiche berühren.",
      options: [
        {
          label: "Weg naturnah wiederherstellen",
          desc: "Gute Verbindung, Rücksicht auf das Ufer.",
          w: 3, g: 12, wi: 3, cost: 6,
          flags: { path: "nature" },
          feedback: "Stadt und Strand rücken zusammen, ohne das Ufer stark zu verbauen. Pflege und Rücksicht bleiben Daueraufgaben.",
          voice: { id: "lea", text: "Zur Schule am Wasser entlang – das wäre das Beste." }
        },
        {
          label: "Touristisch ausbauen mit Steg und Rastplätzen",
          desc: "Mehr Gäste und Aufenthalt, stärkerer Eingriff.",
          w: 1, g: -6, wi: 12, cost: 8,
          flags: { path: "touristic" },
          feedback: "Der Weg wird zur Attraktion. Die Natur am Ufer und ruhige Abschnitte geraten unter Druck.",
          voice: { id: "mona", text: "Ein schöner Küstenweg ist Gold wert für unsere Gäste." }
        },
        {
          label: "Nur das Nötigste instand halten",
          desc: "Spart Geld, die Verbindung bleibt lückenhaft.",
          w: -2, g: -3, wi: 4, cost: 3,
          flags: { path: "minimal" },
          feedback: "Die Kasse wird geschont. Der Weg bleibt unvollständig, und manche Abschnitte sind weiter schwer nutzbar.",
          voice: { id: "joris", text: "Hauptsache, das Ufer wird nicht zubetoniert." }
        }
      ]
    },
    {
      id: "strand",
      year: 2034,
      place: "strand",
      placeLabel: "Strand Pelzerhaken",
      title: "Strand, Dünen und Gäste",
      text: "Pelzerhaken und Rettin sind wichtige Strandorte an der Lübecker Bucht. Mehr Tourismus bringt Einnahmen, kann aber Dünen, Wege und den Alltag vor Ort belasten.",
      options: [
        {
          label: "Dünen und naturnahen Strand schützen",
          desc: "Starke Natur, weniger neue touristische Angebote.",
          w: 2, g: 15, wi: -8, cost: 4,
          flags: { beach: "nature" },
          feedback: "Dünen und Küste bleiben widerstandsfähiger. Manche Betriebe entgehen Einnahmen in der Hochsaison.",
          voice: { id: "lea", text: "Der Strand soll nicht aussehen wie ein Parkplatz." }
        },
        {
          label: "Behutsam ausbauen, klare Regeln für die Saison",
          desc: "Ein Mittelweg zwischen Erholung und Schutz.",
          w: 3, g: 5, wi: 6, cost: 5,
          flags: { beach: "balanced" },
          feedback: "Gäste bleiben willkommen, sensible Bereiche werden klarer geschützt. Organisation und Kontrolle kosten Zeit.",
          voice: { id: "helga", text: "Solange man noch in Ruhe ans Wasser kommt, bin ich zufrieden." }
        },
        {
          label: "Tourismus am Strand deutlich ausweiten",
          desc: "Mehr Umsatz, mehr Druck auf Natur und Wege.",
          w: -6, g: -12, wi: 16, cost: 6,
          flags: { beach: "busy" },
          feedback: "Die Saison wird stärker, Läden und Vermietung profitieren. Dünen, Ruhe und Alltagswege leiden.",
          voice: { id: "mona", text: "Ein voller Sommer trägt uns durch den Winter." }
        }
      ]
    },
    {
      id: "hitze",
      year: 2035,
      place: "gruen",
      placeLabel: "Stadtgrün",
      title: "Hitzesommer und Stadtgrün",
      text: "Das Klimaziel 2035 steht im Kalender. Neustadt pflanzt bereits versuchsweise sogenannte Klimabäume und rechnet mit mehr Hitzetagen. {entsiegelung} und Schatten kosten Fläche und Geld, helfen aber im Sommer.",
      special: "klima2035",
      options: [
        {
          label: "Entsiegeln, viele Bäume, schattige Orte",
          desc: "Wirksam gegen Hitze, braucht Fläche und Pflege.",
          w: 4, g: 16, wi: -6, cost: 8,
          flags: { trees: "high" },
          feedback: "Straßen und Plätze werden kühler und grüner. Parkplätze und manche Stellflächen müssen weichen.",
          voice: { id: "helga", text: "Im Schatten einer Allee komme ich auch im Juli noch zum Markt." }
        },
        {
          label: "Klimabäume weiter pflanzen, maßvoll umbauen",
          desc: "Stetiger Fortschritt ohne großen Eingriff.",
          w: 2, g: 8, wi: 1, cost: 4,
          flags: { trees: "mid" },
          feedback: "Das Grün wächst weiter, ohne die Stadt umzukrempeln. Für extreme Hitzesommer reicht das möglicherweise nicht.",
          voice: { id: "nils", text: "Jeder Baum zählt – aber 2035 kommt schneller, als man denkt." }
        },
        {
          label: "Flächen vor allem für Nutzung und Parken behalten",
          desc: "Bequem im Alltag, schwach bei Hitze.",
          w: -3, g: -10, wi: 7, cost: 2,
          flags: { trees: "low" },
          feedback: "Viel bleibt, wie es ist. An heißen Tagen fehlen Schatten und kühle Orte, besonders für ältere Menschen.",
          voice: { id: "britta", text: "Meine Kundschaft will vor der Tür parken – Bäume allein kaufen nichts." }
        }
      ]
    },
    {
      id: "bahnhof",
      year: 2036,
      place: "bahnhof",
      placeLabel: "Bahnhof",
      title: "Bahnhof, Bus und Region",
      text: "Das Bahnhofsumfeld wurde bereits erneuert, unter anderem mit einem neuen {zoeb}. Die Verbindung in die Region und der Alltag ohne Auto bleiben ein Thema – für Schule, Arbeit und Gäste.",
      options: [
        {
          label: "{oepnv} und Radwege deutlich ausbauen",
          desc: "Starke Alternative zum Auto, hohe Kosten.",
          w: 6, g: 12, wi: -5, cost: 9,
          flags: { transit: "strong" },
          feedback: "Schule, Arbeit und Ausflüge ohne Auto werden realistischer. Das bindet auf Jahre Mittel im Haushalt.",
          voice: { id: "lea", text: "Wenn der Anschluss sitzt, brauche ich nach Lübeck kein Elterntaxi." }
        },
        {
          label: "Park-and-Ride und bessere Anschlüsse",
          desc: "Auto und Bus werden verknüpft.",
          w: 3, g: 6, wi: 4, cost: 6,
          flags: { transit: "mid" },
          feedback: "Wer von außen kommt, kann umsteigen. In der Fläche bleibt das Auto trotzdem wichtig.",
          voice: { id: "tariq", text: "Ein Parkplatz am Bahnhof plus ein verlässlicher Bus – das würde uns helfen." }
        },
        {
          label: "Parkangebot und Autobund im Vordergrund",
          desc: "Bequem für Autofahrende, schwach fürs Klima.",
          w: -2, g: -8, wi: 8, cost: 4,
          flags: { transit: "weak" },
          feedback: "Anreise mit dem Auto bleibt einfach. Wer auf Bus und Rad angewiesen ist, gewinnt wenig.",
          voice: { id: "mona", text: "Unsere Gäste fragen zuerst: Wo kann ich parken?" }
        }
      ]
    },
    {
      id: "einzelhandel",
      year: 2037,
      place: "markt",
      placeLabel: "Markt und Innenstadt",
      title: "Läden in der Innenstadt",
      text: "Die Altstadt soll als Ort zum Wohnen, Begegnen und Einkaufen lebendig bleiben. Gleichzeitig können große Angebote am Stadtrand Kunden abziehen – ein typischer Konflikt kleiner Städte.",
      options: [
        {
          label: "Innenstadt stärken: Aufenthalt und Vielfalt",
          desc: "Mehr Leben am Markt, weniger Fokus auf die grüne Wiese.",
          w: 5, g: 4, wi: 5, cost: 6,
          flags: { retail: "center" },
          feedback: "Der Markt bleibt Treffpunkt. Das braucht Geduld, Pflege der Innenstadt und Mitwirkung der Läden.",
          voice: { id: "britta", text: "Wenn die Menschen gerne hier sind, bleibt auch das Geschäft." }
        },
        {
          label: "Innenstadt und Randstandorte nebeneinander steuern",
          desc: "Ein Kompromiss mit geteilter Kaufkraft.",
          w: 2, g: -2, wi: 7, cost: 4,
          flags: { retail: "mix" },
          feedback: "Es gibt beides: den Markt und Angebote am Rand. Die Innenstadt muss sich trotzdem anstrengen.",
          voice: { id: "tariq", text: "Manchmal brauche ich den großen Markt – und trotzdem den Laden um die Ecke." }
        },
        {
          label: "Große Standorte am Rand erleichtern",
          desc: "Bequemes Einkaufen, Risiko für den Markt.",
          w: -3, g: -8, wi: 12, cost: 3,
          flags: { retail: "edge" },
          feedback: "Einkaufen wird für viele bequemer. In der Altstadt drohen Leerstand und weniger Alltagsleben.",
          voice: { id: "helga", text: "Wenn die Läden am Markt schließen, wird die Stadt still." }
        }
      ]
    },
    {
      id: "jugend",
      year: 2038,
      place: "jugend",
      placeLabel: "Treffpunkte in der Stadt",
      title: "Orte für junge Menschen",
      text: "Junge Menschen brauchen Orte zum Treffen, für Freizeit und Beteiligung. In einer Stadt mit starkem Tourismus konkurrieren Flächen oft mit Gästen, Parkplätzen und anderen Nutzungen.",
      options: [
        {
          label: "Feste Treffpunkte und echte Mitbestimmung",
          desc: "Starke Angebote, bindet Fläche und Geld.",
          w: 8, g: 3, wi: -4, cost: 7,
          flags: { youth: "strong" },
          feedback: "Jugendliche bekommen sichtbare Orte und eine Stimme in der Planung. Andere Nutzungen müssen teilen.",
          voice: { id: "lea", text: "Wir wollen nicht nur Gäste bedienen – wir leben hier das ganze Jahr." }
        },
        {
          label: "Bestehende Räume besser nutzen und öffnen",
          desc: "Pragmatisch, weniger sichtbar.",
          w: 4, g: 1, wi: 2, cost: 3,
          flags: { youth: "mid" },
          feedback: "Schulen, Vereine und vorhandene Räume werden stärker geteilt. Ein eigener, sichtbarer Ort fehlt weiter.",
          voice: { id: "tariq", text: "Hauptsache, die Kinder haben nachmittags einen Platz, der nicht nur der Markt ist." }
        },
        {
          label: "Keine zusätzlichen Flächen, Fokus auf die Saison",
          desc: "Spart Ressourcen, enttäuscht viele Jugendliche.",
          w: -6, g: -1, wi: 8, cost: 2,
          flags: { youth: "weak" },
          feedback: "Die Kasse und der Tourismus werden geschont. Für junge Einwohner bleibt wenig Verbindliches.",
          voice: { id: "lea", text: "Dann hängen wir wieder am Parkplatz. Super, danke." }
        }
      ]
    }
  ],
  events: [
    {
      id: "sturmflut",
      title: "Sturmflut an der Ostsee",
      text: "Eine schwere Sturmflut trifft die Lübecker Bucht. Wie gut Neustadt damit umgeht, hängt stark vom bisherigen Hochwasserschutz ab.",
      afterYear: 2031,
      weight: 2,
      prefer: { flood: ["minimal", "hard", "nature"] },
      effectsBy: {
        flood: {
          hard: { w: -3, g: -4, wi: -3, cost: 3, note: "Die Schutzanlagen halten viel ab, Schäden bleiben begrenzt." },
          nature: { w: -6, g: -5, wi: -5, cost: 4, note: "Dünen und Vorsorge dämpfen die Lage, einige Uferabschnitte leiden trotzdem." },
          minimal: { w: -14, g: -10, wi: -10, cost: 8, note: "Ohne kräftigen Schutz sind Wohnen, Wege und Betriebe schwer getroffen." },
          default: { w: -8, g: -7, wi: -6, cost: 5, note: "Die Stadt kommt mit dem Schrecken davon – aber nicht ohne Schäden." }
        }
      },
      weather: "storm"
    },
    {
      id: "hitzesommer",
      title: "Hitzesommer",
      text: "Wochen mit hohen Temperaturen legen den Alltag offen: Wer findet Schatten, wer leidet unter versiegelten Plätzen?",
      afterYear: 2028,
      weight: 1.4,
      effectsBy: {
        trees: {
          high: { w: -1, g: 2, wi: -2, cost: 2, note: "Bäume und entsiegelte Orte machen die Hitze erträglicher." },
          mid: { w: -3, g: -2, wi: -3, cost: 3, note: "Es gibt Schatten, aber an großen Plätzen wird es trotzdem hart." },
          low: { w: -8, g: -8, wi: -4, cost: 3, note: "Ohne Grün wird der Sommer zur Belastung, besonders für ältere Menschen." },
          default: { w: -4, g: -4, wi: -3, cost: 3, note: "Die Stadt spürt die Hitze, aber nicht überall gleich." }
        }
      },
      weather: "heat"
    },
    {
      id: "foerdergeld",
      title: "Förderzusage",
      text: "Ein Förderprogramm für Klimaschutz und Stadterneuerung wird ausgeschrieben. Vorarbeiten können die Chancen verbessern.",
      afterYear: 2027,
      weight: 1.1,
      effects: { w: 0, g: 3, wi: 2, cost: -14, note: "Zusätzliche Mittel entlasten die Kasse und machen das nächste Vorhaben leichter." },
      bonusIf: { heat: "strong", trees: "high", gMin: 70 },
      weather: "fair"
    },
    {
      id: "tourismusboom",
      title: "Starke Sommersaison",
      text: "Ungewöhnlich viele Gäste kommen an die Lübecker Bucht. Das belebt die Kasse – und den Wohnungsmarkt.",
      afterYear: 2029,
      weight: 1.2,
      effectsBy: {
        holiday: {
          open: { w: -8, g: -3, wi: 12, cost: -8, note: "Die Betten sind voll, dauerhaftes Wohnen wird noch knapper." },
          balanced: { w: -3, g: -1, wi: 7, cost: -5, note: "Die Stadt profitiert, ohne völlig aus dem Takt zu geraten." },
          restricted: { w: 0, g: 0, wi: 4, cost: -2, note: "Weniger Betten bedeuten ein kleineres Plus, der Alltag bleibt stabiler." },
          default: { w: -2, g: -1, wi: 6, cost: -4, note: "Die Saison trägt die örtliche Wirtschaft." }
        }
      },
      weather: "fair"
    },
    {
      id: "baukosten",
      title: "Baukosten steigen",
      text: "Material und Fachkräfte werden teurer. Geplante Vorhaben holen weniger aus demselben Budget.",
      afterYear: 2027,
      weight: 1,
      effects: { w: -2, g: 0, wi: -3, cost: 6, note: "Die Kasse schrumpft, ohne dass schon etwas Neues fertig ist." },
      weather: "fair"
    },
    {
      id: "engagement",
      title: "Bürgerwerkstatt",
      text: "Viele Einwohner kommen zu einer Werkstatt und wollen bei der nächsten Planung mitreden.",
      afterYear: 2028,
      weight: 0.8,
      effects: { w: 2, g: 1, wi: 1, cost: 3, note: "Beteiligung kostet Zeit, schafft aber Rückhalt für spätere Entscheidungen." },
      weather: "fair"
    }
  ],
  reflections: [
    "Welcher Zielkonflikt ist dir am deutlichsten geworden – und warum?",
    "Welche Gruppe in der Stadt trägt die Folgen deiner Planung besonders?",
    "Was würdest du in einer Situation anders entscheiden, wenn du noch einmal spielen würdest?"
  ]
};
