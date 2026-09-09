# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3

**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026

## Basis-URL

```
https://deine-domain.de/api
```

## Authentifizierung (unveraendert aus v2)

`Authorization: Bearer <session-token>` fuer Team- und Admin-/Beobachter-Endpunkte.

## Oeffentliche Endpunkte (unveraendert aus v2)

`GET /config.php?rallye_id=`, `POST /auth/check-code.php`, `POST /auth/register.php`,
`POST /auth/login.php`, `POST /auth/admin-login.php` -- siehe v2 fuer Details.

## Team-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /team/me.php | Eigene Team-Daten |
| GET | /stations.php?rallye_id= | Stationen inkl. Freischaltstatus (auch fuer StationsMapScreen.jsx) |
| POST | /stations/unlock.php | QR-Freischaltung |
| POST | /team/check-geofence.php | GPS-Position senden, GPS-Stationen pruefen |
| GET | /puzzles.php?station_id= | Raetsel einer Station |
| POST | /puzzles/hint.php | Hinweis anfordern |
| POST | /puzzles/submit.php | Antwort einreichen (siehe Korrektur unten) |
| GET | /team/progress.php | Eigener Fortschritt |
| GET | /leaderboard.php?rallye_id= | Rangliste |
| GET | /team/broadcasts.php?since= | Neue Broadcasts |
| GET | /team/clues.php | NEU (v3): Ermittlungsakte |

### GET /team/clues.php (NEU in v3)

```json
{ "success": true, "clues": [ { "station_id": 1, "station_title": "Der Viking-Hafen", "story_clue_text": "...", "unlocked_at": "2026-09-09T10:15:00Z" } ] }
```

Feldschema aus CaseFileScreen.jsx erschlossen -- gegen backend/api/team/clues.php verifizieren.

### POST /puzzles/submit.php (KORRIGIERT/ERGAENZT in v3)

Offene Diskrepanz: PuzzlesScreen.jsx erwartet zusaetzlich ein Feld `story_clue`:

```json
{ "success": true, "is_correct": true, "points_earned": 10, "message": "Richtig! +10 Punkte", "story_clue": "Text..." }
```

Aktueller Code liefert `story_clue` NICHT zurueck -- vor Produktivbetrieb klaeren (ggf. Spalte
`puzzles.story_clue_text` ergaenzen, siehe DB-Schema v2.2).

## Admin-Endpunkte / Beobachter-Endpunkte / System-Endpunkt / Fehlercodes

Unveraendert aus v2 -- siehe dort fuer vollstaendige Tabellen.

**Klarstellung (v3):** `admin/positions.php` bleibt der einzige Endpunkt mit Positionsdaten
mehrerer Teams -- ausschliesslich fuer Admin/Viewer, niemals fuer Team-Clients.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3)
**Version:** 3.0
