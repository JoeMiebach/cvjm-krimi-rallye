# Technische Spezifikation: Viking-Schatz Rallye (PHP / MySQL / Hosting Basic) - Version 3

**Ersetzt:** 02_Technische_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 10.09.2026, 01:40 Uhr (Bugfix-Session Rangliste/Chat/Hinweise/Lead-only-Stationen)

## System-Architektur (aktualisiert)

```
+-------------------------------------------------------+
|  Frontend: ZWEI getrennte React+Vite+Tailwind-Apps     |
|  - frontend/team-app/   (Jugendteams)                  |
|  - frontend/admin-app/  (Spielleiter/Beobachter)       |
|  - react-router-dom (Routing), react-leaflet (Karten)  |
|  - PWA-faehig, QR-Scanner, Geolocation API             |
|  - Polling alle 10s statt WebSocket                    |
+-------------------------------------------------------+
                        |  HTTPS (Fetch/AJAX)
+-------------------------------------------------------+
|  Backend (PHP 8.3, klassisches Shared-Hosting)         |
|  - REST API (/api/*.php Endpunkte)                     |
|  - Token-Auth ueber Startcode (Team) / Login (Admin)   |
+-------------------------------------------------------+
                        |
+-------------------------------------------------------+
|  MySQL/MariaDB (STRATO SSD-Datenbank)                  |
|  - Multi-Rallye-Schema, Migrationen 001-004            |
+-------------------------------------------------------+
```

### Repository-Struktur (Ist-Stand, 10.09.2026)

```
cvjm-krimi-rallye/
├── .gitignore
├── README.md
├── docs/
├── backend/
│   ├── api/ (bootstrap.php, leaderboard.php, admin/leaderboard.php, puzzles.php,
│   │   stations.php, lib/, admin/, auth/, puzzles/, stations/, system/, team/)
│   └── migrations/ (001_ermittler_chat_phase_a.sql, 002_ermittler_chat_phase_e.sql,
│       003_ermittler_chat_phase_f.sql, 004_lead_only_station_unlock.sql)
└── frontend/
    ├── team-app/src/ (screens/, context/, api/client.js, offline/queue.js)
    └── admin-app/src/ (screens/, context/, api/client.js)
```

**WICHTIG (korrigiert 09.09.2026 abends):** Frontend-Dateien gehoeren unter `frontend/team-app/`
und `frontend/admin-app/`, NICHT auf Repo-Root-Ebene (`team-app/`, `admin-app/`). Ein
Commit dieser Nacht hatte faelschlich die Root-Ebene verwendet und wurde vom Projektinhaber
manuell korrigiert.

---

## KRITISCH: discovery_mode-Naming-Inkonsistenz (10.09.2026, NOCH OFFEN)

Schema-Wahrheit (siehe `03_Datenbank_Schema_MySQL_MultiRallye_v4.sql`):
`stations.discovery_mode ENUM('lead_only','proximity','both')` -- MIT Unterstrich.

In der Bugfix-Session vom 09.09.2026 abends wurde in
`frontend/admin-app/src/screens/StationsEditorScreen.jsx` (Dropdown-Werte) und
`frontend/team-app/src/screens/StationsMapScreen.jsx` (Filterlogik) faelschlich
`'leadonly'` OHNE Unterstrich verwendet. Muss in beiden Dateien auf `'lead_only'`
korrigiert werden, sonst funktioniert weder das Anlegen noch die Kartenfilterung von
lead-only-Stationen zuverlaessig.

---

## Authentifizierung / Polling / Geofencing (unveraendert aus v2)

Siehe v2 fuer vollstaendige Beschreibung. Polling: 10s (Leaderboard/Chat/Broadcasts),
20-30s (GPS-Geofence).

---

## Lazy Cleanup der Standortdaten (unveraendert aus v3)

Altersbasiert (Standard 4h), externer Cron-Trigger (`GET /system/cleanup.php`) als
Sicherheitsnetz.

---

## Rangliste (Bugfix 09.09.2026 abends / 10.09.2026)

Die DB-View `leaderboard` liefert die Spalten `team_id`, `rallye_id`, `team_name`,
`avatar_url`, `stations_completed`, `total_points`, `total_hints_used`, `started_at`,
`last_activity`, `current_latitude`, `current_longitude`. Sowohl
`backend/api/leaderboard.php` (Team-Endpunkt) als auch `backend/api/admin/leaderboard.php`
(Admin-/Beobachter-Endpunkt) selektieren jetzt explizit `team_id, team_name,
stations_completed, total_points, total_hints_used` mit expliziter
`ORDER BY total_points DESC, started_at ASC` (MySQL garantiert die ORDER BY einer VIEW
bei aeusserer WHERE-Klausel nicht zuverlaessig). Beide Frontend-`LeaderboardScreen.jsx`
(Team- und Admin-App) lesen `result.leaderboard` (nicht `result.ranking`) und die obigen
Feldnamen.

---

## Hinweis-Mechanik / Punkteabzug (korrigiert 09.09.2026 abends)

`POST /puzzles/hint.php` liefert ausschliesslich den Hinweistext und `hint_penalty`
zurueck, OHNE Seiteneffekte. Die eigentliche Buchung erfolgt bei `POST
/puzzles/submit.php`: das Frontend (`PuzzlesScreen.jsx`) merkt sich pro Raetsel lokal,
ob ein Hinweis angefordert wurde, und sendet `hint_used: true` beim naechsten
Loesungsversuch mit. `submit.php` reduziert `points_earned` entsprechend, und der
DB-Trigger `update_team_progress_after_attempt` berechnet `team_progress.total_points`
und `total_hints_used` bei jeder richtigen Antwort komplett neu aus der Summe aller
`team_attempts`-Zeilen des Teams. Ein zwischenzeitlicher Versuch, den Abzug bereits in
`hint.php` vorzunehmen, wurde wieder zurueckgesetzt (haette zu Doppelabzug gefuehrt).

---

## Lead-only-Stationen ueber Chat freischalten (NEU, 09.09.2026 abends)

`story_node_options.unlocks_station_id` (Migration 004) erlaubt es, dass eine korrekte
Chat-Antwort zusaetzlich eine Station freischaltet: `backend/api/team/chat/respond.php`
legt bei gesetztem `unlocks_station_id` einen Eintrag in `station_unlocks` mit
`unlock_source='chat'` an (Migration 004 erweitert das ENUM entsprechend). Team-seitig
zeigt `backend/api/stations.php` seit diesem Fix zusaetzlich `discovery_mode` in der
Response, damit `StationsMapScreen.jsx` `discovery_mode='lead_only'`-Stationen erst nach
Freischaltung anzeigen kann (siehe kritischen Naming-Bug oben -- Funktion aktuell noch
nicht zuverlaessig).

---

## Sicherheitskonzept (ergaenzt)

PDO Prepared Statements, bcrypt-Passworthashing, HMAC-signierte Tokens.
`config.php`/`config.local.php` MUESSEN in `.gitignore` stehen.

---

## Deployment (STRATO Hosting Basic)

Beide Frontends (`frontend/team-app`, `frontend/admin-app`) werden separat gebaut
(`npm run build`) und per SFTP hochgeladen. SPA-Rewrite via `.htaccess` (siehe v3
fuer Details zum `basename`-Fix).

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3), 10.09.2026 (Bugfix-Session)
**Version:** 3.1
