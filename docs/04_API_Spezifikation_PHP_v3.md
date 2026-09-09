# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3

**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026, 13:31 Uhr (Startcodes-Endpoint ergaenzt)

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
| POST | /puzzles/submit.php | Antwort einreichen (siehe unten, story_clue final) |
| GET | /team/progress.php | Eigener Fortschritt |
| GET | /leaderboard.php?rallye_id= | Rangliste |
| GET | /team/broadcasts.php?since= | Neue Broadcasts |
| GET | /team/clues.php | Ermittlungsakte (persistent, siehe unten) |

### POST /puzzles/submit.php (FINAL, 09.09.2026)

Bei korrekter Antwort liefert der Endpoint den Story-Hinweis (`puzzles.story_clue_text`)
**sofort** im Response mit -- Grundlage fuer ein Popup ("Neues Beweisstueck entdeckt!") in
`PuzzlesScreen.jsx`. Zusaetzlich schreibt der Endpoint denselben Hinweis dauerhaft in
`team_story_clues`, sodass er unabhaengig vom Popup jederzeit ueber `GET /team/clues.php`
abrufbar bleibt. Ist bei einem Raetsel `story_clue_text` NULL (z. B. bei Bonus-Raetseln ohne
eigenen Story-Beitrag), wird `story_clue` als `null` zurueckgegeben und **kein** Eintrag in
`team_story_clues` erzeugt.

Request:

```json
{ "puzzle_id": 3, "answer": "Sleipnir", "hint_used": false }
```

Response (korrekte Antwort, Raetsel mit Story-Hinweis):

```json
{ "success": true, "is_correct": true, "points_earned": 10, "message": "Richtig! +10 Punkte", "story_clue": "Text..." }
```

Response (korrekte Antwort, Raetsel ohne Story-Hinweis, z. B. Bonus-Raetsel):

```json
{ "success": true, "is_correct": true, "points_earned": 10, "message": "Richtig! +10 Punkte", "story_clue": null }
```

Response (falsche Antwort, Versuche verbleiben):

```json
{ "success": true, "is_correct": false, "attempts_remaining": 2, "message": "Falsch. Noch 2 Versuche." }
```

Implementiert in `backend/api/puzzles/submit.php`.

### GET /team/clues.php (verifiziert 09.09.2026)

Liefert alle bisher freigeschalteten Story-Hinweise des Teams aus `team_story_clues`, sortiert
nach `unlocked_at` aufsteigend. Bleibt dauerhaft abrufbar, unabhaengig vom Submit-Popup.

```json
{
  "success": true,
  "clues": [
    {
      "story_clue_text": "...",
      "unlocked_at": "2026-09-09T10:15:00Z",
      "puzzle_question": "Wie heisst der Viking-Gott des Donners?",
      "station_id": 1,
      "station_title": "Der Viking-Hafen"
    }
  ]
}
```

Implementiert in `backend/api/team/clues.php`.

## Admin-Endpunkte

Grundlegende Endpunkte (`/admin/dashboard.php`, `/admin/rallyes.php`, `/admin/teams.php`,
`/admin/stations.php`, `/admin/puzzles.php`, `/admin/broadcast.php`, `/admin/leaderboard.php`,
`/admin/positions.php`, Spielsteuerung unter `/admin/game/*`) unveraendert aus v2 -- siehe dort
fuer vollstaendige Tabellen.

### GET /admin/start-codes.php?rallye_id= (NEU, 09.09.2026)

Listet alle Startcodes einer Rallye -- benutzte (inkl. Teamname) und unbenutzte. Ersetzt den
eigenstaendigen `StartCodesScreen.jsx`; die Anzeige ist jetzt Teil von `TeamsScreen.jsx` (siehe
`00_Project_Brief_Entscheidungslog_v3.md`, Punkt 16).

```json
{
  "success": true,
  "start_codes": [
    { "id": 27, "code": "PU9R24WG", "is_used": 1, "used_by_team_id": 4, "team_name": "Joe", "created_at": "2026-09-08T18:36:24Z" },
    { "id": 28, "code": "NBGHJPUF", "is_used": 0, "used_by_team_id": null, "team_name": null, "created_at": "2026-09-08T18:36:24Z" }
  ]
}
```

Implementiert in `backend/api/admin/start-codes.php`. `POST /admin/start-codes/generate.php`
(Erzeugen neuer Codes) bleibt unveraendert bestehen.

## Beobachter-Endpunkte / System-Endpunkt / Fehlercodes

Unveraendert aus v2 -- siehe dort fuer vollstaendige Tabellen.

**Klarstellung (v3):** `admin/positions.php` bleibt der einzige Endpunkt mit Positionsdaten
mehrerer Teams -- ausschliesslich fuer Admin/Viewer, niemals fuer Team-Clients.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3)
**Version:** 3.0
