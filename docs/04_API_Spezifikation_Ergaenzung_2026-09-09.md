# API-Spezifikation: Ergaenzungen seit Version 2 (Stand 09.09.2026)

Ergaenzt `04_API_Spezifikation_PHP.md` (v2.0) um Endpunkte und Feld-Korrekturen, die beim
Code-Scan von JoeMiebach/cvjm-krimi-rallye am 09.09.2026 festgestellt wurden. v2 bleibt
gueltig; dieses Dokument dokumentiert nur Abweichungen/Ergaenzungen.

## Neuer Endpunkt: Ermittlungsakte

### `GET /team/clues.php`

Liefert alle bisher freigeschalteten Story-Hinweise ("Beweisstuecke") des eigenen Teams,
ueber alle Stationen hinweg, fuer die "Ermittlungsakte"-Ansicht (`CaseFileScreen.jsx`).

**Response (200):**
```json
{
  "success": true,
  "clues": [
    {
      "station_id": 1,
      "station_title": "Der Viking-Hafen",
      "story_clue_text": "...",
      "unlocked_at": "2026-09-09T10:15:00Z"
    }
  ]
}
```

Genaues Feldschema bitte gegen `backend/api/team/clues.php` verifizieren -- aus dem Frontend-
Code (`CaseFileScreen.jsx`) erschlossen, nicht aus dem PHP-Code direkt gelesen.

## Korrektur: `POST /puzzles/submit.php`

**Offene Diskrepanz:** Das Frontend (`PuzzlesScreen.jsx`) erwartet bei richtiger Antwort
zusaetzlich ein Feld `story_clue` in der Response, um sofort ein Beweisstueck-Popup zu zeigen:

```json
{
  "success": true,
  "is_correct": true,
  "points_earned": 10,
  "message": "Richtig! +10 Punkte",
  "story_clue": "Text des Story-Hinweises, der jetzt freigeschaltet wurde"
}
```

Der aktuelle Backend-Code liefert dieses Feld noch NICHT zurueck. Vor Produktivbetrieb klaeren:
Soll `submit.php` den zugehoerigen Story-Clue-Text direkt mitliefern (dann muss ggf. eine
Spalte wie `puzzles.story_clue_text` existieren/ergaenzt werden), oder soll das Popup entfernt
werden und das Beweisstueck taucht ohnehin erst in der Ermittlungsakte auf?

## Karten-Endpunkte: Klarstellung

- `GET /stations.php?rallye_id=` liefert weiterhin nur Stationsdaten (inkl. `is_unlocked` pro
  Team) -- wird von `StationsMapScreen.jsx` (react-leaflet) genutzt, um Stationen auf einer
  Karte darzustellen. KEINE Positionsdaten anderer Teams werden hierueber oder anderswo an
  Team-Clients ausgeliefert (Datenschutz- und Fairness-Entscheidung, siehe Entscheidungslog-
  Ergaenzung).
- `POST /team/check-geofence.php` bleibt wie in v2 dokumentiert unveraendert fuer die
  automatische GPS-Stationsfreischaltung.

---

**Erstellt:** 09.09.2026
**Bezug:** Ergaenzt 04_API_Spezifikation_PHP.md v2.0
