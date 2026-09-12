# Technische Spezifikation

**Viking-Schatz Rallye — PHP / MySQL / Hosting Basic**
**Stand:** 12.09.2026, konsolidiert aus Projektdokumenten und Abgleich gegen den produktiven Codestand
**Ersetzt:** 02_Technische_Spezifikation_PHP_v3.md, 05_Technische_Spezifikation_Ermittler_Chat_v1.md (technischer Teil)

---

## 1. System-Architektur

```
+---------------------------------------------------------+
| Frontend: ZWEI getrennte React+Vite+Tailwind-Apps        |
| - team-app/   (Jugendteams)                              |
| - admin-app/  (Spielleiter/Beobachter)                   |
| - react-router-dom (Routing), react-leaflet (Karten)     |
| - PWA-faehig (Service Worker geplant/teilw. IndexedDB)   |
| - QR-Scanner (html5-qrcode)                              |
| - Geolocation API (GPS-Tracking, Kompass optional)       |
| - Polling alle 10s statt WebSocket                       |
+---------------------------------------------------------+
                        | HTTPS (Fetch/AJAX, JSON)
+---------------------------------------------------------+
| Backend (PHP 8.3, klassisches Shared-Hosting)            |
| - REST API (/api/*.php Endpunkte)                        |
| - Token-Auth: Startcode (Team) / E-Mail+Passwort (Admin) |
| - Kein Dauerprozess, keine WebSockets, kein echter Cron  |
+---------------------------------------------------------+
                        |
+---------------------------------------------------------+
| MySQL/MariaDB (STRATO SSD-Datenbank)                     |
| - Multi-Rallye-Schema (rallye_id auf allen Kern-Tabellen)|
| - InnoDB, Foreign Keys, Indizes                          |
+---------------------------------------------------------+
```

### Repository-Struktur (bestätigter Ist-Stand)

```
cvjm-krimi-rallye/
├── .gitignore
├── README.md
├── docs/
├── backend/api/
│   ├── bootstrap.php, config.php, config.php.example
│   ├── leaderboard.php, puzzles.php, stations.php
│   ├── admin/       (Dashboard, CRUD-Editoren, Spielsteuerung)
│   ├── auth/        (Login/Register/Check-Code)
│   ├── lib/         (auth, cleanup, db, game, geofence, response, story)
│   ├── puzzles/     (hint, submit)
│   ├── stations/    (unlock)
│   ├── system/      (cleanup)
│   └── team/        (chat, broadcasts, progress, suspects, photos, avatars ...)
└── frontend/
    ├── team-app/src/    (api/, components/, context/, offline/, screens/)
    └── admin-app/src/   (api/, context/, screens/)
```

---

## 2. Authentifizierung

**Team:** Startcode-basiertes Login. `POST /auth/check-code.php` prüft den Code, `POST /auth/register.php` legt bei Erstnutzung Team + Teamname an, `POST /auth/login.php` meldet ein bestehendes Team erneut an. Zusätzlich wird ein httpOnly-Cookie `team_code` gesetzt (Re-Login-Fallback serverseitig), während der Client selbst den Code in `localStorage` hält, um beim App-Start automatisch `login.php` erneut aufzurufen (das Cookie selbst ist für JS nicht lesbar).

**Admin/Viewer:** E-Mail/Passwort-Login (`POST /auth/admin-login.php`), `password_verify()` gegen `admins.password_hash` (bcrypt).

**Tokens:** HMAC-SHA256-signierte Tokens (`lib/auth.php`, Funktionen `createToken()`/`verifyToken()`). Payload ist Base64-kodiert vor dem Punkt, danach die Signatur. Team-Tokens laufen standardmäßig 6 Stunden, Admin-Tokens 8 Stunden (`createToken($payload, $ttlSeconds)`).

**Middleware:**
- `requireTeamAuth()` — nur eingeloggte, aktive Teams
- `requireAdminAuth()` — nur Rolle `admin` (Viewer erhalten 403, nicht 401)
- `requireAdminOrViewerAuth()` — Rolle `admin` ODER `viewer`
- `requireRallyeAccess($rallyeId, $entity)` — verhindert Cross-Rallye-Zugriff

**Rate-Limiting:** Dateibasiertes Rate-Limit (`checkRateLimit()`) für Login-Endpunkte, max. 10 Versuche/Minute pro IP (Standardwerte, konfigurierbar).

---

## 3. Polling statt WebSockets

| Zweck | Intervall |
|---|---|
| Chat-Verlauf (Team) | 10 s |
| Leaderboard, Broadcasts | 10 s |
| Admin-Dashboard, Admin-Live-Karte | 10 s |
| GPS-Geofence-Check | 25 s |

Grund: STRATO Hosting Basic unterstützt keine Dauerprozesse/WebSockets.

---

## 4. Geofencing

Haversine-Distanzberechnung (`lib/geofence.php`, Funktion `calculateDistance()`), identisch auf Client (`StationCompass.jsx`) und Server implementiert. GPS-Freischaltung erfolgt serverseitig über `POST /team/check-geofence.php`, das alle GPS-Stationen im Radius (`stations.geofence_radius_meters`) prüft und Freischaltungen in `station_unlocks` einträgt.

---

## 5. Spielsteuerung (Start/Pause/Ende)

`rallyes.is_game_running`, `rallyes.paused_at`, `rallyes.game_start_time`, `rallyes.game_end_time` steuern den Spielzustand.

- **Start (Erststart):** `game_start_time = NOW()`, `game_end_time = NOW() + time_limit_minutes`.
- **Pause:** `is_game_running = 0`, `paused_at = NOW()`.
- **Fortsetzen:** `game_end_time` wird um die Pausendauer verschoben (`DATE_ADD(game_end_time, INTERVAL TIMESTAMPDIFF(SECOND, paused_at, NOW()) SECOND)`), `paused_at = NULL`.
- **Beenden:** `is_game_running = 0`, `game_end_time = NOW()`, `paused_at = NULL`.
- **Reset:** löscht Teams, Startcodes, Broadcasts, Fortschritt der Rallye vollständig; setzt Zeitfelder zurück. Erfordert `confirm: true` im Request.

`requireGameRunning($pdo, $rallyeId)` (`lib/game.php`) blockiert Rätsel-Interaktionen (Lösen, Hinweis, QR-Freischaltung), solange das Spiel pausiert/nicht gestartet/beendet ist. Rein lesende Endpunkte (Leaderboard, Broadcasts, Fortschritt, Stationsliste) rufen diese Prüfung bewusst NICHT auf.

---

## 6. Lazy Cleanup der Standortdaten

Kein echter Cronjob verfügbar (Shared Hosting) → Cleanup läuft bei **jedem** API-Request automatisch mit (`bootstrap.php` ruft `cleanupExpiredPositions($pdo)` zentral auf):

```php
function cleanupExpiredPositions(PDO $pdo, int $maxAgeHours = 4): int {
    $stmt = $pdo->prepare(
        "UPDATE teams
         SET current_latitude = NULL, current_longitude = NULL, last_position_update = NULL
         WHERE last_position_update IS NOT NULL
           AND last_position_update < (NOW() - INTERVAL ? HOUR)"
    );
    $stmt->execute([$maxAgeHours]);
    return $stmt->rowCount();
}
```

Altersbasiert (Standard: 4 Stunden), nicht an `game_end_time` gekoppelt — verhindert, dass die Live-Karte unmittelbar nach Spielende leerläuft. Zusätzlicher externer Trigger `GET /system/cleanup.php` als Sicherheitsnetz.

---

## 7. Ermittler-Chat-Kernlogik (`lib/story.php`)

- **`deliverNode($pdo, $teamId, $nodeId)`:** Zentrale Kaskaden-Funktion. Prüft zuerst, ob der Knoten dem Team bereits zugestellt wurde (verhindert Endlosschleifen/Doppelzustellung). Bei Info-Knoten (`response_type = 'none'`) wird der Eintrag sofort als abgeschlossen markiert, Punkte vergeben und **alle** verknüpften `story_node_options` automatisch verarbeitet: `unlocks_station_id` schaltet Stationen frei (`station_unlocks`, `unlock_source = 'chat'`), `leads_to_node_id` ruft `deliverNode()` rekursiv für den Folgeknoten auf.
- **`deliverRootNodesIfNeeded($pdo, $teamId, $rallyeId)`:** Stellt beim ersten Kontakt eines Teams alle `is_root = 1`-Knoten zu.
- **`evaluateProactiveNodes($pdo, $teamId, $rallyeId)`:** Wird bei jedem `GET /team/chat.php`-Poll aufgerufen (Lazy Evaluation, analog zum Cleanup-Prinzip). Prüft Inaktivitäts- und Fehlversuchs-Trigger und stellt fällige proaktive Knoten automatisch zu.
- **`awardStoryPoints($pdo, $teamId, $points)`:** Addiert Punkte zu `team_progress.total_points`.

**Verzahnung mit klassischen Rätseln:** `POST /puzzles/submit.php` löst nach korrekter Antwort automatisch den nächsten Chat-Knoten aus (`deliverNode()`), sofern ein `story_nodes`-Eintrag mit `response_type = 'puzzle_ref'` auf das gelöste Rätsel verweist und eine `story_node_options`-Option mit `leads_to_node_id` existiert. Zusätzlich wird — sofern gesetzt — `puzzles.story_clue_text` weiterhin in `team_story_clues` gespeichert (Altsystem, siehe Datenbank-Dokument zu Migrationsstatus).

---

## 8. Sicherheitskonzept

- PDO Prepared Statements durchgängig.
- Passwort-Hashing via `password_hash`/`password_verify` (bcrypt).
- HMAC-signierte Tokens, serverseitige Ablaufprüfung (`exp`-Feld).
- CORS auf definierte Origins beschränkt (`https://cvjm.joe-miebach.de`, lokale Dev-Ports), kein offenes `*`.
- **Pflichtregel Secrets:** `config.php`/`config.local.php` müssen in `.gitignore` stehen. Bei versehentlichem Commit: vollständiger Git-History-Rewrite PLUS Rotation aller betroffenen Zugangsdaten ist Pflicht.
- Multiple-Choice-Optionen werden dem Client ohne `is_correct`-Flag und gemischt (`shuffle()`) ausgeliefert — die eigentliche Prüfung bleibt serverseitig.

---

## 9. Deployment (STRATO Hosting Basic)

Beide Frontends werden separat gebaut (`npm run build`) und per SFTP in getrennte Verzeichnisse hochgeladen; Backend nach `/api`.

**SPA-Rewrite-Pflicht:** Beide Apps nutzen `BrowserRouter` mit `basename` (`/admin` bzw. `/team`). Ohne serverseitige Rewrite-Regel liefert Apache bei Reload/Direktaufruf einer Unterroute einen 404. Fix: `public/.htaccess` in beiden Vite-Projekten, leitet nicht-existierende Pfade auf `index.html` um.

**Bekannte, bereits behobene Deploy-Stolpersteine** (zur Dokumentation, falls erneut relevant):
- Wildcard-Glob-Uploads (`dist/*`) übersprangen Dotfiles wie `.htaccess` → Fix: expliziter Einzeldatei-Upload-Schritt pro App im CI-Workflow.
- Fehlendes `basename` in `team-app/src/main.jsx` führte zu absoluten statt relativen internen Redirects → behoben.

---

## 10. Bekannte technische Prüfpunkte (Stand 12.09.2026)

Diese Punkte wurden beim Codeabgleich für diese Dokumentation auffällig und sollten vor einem echten Einsatz verifiziert werden:

1. Mehrere Backend-Dateien tragen Kommentare wie „Kopfzeilen rekonstruiert — bitte mit dem Original abgleichen" (u. a. `admin/game/start.php`, `config.php`, `puzzles.php`). Funktional plausibel, aber nicht als hundertprozentig verifizierter Originalzustand zu behandeln.
2. Zeichenkodierung: Der Codeexport enthält an vielen Stellen falsch dekodierte Umlaute (z. B. „RÃ¤tsel" statt „Rätsel"). Zu prüfen, ob dies nur den Export/die Anzeige betrifft oder tatsächlich im Quelltext vorliegt (Encoding-Konsistenz UTF-8 vs. Latin-1 beim Editor/Export).
3. Admin-App `archiveRallye(id)` sendet `{ id }` als Body, das Backend (`admin/rallyes/archive.php`) erwartet laut Code jedoch `rallye_id` im Body — hier besteht ein Verdacht auf einen Feldnamen-Mismatch, der vor Produktivnutzung getestet werden sollte.
4. Zwei parallele Ermittlungsakte-Systeme sind aktuell im Code vorhanden: das ältere `team_story_clues`/`puzzles.story_clue_text`-System und das neuere Ermittler-Chat-System (`story_nodes`/`team_story_log`). Laut Planungsdokumenten sollte Ersteres nach vollständiger Migration entfernt werden — im aktuellen Code ist `submit.php` aber weiterhin so, dass beide Pfade gleichzeitig bedient werden.
5. `story_nodes` enthält im produktiven Schema zusätzliche Felder (`image_ref`, `media_type`, `is_root`, `related_node_id`), die im ursprünglichen SQL-Dokument (v3) noch nicht vorgesehen waren — das Datenbank-Dokument (03) verwendet den tatsächlichen Live-Stand.

---

**Konsolidiert aus:** 02_Technische_Spezifikation_PHP_v3.md, 05_Technische_Spezifikation_Ermittler_Chat_v1.md, sowie direktem Codeabgleich (Backend-Export, Stand 12.09.2026).
