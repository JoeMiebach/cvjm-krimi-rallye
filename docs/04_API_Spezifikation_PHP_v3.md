# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3

**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026, 15:20 Uhr (Ermittler-Chat-Endpunkte Phase A ergaenzt)

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
| GET | /team/clues.php | Ermittlungsakte (ALT -- wird mit Abschluss der Ermittler-Chat-Migration entfernt, siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md) |

## Admin-Endpunkte

Grundlegende Endpunkte (`/admin/dashboard.php`, `/admin/rallyes.php`, `/admin/teams.php`,
`/admin/stations.php`, `/admin/puzzles.php`, `/admin/broadcast.php`, `/admin/leaderboard.php`,
`/admin/positions.php`, Spielsteuerung unter `/admin/game/*`, `/admin/start-codes.php`)
unveraendert -- siehe v2/v3 fuer vollstaendige Tabellen.

## Ermittler-Chat-Endpunkte (NEU, Phase A -- siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md)

### Team-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /team/chat.php | Vollstaendiger Chat-Verlauf inkl. offener Antwortoptionen |
| POST | /team/chat/respond.php | Antwort auf einen Knoten (Button-Wahl/Text/Zahl) einreichen |
| GET | /team/open-tasks.php | Alle unbeantworteten Chat-Aufgaben des Teams |

### Admin-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET/POST/PUT/DELETE | /admin/story-nodes.php | CRUD fuer Chat-Knoten |
| GET/POST/PUT/DELETE | /admin/story-node-options.php | CRUD fuer Antwortoptionen |
| GET/POST/PUT/DELETE | /admin/suspects.php | CRUD fuer Verdaechtige |

Implementiert in `backend/api/team/chat.php`, `backend/api/team/chat/respond.php`,
`backend/api/team/open-tasks.php`, `backend/api/admin/story-nodes.php`,
`backend/api/admin/story-node-options.php`, `backend/api/admin/suspects.php`.

## Beobachter-Endpunkte / System-Endpunkt / Fehlercodes

Unveraendert aus v2 -- siehe dort fuer vollstaendige Tabellen.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3)
**Version:** 3.0
