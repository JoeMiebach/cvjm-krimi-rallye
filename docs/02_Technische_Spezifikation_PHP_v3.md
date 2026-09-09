# Technische Spezifikation: Viking-Schatz Rallye (PHP / MySQL / Hosting Basic) - Version 3

**Ersetzt:** 02_Technische_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026, 13:14 Uhr (SPA-Rewrite-Fix fuer Reload/Direktaufruf ergaenzt)

## System-Architektur (aktualisiert)

```
+-------------------------------------------------------+
|  Frontend: ZWEI getrennte React+Vite+Tailwind-Apps     |
|  - team-app/   (Jugendteams)                            |
|  - admin-app/  (Spielleiter/Beobachter)                 |
|  - Statischer Build je App, per SFTP auf Hosting Basic   |
|  - react-router-dom (Routing), react-leaflet (Karten)    |
|  - PWA-faehig (Service Worker, Offline-Cache)            |
|  - QR-Code-Scanner (html5-qrcode Bibliothek)             |
|  - Geolocation API (GPS-Tracking)                        |
|  - Polling alle 10s statt WebSocket                       |
+-------------------------------------------------------+
                        |  HTTPS (Fetch/AJAX)
+-------------------------------------------------------+
|  Backend (PHP 8.3, klassisches Shared-Hosting)         |
|  - REST API (/api/*.php Endpunkte)                      |
|  - Token-Auth ueber Startcode (Team) / Login (Admin)     |
|  - Kein Dauerprozess, keine WebSockets, kein Cronjob     |
+-------------------------------------------------------+
                        |
+-------------------------------------------------------+
|  MySQL/MariaDB (STRATO SSD-Datenbank)                   |
|  - Multi-Rallye-Schema (rallye_id auf allen Tabellen)    |
|  - InnoDB, Foreign Keys, Indizes fuer Performance         |
+-------------------------------------------------------+
```

### Repository-Struktur (Ist-Stand)

```
cvjm-krimi-rallye/
├── .gitignore
├── README.md
├── docs/
├── backend/api/ (bootstrap.php, config.php.example, leaderboard.php, puzzles.php, stations.php,
│   lib/, admin/, auth/, puzzles/, stations/, system/, team/)
└── frontend/
    ├── team-app/src/ (screens/, context/, api/client.js), team-app/public/.htaccess
    └── admin-app/src/ (screens/, context/, api/client.js), admin-app/public/.htaccess
```

Beide Frontend-Apps nutzen `react-router-dom` fuer Routing und `react-leaflet` fuer Karten.

---

## Authentifizierung (unveraendert aus v2)

Startcode-basiertes Team-Login, E-Mail/Passwort-Admin-Login, HMAC-signierte Session-Tokens.
Siehe v2 fuer vollstaendige Beschreibung.

---

## Polling statt WebSockets (unveraendert aus v2)

Leaderboard/Broadcasts/Admin-Live-Ansicht: 10s Polling. GPS-Geofence-Check: 20-30s Polling.

---

## Geofencing-Logik (unveraendert aus v2)

```php
function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float {
    $R = 6371000;
    $phi1 = deg2rad($lat1);
    $phi2 = deg2rad($lat2);
    $deltaPhi = deg2rad($lat2 - $lat1);
    $deltaLambda = deg2rad($lon2 - $lon1);
    $a = sin($deltaPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($deltaLambda / 2) ** 2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}
```

---

## Lazy Cleanup der Standortdaten (KORRIGIERT in v3)

**Problem in v2:** loeschte Positionsdaten ALLER Teams sofort nach `game_end_time`,
unabhaengig vom Alter der Daten -- Live-Karte wurde nach Spielende sofort leer.

**Korrigierte Funktion** (`backend/api/lib/cleanup.php`):

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

Bereinigung jetzt altersbasiert (Standard 4h), nicht mehr an `game_end_time` gekoppelt.
Externer Cron-Trigger (`GET /system/cleanup.php`) bleibt als Sicherheitsnetz bestehen.

---

## Sicherheitskonzept (ergaenzt)

PDO Prepared Statements, bcrypt-Passworthashing, HMAC-signierte Tokens (unveraendert aus v2).

**NEU -- Pflicht-Regel fuer Secrets:** `config.php`/`config.local.php` MUESSEN in
`.gitignore` stehen. Bei versehentlichem Commit: vollstaendiger Git-History-Rewrite
(`git filter-repo` oder `git filter-branch`) PLUS Rotation aller betroffenen Zugangsdaten
(DB-Passwort, `token_secret`, `cleanup_secret`) ist Pflicht.

---

## Deployment (STRATO Hosting Basic)

Beide Frontends (`team-app`, `admin-app`) werden separat gebaut (`npm run build`) und per
SFTP in getrennte Verzeichnisse hochgeladen; Backend unveraendert nach `/api`.

**NEU -- SPA-Rewrite-Pflicht (09.09.2026):** Beide Apps nutzen `react-router-dom` mit
`BrowserRouter` (`basename="/admin"` bzw. `"/team"`) und erzeugen damit rein clientseitige
Routen wie `/admin/dashboard`. Diese Pfade existieren nicht als physische Dateien auf dem
Server -- nur `index.html` liegt dort. Ohne serverseitige Rewrite-Regel liefert Apache bei
einem Reload (F5), einem Lesezeichen oder einem direkten Aufruf einer solchen Unterroute
einen echten 404 (Apache-Standardfehlerseite, ca. 236 Byte), obwohl die App beim
Klick-Navigieren einwandfrei funktioniert. Fix: `public/.htaccess` in beiden Vite-Projekten
(`frontend/admin-app/public/.htaccess`, `frontend/team-app/public/.htaccess`), die alle
nicht-existierenden Pfade auf das jeweilige `index.html` umleitet. Vite kopiert den Inhalt von
`public/` unveraendert in den Build (`dist/`), sodass die `.htaccess` automatisch mit jedem
SFTP-Deploy in den richtigen Docroot-Unterordner gelangt -- kein Workflow-Update noetig.

---

## Story-Hinweis-Mechanik (RESOLVED, 09.09.2026)

Der fruehere "Offene technische Punkt: story_clue-Feld" ist geklaert (siehe
`00_Project_Brief_Entscheidungslog_v3.md`, Entschiedene Punkte, Punkt 14, und
`04_API_Spezifikation_PHP_v3.md`):

- `puzzles.story_clue_text` (nullable) traegt den Hinweistext pro Raetsel. Bonus-Raetsel ohne
  eigenen Story-Beitrag lassen dieses Feld `NULL`.
- `POST /puzzles/submit.php` liefert den Hinweis bei korrekter Antwort sofort im Response
  (`story_clue`) fuer ein Popup UND schreibt ihn zusaetzlich dauerhaft in die neue Tabelle
  `team_story_clues` (`team_id`, `puzzle_id`, `story_clue_text`, `unlocked_at`, UNIQUE auf
  `team_id`+`puzzle_id`).
- `GET /team/clues.php` liest ausschliesslich aus `team_story_clues` und zeigt damit alle
  bisher freigeschalteten Hinweise dauerhaft an, unabhaengig vom Popup-Zeitpunkt.
- Beide Tabellen/Felder existierten bereits im produktiven Live-Schema (verifiziert gegen
  Datenbank-Export vom 09.09.2026); nur `backend/api/puzzles/submit.php` musste entsprechend
  korrigiert werden (nutzte zuvor faelschlich `stations.story_text`).

---

**Erstellt:** 31.08.2026 (v1 Node/VPS), 31.08.2026 (v2 PHP/MySQL), 09.09.2026 (v3 Code-Abgleich)
**Version:** 3.0
