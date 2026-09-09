# Technische Spezifikation: Viking-Schatz Rallye (PHP / MySQL / Hosting Basic) - Version 3

**Ersetzt:** 02_Technische_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 09.09.2026 (Code-Abgleich gegen JoeMiebach/cvjm-krimi-rallye; CI/CD-Deploy-Pipeline ergaenzt)

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
├── .github/workflows/ (deploy-backend.yml, deploy-frontend.yml)
├── backend/api/ (bootstrap.php, config.php.example, leaderboard.php, puzzles.php, stations.php,
│   lib/, admin/, auth/, puzzles/, stations/, system/, team/)
└── frontend/
    ├── team-app/src/ (screens/, context/, api/client.js)
    └── admin-app/src/ (screens/, context/, api/client.js)
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

**WICHTIG -- Dateisystem-Pfad vs. URL-Pfad:** Auf dem STRATO-Webspace ist der Ordner
`/stadtrallye` das Document-Root der Domain selbst, **kein** URL-Unterpfad. Das heisst:

| Dateisystem-Pfad (SFTP-Zielordner) | tatsaechliche Live-URL |
|---|---|
| `/stadtrallye/api` | `https://joe-miebach.de/api` |
| `/stadtrallye/team` | `https://joe-miebach.de/team` |
| `/stadtrallye/admin` | `https://joe-miebach.de/admin` |

Beim Vite-Build muss `--base` deshalb nur `/team/` bzw. `/admin/` sein (NICHT
`/stadtrallye/team/`), waehrend der SFTP `remote_path` weiterhin den vollen
Dateisystem-Pfad `/stadtrallye/team` bzw. `/stadtrallye/admin` nutzt. Eine Verwechslung
dieser beiden Pfade fuehrt zu einer weissen Seite mit Browserfehler "disallowed MIME type
(text/html)" beim Laden der JS-Assets, da der Browser die Assets unter der falschen URL
anfragt und stattdessen eine HTML-Fallback-Antwort erhaelt.

**CI/CD-Pipeline (GitHub Actions, ergaenzt 09.09.2026):**

- `.github/workflows/deploy-backend.yml`: Push auf `main` mit Aenderungen unter `backend/**`
  -> SFTP-Upload nach `/stadtrallye/api`.
- `.github/workflows/deploy-frontend.yml`: Push auf `main` mit Aenderungen unter `frontend/**`
  (oder manuell per `workflow_dispatch` im Actions-Tab) -> `npm ci && npm run build` fuer
  `team-app` und `admin-app` mit den o.g. `--base`-Pfaden, danach SFTP-Upload des jeweiligen
  `dist/`-Ordners nach `/stadtrallye/team` bzw. `/stadtrallye/admin`.
- Beide Workflows nutzen dieselben Repository-Secrets `STRATO_SFTP_HOST`, `STRATO_SFTP_USER`,
  `STRATO_SFTP_PASSWORD` und laufen mit `sftp_only: true` (STRATO Hosting Basic bietet nur
  SFTP, keinen vollen SSH-Shell-Zugriff -- die Action kann daher keine verschachtelten
  Zielordner selbst anlegen; bei einer kuenftigen Domain- oder Pfaenderung muessen die
  Zielordner inkl. `assets/`-Unterordner einmalig manuell angelegt werden).
- Build-Umgebungsvariablen (`VITE_API_BASE_URL`, `VITE_DEFAULT_RALLYE_ID`) werden direkt im
  Workflow gesetzt, da Vite sie zur Build-Zeit fest in die Dateien einbackt.

---

## Offener technischer Punkt: story_clue-Feld

`PuzzlesScreen.jsx` erwartet nach richtiger Antwort ein Feld `story_clue` in der Response von
`POST /puzzles/submit.php`, das der aktuelle Backend-Code noch nicht liefert. Siehe
API-Spezifikation v3 fuer Details.

---

## Offener technischer Punkt: Rallye-Auswahl im Admin-UI

`admin-app` nutzt aktuell die Build-Zeit-Konstante `VITE_DEFAULT_RALLYE_ID` (Platzhalter:
`1`) als fest codierten Ersatz, bis ein Dropdown zur Rallye-Auswahl im Admin-UI existiert.
Anders als in der Team-App (dort bestimmt der Startcode die Rallye) muss der Admin zwischen
mehreren Rallyes waehlen koennen, sobald mehr als eine Rallye gleichzeitig im System existiert
(z. B. bei Vorbereitung einer neuen Freizeit, waehrend die Daten der vorherigen noch
archiviert sind). Zu klaeren: woher bezieht das Dropdown die Liste verfuegbarer Rallyes
(neuer API-Endpunkt `GET /admin/rallyes.php`?), und wie wird die Auswahl ueber
Seitenaufrufe hinweg gespeichert (LocalStorage vs. Server-Session).

---

**Erstellt:** 31.08.2026 (v1 Node/VPS), 31.08.2026 (v2 PHP/MySQL), 09.09.2026 (v3 Code-Abgleich,
CI/CD-Pipeline und Deployment-Pfadstruktur ergaenzt)
**Version:** 3.0
