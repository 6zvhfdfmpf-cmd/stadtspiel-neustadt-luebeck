/* Szenarien für StadtSpiel – Neustadt in Holstein.
   Angaben sind vereinfacht und für den Unterricht aufbereitet (Stand 2026).
   Sie ersetzen keine amtliche Planung. */
window.STADTSPIEL = {
  city: "Neustadt in Holstein",
  startStats: { wohnen: 50, gruen: 50, wirtschaft: 50 },
  intro: {
    kicker: "Serious Game zur Stadtplanung",
    title: "Du planst Neustadt in Holstein",
    lead: "Rund 16.000 Menschen leben hier an der Lübecker Bucht – zwischen historischer Altstadt, Hafen und Ostsee.",
    body: "In sieben Situationen, angelehnt an echte Themen der Stadt, triffst du Entscheidungen. Jede Wahl verändert die Werte Wohnen, Grün & Klima und Wirtschaft. Achte auf die Balance: Was dem einen Bereich hilft, kann einem anderen schaden."
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
    }
  },
  scenarios: [
    {
      id: "hafenwestseite",
      title: "Hafenwestseite neu denken",
      text: "Auf der Hafenwestseite entsteht ein neues Quartier – mit {staedtebaufoerderung}, Promenade und einer besseren Verbindung von Bahnhof, Hafen und Innenstadt. Historische Elemente wie Kaimauern sollen bleiben. Was hat für dich Vorrang?",
      options: [
        {
          label: "Wohnen, Kultur und Tourismus mischen",
          desc: "Ein lebendiges Quartier – mit mehr Verkehr und weniger Freifläche.",
          w: 14, g: -8, wi: 10,
          feedback: "Das Quartier wird belebt und bietet neuen Wohnraum. Gleichzeitig steigen Verkehr und Nutzungsdruck, und für Grün bleibt weniger Fläche."
        },
        {
          label: "Promenade und Freiflächen in den Mittelpunkt",
          desc: "Hohe Aufenthaltsqualität, aber weniger neuer Wohnraum.",
          w: -8, g: 18, wi: 2,
          feedback: "Hafen und Ostseeblick werden zum öffentlichen Ort. Das hilft Klima und Aufenthalt – neuer dauerhafter Wohnraum entsteht aber nur wenig."
        },
        {
          label: "Maritime Betriebe und Hafenarbeit sichern",
          desc: "Arbeitsplätze am Wasser, weniger Wohn- und Grünfläche.",
          w: -12, g: -12, wi: 20,
          feedback: "Die Wirtschaft am Hafen bleibt stark. Wohnen und Grün müssen zurückstehen, und Konflikte zwischen Betrieb und Nachbarschaft werden wahrscheinlicher."
        }
      ]
    },
    {
      id: "altstadt",
      title: "Altstadt und Gestaltungssatzung",
      text: "Die {gestaltungssatzung} legt fest, wie Gebäude in der Altstadt aussehen dürfen. Typisch sind Backstein, der große Markt und die Stadtkirche. Zugleich wird diskutiert, Solaranlagen besser zu ermöglichen, und es fehlt Wohnraum. Ein Vorhaben in der Altstadt steht an.",
      options: [
        {
          label: "Sehr streng am historischen Bild festhalten",
          desc: "Das Stadtbild bleibt einheitlich – Vorhaben werden schwieriger.",
          w: -6, g: -8, wi: -6,
          feedback: "Das historische Bild bleibt klar erkennbar. Dafür wird es schwerer, Wohnraum zu schaffen und Dächer für Solarenergie zu nutzen."
        },
        {
          label: "Kompromiss: Solar integrieren, maßvoll ergänzen",
          desc: "Schutz des Stadtbildes, aber nicht um jeden Preis.",
          w: 6, g: 10, wi: 4,
          feedback: "Solaranlagen und behutsame Ergänzungen werden möglich, wenn sie sich einfügen. Kein Bereich macht einen großen Sprung, aber die Konflikte bleiben überschaubar."
        },
        {
          label: "Mehr Wohnraum, lockerere Gestaltung",
          desc: "Schneller neuer Wohnraum – das Stadtbild verändert sich.",
          w: 16, g: -6, wi: 8,
          feedback: "Es entsteht spürbar mehr Wohnraum, und Investitionen fließen. Das gewohnte Bild der Altstadt und Spielräume für Grün auf den Grundstücken geraten unter Druck."
        }
      ]
    },
    {
      id: "waerme",
      title: "Wärmeplanung und Klimaziel 2035",
      text: "Neustadt will bis 2035 klimaneutral werden. Seit 2024 gibt es eine kommunale {waermeplanung}. Am Hafen nutzt eine Meerwasser-Wärmepumpe die Ostsee für ein {waermenetz}. Wie soll die Wärmeversorgung in der Stadt weitergehen?",
      options: [
        {
          label: "Wärmenetze in bestehenden Quartieren ausbauen",
          desc: "Wirksam fürs Klima, teuer und langsam.",
          w: 2, g: 18, wi: -12,
          feedback: "Viele Haushalte könnten perspektivisch klimafreundlich heizen. Die Stadt und die Stadtwerke müssen aber viel investieren, und es dauert, bis alle angeschlossen sind."
        },
        {
          label: "Hafenquartier als Vorbild, anderswo offen bleiben",
          desc: "Ein starkes Leuchtturmprojekt, ungleicher Fortschritt.",
          w: 2, g: 8, wi: 6,
          feedback: "Das neue Quartier zeigt, was möglich ist. Im Bestand bleibt der Fortschritt aber ungleich, und das Klimaziel 2035 wird schwerer erreichbar."
        },
        {
          label: "Vor allem auf private Investitionen setzen",
          desc: "Günstiger für den Haushalt, unsicherer Effekt.",
          w: 6, g: -6, wi: 12,
          feedback: "Die Stadt spart kurzfristig Geld, und Eigentümer entscheiden selbst. Ob das Klimaziel erreicht wird, ist unsicher – besonders in älteren Wohnquartieren."
        }
      ]
    },
    {
      id: "wohnen-tourismus",
      title: "Wohnen oder Ferienwohnungen?",
      text: "Nahe Altstadt und Hafen ist Wohnraum begehrt. Manche Eigentümer möchten {ferienwohnung}en an Gäste vermieten. Die Stadt kann das mit einem {bebauungsplan} steuern, damit dauerhaftes Wohnen nicht verdrängt wird. Gleichzeitig lebt die Küste vom Tourismus.",
      options: [
        {
          label: "Dauerhaftes Wohnen klar absichern",
          desc: "Weniger Verdrängung, weniger touristische Betten.",
          w: 18, g: 2, wi: -12,
          feedback: "Menschen, die hier leben und arbeiten, finden eher eine Wohnung. Der Tourismus verliert Betten, und manche Eigentümer verdienen weniger."
        },
        {
          label: "Steuern: nur in bestimmten Lagen zulassen",
          desc: "Ein Mittelweg zwischen Wohnen und Gästen.",
          w: 8, g: 0, wi: 6,
          feedback: "In Wohnstraßen bleibt der Alltag geschützt, in geeigneten Lagen bleiben Gäste willkommen. Der Konflikt wird kleiner, verschwindet aber nicht."
        },
        {
          label: "Tourismus und Ferienwohnungen ausweiten",
          desc: "Mehr Gäste und Umsatz – Wohnraum wird knapper.",
          w: -16, g: -6, wi: 18,
          feedback: "Hotels, Vermietung und Einzelhandel profitieren. Für dauerhaftes Wohnen wird es enger, und belebte Lagen können unruhiger und versiegelter werden."
        }
      ]
    },
    {
      id: "verkehr",
      title: "Verkehr in Innenstadt und an der Promenade",
      text: "In der Innenstadt und an der Promenade in Pelzerhaken teilen sich Fußgänger, Rad und Autos den Raum. Mehr Gäste bedeuten mehr Bewegung – Anwohner wünschen sich Sicherheit, Händler gute Erreichbarkeit. Wie steuerst du den Verkehr?",
      options: [
        {
          label: "Fußwege stärken und Autos zurücknehmen",
          desc: "Mehr Sicherheit und Aufenthalt, Kritik von Autofahrenden.",
          w: 6, g: 14, wi: -8,
          feedback: "Zu Fuß und mit dem Rad wird es angenehmer, die Luft in der Innenstadt besser. Manche Gäste und Händler fürchten um die Erreichbarkeit mit dem Auto."
        },
        {
          label: "Parken am Rand, Bus und Rad verbessern",
          desc: "Ein Kompromiss mit Aufwand und Umstellung.",
          w: 4, g: 8, wi: 2,
          feedback: "Die Innenstadt wird ruhiger, ohne das Auto ganz zu verbannen. Der Nutzen entsteht nur, wenn Parkplätze, Bus und Radwege wirklich gut zusammenpassen."
        },
        {
          label: "Autoverkehr und Parkplätze weitgehend erhalten",
          desc: "Bequem fürs Auto, eng für Fuß und Klima.",
          w: -4, g: -12, wi: 8,
          feedback: "Händler und Autogäste bleiben gewohnt erreichbar. Lärm, Platznot und Abgase bleiben – besonders in engen Straßen und an der Promenade."
        }
      ]
    },
    {
      id: "hochwasser",
      title: "Schutz vor Sturmflut",
      text: "Die Ostseeküste ist bei Sturmfluten gefährdet, besonders tiefer liegende Bereiche wie in Pelzerhaken. {hochwasserschutz} ist teuer und greift in die Landschaft ein. Zugleich braucht die ganze Stadt Vorsorge – nicht nur ein Ortsteil.",
      options: [
        {
          label: "Zügig technische Schutzanlagen bauen",
          desc: "Schneller Schutz, starker Eingriff ins Küstenbild.",
          w: 10, g: -10, wi: 4,
          feedback: "Wohnen und Betriebe hinter dem Schutz sind sicherer. Wälle oder Mauern verändern aber Strand, Dünen und das Landschaftsbild deutlich."
        },
        {
          label: "Naturnah schützen und die ganze Stadt mitdenken",
          desc: "Rücksicht auf Küste und Ortsteile, langsamer und teurer.",
          w: 4, g: 14, wi: -8,
          feedback: "Dünen, Grün und Vorsorge in mehreren Ortsteilen werden mitgedacht. Der Schutz braucht Zeit und Geld, und nicht jede Fläche bleibt sofort sicher."
        },
        {
          label: "Nur das Nötigste, Kosten sparen",
          desc: "Entlastet den Haushalt, erhöht das Risiko.",
          w: -14, g: -12, wi: 10,
          feedback: "Kurzfristig bleibt mehr Geld für anderes. Bei der nächsten schweren Sturmflut wären Wohnen, Natur und am Ende auch die Wirtschaft stärker gefährdet."
        }
      ]
    },
    {
      id: "wohnungsdruck",
      title: "Wo soll neuer Wohnraum entstehen?",
      text: "Es fehlen bezahlbare Wohnungen. Eine Möglichkeit ist Bauen am Stadtrand, eine andere die {nachverdichtung} in schon bebauten Quartieren. Beides hat Folgen für Natur, Verkehr und Nachbarschaft.",
      options: [
        {
          label: "Neues Wohnquartier am Stadtrand",
          desc: "Viel Wohnraum in kurzer Zeit, hoher Flächenverbrauch.",
          w: 20, g: -18, wi: 8,
          feedback: "Es entsteht rasch viel Wohnraum, auch mit Gärten und Einfamilienhäusern. Dafür gehen Flächen verloren, und Verkehr sowie Infrastruktur müssen nach außen mitwachsen."
        },
        {
          label: "Innenentwicklung und Aufstockung",
          desc: "Sparsamer mit Fläche, dafür Konflikte im Bestand.",
          w: 10, g: 8, wi: -2,
          feedback: "Die Stadt wächst nach innen und schont die Landschaft. Es geht langsamer, und in bestehenden Quartieren kann es Streit um Schatten, Parkplätze und Lärm geben."
        },
        {
          label: "Geförderten Wohnungsbau gezielt stärken",
          desc: "Mehr bezahlbare Wohnungen, abhängig von Förderung.",
          w: 14, g: 2, wi: -8,
          feedback: "Menschen mit kleinerem Einkommen haben bessere Chancen auf eine Wohnung. Die Stadt braucht Fördermittel, und private Investoren halten sich eher zurück."
        }
      ]
    }
  ]
};
