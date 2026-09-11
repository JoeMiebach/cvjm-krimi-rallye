# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3


**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 11.09.2026, 03:30 Uhr (Phase F + Bugfix-Session 11.09.2026)


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
| GET | /team/me.php | Eigene Team-Daten (inkl. avatar_url) |
| GET | /stations.php?rallye_id= | Stationen inkl. Freischaltstatus UND discovery_mode |
| POST | /stations/unlock.php | QR-Freischaltung |
| POST | /team/check-geofence.php | GPS-Position senden, GPS-Stationen pruefen (mit Debug-Logs) |
| GET | /puzzles.php?station_id= | Raetsel einer Station |
| POST | /puzzles/hint.php | Hinweis anfordern (KEINE Punktbuchung, siehe unten) |
| POST | /puzzles/submit.php | Antwort einreichen (inkl. hint_used-Punktabzug) |
| GET | /team/progress.php | Eigener Fortschritt |
| GET | /leaderboard.php?rallye_id= | Rangliste -- liefert `{leaderboard: [...]}` mit Feldern
  `team_id, team_name, stations_completed, total_points, total_hints_used` |
| GET | /team/broadcasts.php?since= | Neue Broadcasts |


**Hinweis-Mechanik (korrigiert 09.09.2026 abends):** `/puzzles/hint.php` hat KEINE
Seiteneffekte mehr. Der Punktabzug erfolgt ausschliesslich in `/puzzles/submit.php`
ueber das vom Frontend mitgesendete Feld `hint_used: true`.


**GPS-Debug-Logs (11.09.2026):** `/team/check-geofence.php` loggt jede empfangene
Position und jede berechnete Distanz zu GPS-Stationen im Error-Log. Format:
`[GEOFENCE] Team X: Station Y (Titel): Distanz=12.3 m, Radius=50 m`.


## Admin-Endpunkte


Grundlegende Endpunkte (`/admin/dashboard.php`, `/admin/rallyes.php`, `/admin/teams.php`,
`/admin/stations.php`, `/admin/puzzles.php`, `/admin/broadcast.php`, `/admin/leaderboard.php`,
`/admin/positions.php`, Spielsteuerung unter `/admin/game/*`, `/admin/start-codes.php`).


`GET /admin/leaderboard.php?rallye_id=` liefert `{leaderboard: [...]}` mit denselben
Feldern wie der Team-Endpunkt (siehe oben), mit expliziter `ORDER BY total_points DESC,
started_at ASC`.


`POST /admin/broadcast.php` erwartet `target_team_ids` als JSON-**Array** numerischer
IDs (nicht als kommagetrennten String) -- `is_array($body['target_team_ids'])` wird
serverseitig geprueft.


## Ermittler-Chat-Endpunkte (siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md)


### Team-Endpunkte


| Methode | Endpunkt | Beschreibung | Phase |
|---|---|---|---|
| GET | /team/chat.php | Vollstaendiger Chat-Verlauf inkl. offener Antwortoptionen (nur bei response_type='buttons') |
| POST | /team/chat/respond.php | Antwort einreichen; speichert bei Buttons das Label (nicht die ID) als team_response; kann zusaetzlich unlocked_station_id zurueckgeben; Anklage-Station nur bei ≥4 besuchten Verdaechtigen |
| GET | /team/open-tasks.php | Alle unbeantworteten Chat-Aufgaben des Teams |
| GET | /team/suspects.php | Bisher entdeckte Verdaechtige des Teams (ohne is_guilty) |
| POST | /team/photos/submit.php | Foto-Upload fuer photo_ref-Knoten (multipart/form-data, max. 8 MB) |
| POST | /team/avatars/upload.php | Avatar-Upload (multipart/form-data, max. 2 MB) |


### Admin-Endpunkte


| Methode | Endpunkt | Beschreibung | Phase |
|---|---|---|---|
| GET/POST/PUT/DELETE | /admin/story-nodes.php | CRUD fuer Chat-Knoten (inkl. media_type/media_url) |
| GET/POST/PUT/DELETE | /admin/story-node-options.php | CRUD fuer Antwortoptionen (inkl. unlocks_station_id) |
| GET/POST/PUT/DELETE | /admin/suspects.php | CRUD fuer Verdaechtige |
| GET | /admin/photo-submissions.php?rallye_id= | Liste aller Foto-Einsendungen |
| POST | /admin/photo-submissions/award.php | Punkte fuer Foto-Einsendung vergeben (nur einmal) |
| GET/POST/PUT/DELETE | /admin/broadcast-templates.php | CRUD fuer Eilmeldungs-Vorlagen |


Implementiert in `backend/api/team/chat.php`, `backend/api/team/chat/respond.php`,
`backend/api/team/open-tasks.php`, `backend/api/team/suspects.php`,
`backend/api/team/photos/submit.php`, `backend/api/team/avatars/upload.php`,
`backend/api/admin/story-nodes.php`, `backend/api/admin/story-node-options.php`,
`backend/api/admin/suspects.php`, `backend/api/admin/photo-submissions.php`,
`backend/api/admin/photo-submissions/award.php`, `backend/api/admin/broadcast-templates.php`.


## Beobachter-Endpunkte / System-Endpunkt / Fehlercodes


Unveraendert aus v2 -- siehe dort fuer vollstaendige Tabellen.


---


**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3), 10.09.2026 (Bugfix-Session)
**Aktualisiert:** 11.09.2026 (Anklage-Sperre, 00-Bug-Fix, GPS-Debug)
**Version:** 3.2
