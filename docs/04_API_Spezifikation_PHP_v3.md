# API-Spezifikation: Viking-Schatz Rallye (PHP / Hosting Basic) - Version 3

**Ersetzt:** 04_API_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 11.09.2026, 04:18 Uhr (verifizierter Chat-500er-Fix dokumentiert)

## Basis-URL

```
https://deine-domain.de/api
```

## Authentifizierung

`Authorization: Bearer <session-token>` fuer Team- und Admin-/Beobachter-Endpunkte.

## Team-Endpunkte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /team/me.php | Eigene Team-Daten inklusive `avatar_url` |
| GET | /stations.php?rallye_id= | Stationen inklusive Freischaltstatus und `discovery_mode` |
| POST | /stations/unlock.php | QR-Freischaltung |
| POST | /team/check-geofence.php | GPS-Position senden und GPS-Stationen pruefen |
| GET | /puzzles.php?station_id= | Raetsel einer Station |
| POST | /puzzles/hint.php | Hinweis anfordern, ohne sofortigen Punktabzug |
| POST | /puzzles/submit.php | Antwort einreichen inklusive `hint_used`-Punktabzug |
| GET | /team/progress.php | Eigener Fortschritt |
| GET | /leaderboard.php?rallye_id= | Rangliste |
| GET | /team/broadcasts.php?since= | Neue Broadcasts |

**GPS-Debug (11.09.2026):** `/team/check-geofence.php` schreibt empfangene Teampositionen und die Entfernungen zu GPS-Stationen in das PHP-Error-Log.

## Ermittler-Chat

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /team/chat.php | Vollstaendiger chronologischer Chat-Verlauf; Optionen werden nur fuer `response_type='buttons'` geliefert |
| POST | /team/chat/respond.php | Chat-Antwort einreichen; speichert bei Buttons das gewaehlte Label als `team_response`; kann eine Station freischalten |
| GET | /team/open-tasks.php | Unbeantwortete Chat-Aufgaben |
| GET | /team/suspects.php | Entdeckte Verdaechtige ohne Schuldstatus |
| POST | /team/photos/submit.php | Foto-Upload fuer `photo_ref`-Knoten |
| POST | /team/avatars/upload.php | Avatar-Upload |

**Anklage-Gate (11.09.2026):** Eine durch eine Anklage-Antwort erreichbare Station wird nur freigeschaltet, wenn das Team vier Verdaechtige ueber Chat-Freischaltungen besucht hat. Die Pruefung erfolgt in `/team/chat/respond.php`.

**Verifizierter Chat-500er-Fix (11.09.2026):** Dateien in `backend/api/team/` muessen Bootstrap mit `require_once __DIR__ . '/../bootstrap.php';` einbinden. Der zuvor verwendete Pfad `../../bootstrap.php` zeigte auf `backend/bootstrap.php` statt auf `backend/api/bootstrap.php` und verursachte einen leeren HTTP-500-Fehler. Die funktionierende Referenz ist `backend/api/team/me.php`.

**Temporarer Diagnose-Endpunkt:** `/team/chat-diagnostic.php` ist ausschliesslich fuer die kurzfristige Produktionsdiagnose vorhanden und erfordert Team-Authentifizierung. Nach erfolgreicher Stabilitaetspruefung muss er entfernt werden.

## Admin-Endpunkte

Grundlegende Endpunkte: `/admin/dashboard.php`, `/admin/rallyes.php`, `/admin/teams.php`, `/admin/stations.php`, `/admin/puzzles.php`, `/admin/broadcast.php`, `/admin/leaderboard.php`, `/admin/positions.php`, `/admin/game/*`, `/admin/start-codes.php`, Story-Node-, Suspect-, Foto- und Broadcast-Template-Verwaltung.

---

**Aktualisiert:** 11.09.2026, 04:18 Uhr
**Version:** 3.3
