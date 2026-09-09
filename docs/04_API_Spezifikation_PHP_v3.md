# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3

**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026, 17:40 Uhr (Ermittler-Chat-Endpunkte Phase A-E ergaenzt)

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
| GET | /stations.php?rallye_id= | Stationen inkl. Freischaltstatus |
| POST | /stations/unlock.php | QR-Freischaltung |
| POST | /team/check-geofence.php | GPS-Position senden, GPS-Stationen pruefen |
| GET | /puzzles.php?station_id= | Raetsel einer Station |
| POST | /puzzles/hint.php | Hinweis anfordern |
| POST | /puzzles/submit.php | Antwort einreichen |
| GET | /team/progress.php | Eigener Fortschritt |
| GET | /leaderboard.php?rallye_id= | Rangliste |
| GET | /team/broadcasts.php?since= | Neue Broadcasts |

## Admin-Endpunkte

Grundlegende Endpunkte (`/admin/dashboard.php`, `/admin/rallyes.php`, `/admin/teams.php`,
`/admin/stations.php`, `/admin/puzzles.php`, `/admin/broadcast.php`, `/admin/leaderboard.php`,
`/admin/positions.php`, Spielsteuerung unter `/admin/game/*`, `/admin/start-codes.php`)
unveraendert -- siehe v2/v3 fuer vollstaendige Tabellen.

## Ermittler-Chat-Endpunkte (siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md)

### Team-Endpunkte

| Methode | Endpunkt | Beschreibung | Phase |
|---|---|---|---|
| GET | /team/chat.php | Vollstaendiger Chat-Verlauf inkl. offener Antwortoptionen | A |
| POST | /team/chat/respond.php | Antwort auf einen Knoten (Button-Wahl/Text/Zahl) einreichen | A/C |
| GET | /team/open-tasks.php | Alle unbeantworteten Chat-Aufgaben des Teams | A |
| GET | /team/suspects.php | Bisher entdeckte Verdaechtige des Teams (ohne is_guilty) | C |
| POST | /team/photos/submit.php | Foto-Upload fuer photo_ref-Knoten (multipart/form-data, JPEG/PNG/WebP, max. 8 MB) | E |

### Admin-Endpunkte

| Methode | Endpunkt | Beschreibung | Phase |
|---|---|---|---|
| GET/POST/PUT/DELETE | /admin/story-nodes.php | CRUD fuer Chat-Knoten | A |
| GET/POST/PUT/DELETE | /admin/story-node-options.php | CRUD fuer Antwortoptionen | A |
| GET/POST/PUT/DELETE | /admin/suspects.php | CRUD fuer Verdaechtige | A |
| GET | /admin/photo-submissions.php?rallye_id= | Liste aller Foto-Einsendungen einer Rallye | E |
| POST | /admin/photo-submissions/award.php | Punkte fuer eine Foto-Einsendung vergeben (nur einmal moeglich, submission_id + points) | E |

Implementiert in `backend/api/team/chat.php`, `backend/api/team/chat/respond.php`,
`backend/api/team/open-tasks.php`, `backend/api/team/suspects.php`,
`backend/api/team/photos/submit.php`, `backend/api/admin/story-nodes.php`,
`backend/api/admin/story-node-options.php`, `backend/api/admin/suspects.php`,
`backend/api/admin/photo-submissions.php`, `backend/api/admin/photo-submissions/award.php`.

## Beobachter-Endpunkte / System-Endpunkt / Fehlercodes

Unveraendert aus v2 -- siehe dort fuer vollstaendige Tabellen.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3)
**Version:** 3.0
