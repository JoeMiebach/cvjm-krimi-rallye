# Technische Spezifikation: Viking-Schatz Rallye (PHP / MySQL / Hosting Basic) – Version 3


**Ersetzt:** 02_Technische_Spezifikation_PHP.md (v2.0, bitte archivieren)
**Stand:** 10.09.2026, 02:15 Uhr (BUGFIX: discovery_mode-Naming korrigiert)


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
├── backend/api/
│   ├── bootstrap.php, config.php.example
│   ├── leaderboard.php, puzzles.php, stations.php
│   ├── lib/ (cleanup.php, story.php, etc.)
│   ├── admin/ (rallyes.php, teams.php, stations.php, puzzles.php,
│   │           story-nodes.php, story-node-options.php, suspects.php,
│   │           photo-submissions.php, broadcast-templates.php, etc.)
│   ├── auth/ (check-code.php, register.php, login.php, admin-login.php)
│   ├── puzzles/ (hint.php, submit.php)
│   ├── stations/ (unlock.php)
│   ├── system/ (cleanup.php)
│   └── team/ (me.php, chat.php, chat/respond.php, open-tasks.php,
│              suspects.php, photos/submit.php, avatars/upload.php, etc.)
└── frontend/
    ├── team-app/src/ (screens/, context/, api/client.js, offline/queue.js)
    └── admin-app/src/ (screens/, context/, api/client.js)
```


Beide Frontend-Apps nutzen `react-router-dom` fuer Routing und `react-leaflet` fuer Karten.


---


## Authentifizierung (unveraendert aus v2)


Startcode-basiertes Team-Login, E-Mail/Passwort-Admin-Login, HMAC-signierte Session-Tokens.


---


## Polling statt WebSockets (unveraendert aus v2)


Leaderboard/Broadcasts/Admin-Live-Ansicht/Chat: 10s Polling. GPS-Geofence-Check: 20–30s Polling.


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


**Problem in v2:** loeschte Positionsdaten ALLER Teams sofort nach `game_end_time`.


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


---


## Sicherheitskonzept (ergaenzt)


PDO Prepared Statements, bcrypt-Passworthashing, HMAC-signierte Tokens.


**NEU – Pflicht-Regel fuer Secrets:** `config.php`/`config.local.php` MUESSEN in
`.gitignore` stehen. Bei versehentlichem Commit: vollstaendiger Git-History-Rewrite
PLUS Rotation aller betroffenen Zugangsdaten (DB-Passwort, `token_secret`, `cleanup_secret`).


---


## Deployment (STRATO Hosting Basic)


Beide Frontends (`team-app`, `admin-app`) werden separat gebaut (`npm run build`) und per
SFTP in getrennte Verzeichnisse hochgeladen; Backend unveraendert nach `/api`.


**SPA-Rewrite-Pflicht:** Beide Apps nutzen `react-router-dom` mit `BrowserRouter`
(`basename="/admin"` bzw. `"/team"`) und erzeugen damit rein clientseitige Routen.
Fix: `public/.htaccess` in beiden Vite-Projekten.


**NACHTRAG (09.09.2026, 13:20 Uhr) – Workflow-Fix:** Deploy-Action matched bei Wildcard-Glob
`dist/*` KEINE Dotfiles. Fix: zusaetzlicher Einzeldatei-Upload-Schritt pro App.


**NACHTRAG (09.09.2026, 13:41 Uhr) – fehlendes `basename` in team-app:** `basename="/team"`
ergaenzt.


---


## Story-Hinweis-Mechanik (RESOLVED, 09.09.2026)


- `puzzles.story_clue_text` (nullable) traegt den Hinweistext pro Raetsel.
- `POST /puzzles/submit.php` liefert den Hinweis bei korrekter Antwort sofort im Response
  (`story_clue`) UND schreibt ihn dauerhaft in `team_story_clues`.
- `GET /team/clues.php` liest ausschliesslich aus `team_story_clues`.
- Beide Tabellen/Felder existierten bereits im produktiven Live-Schema.


---


## Ermittler-Chat-System (NEU, Phase A–F abgeschlossen)


Das Ermittler-Chat-System ersetzt die alte "Ermittlungsakte" vollstaendig. Teams chatten mit
Freya Lindqvist (Kriminalbeamte) und erhalten ueber den Chat:
- Story-Informationen
- Aufgaben (Stationen loesen, Puzzles, Fotos einreichen)
- Interaktive Entscheidungen (Buttons, Text, Zahl)


### Chat-Architektur


- Jeder Chat-Knoten (`story_nodes`) hat einen `node_key` (z.B. 'intro', 'suspect_erik')
- `response_type` bestimmt die Eingabe: `buttons`, `text`, `number`, `puzzle_ref`, `photo_ref`, `none`
- `chat_deliveries` trackt pro Team, welcher Knoten geliefert + beantwortet wurde
- Bei `buttons`: `story_node_options` mit `next_node_key` + `is_correct`


### Antworttypen


| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| `buttons` | Team klickt eine Option | "Wen willst du anklagen?" → Erik, Lena, Niemand |
| `text` | Freie Texteingabe | "Gib das Codewort ein" |
| `number` | Zahleneingabe | "Wie viele Schritte waren es?" |
| `puzzle_ref` | Verweis auf Rätsel | "Loese zuerst das Stations-Rä±±tsel" |
| `photo_ref` | Foto-Upload | "Mache ein Foto vom Tatort" |
| `none` | Nur Info, keine Antwort | "Hier ist ein Hinweis..." |


### Medien (Phase F)


- `story_nodes.media_type` + `media_url`: Audio/Video-Clips, unabhaengig von `response_type`
- Wird im Chat mit nativen `<audio>`/`<video>`-Playern gerendert


### Verdä±±chtige-System (Phase C)


- `suspects`-Tabelle mit `is_culprit`-Flag
- Bei falscher Anklage: `reaction_text` wird angezeigt


### Foto-Einreichungen (Phase E)


- `photo_submissions`-Tabelle
- Admin prueft im Backend und vergibt Punkte


### Avatare (Phase F)


- `teams.avatar_url`
- Upload ueber `/api/team/avatars/upload.php`
- Avatar wird im Chat-Header angezeigt


### Offline-Warteschlange (Phase F)


- `src/offline/queue.js` (IndexedDB)
- Speichert `respond`- und `photo`-Aktionen bei Netzwerkfehler
- Retry beim `online`-Event


### Admin-UI


- Story-Knoten, Optionen, Verdä±±chtige: CRUD im Admin-Bereich
- Foto-Einreichungen: Review + Punktevergabe
- Broadcast-Vorlagen: CRUD (API vorhanden, UI teilweise)


---


## BUGFIX: discovery_mode-Naming (10.09.2026)


**Problem:** Das DB-Schema definiert `discovery_mode ENUM('lead_only','proximity','both')`,
aber im Frontend wurde versehentlich `'leadonly'` (ohne Unterstrich) verwendet.

**Folgen:**
- Stationen wurden nie korrekt mit `discovery_mode='lead_only'` gespeichert
- Kartenfilterung im Team-Frontend griff nicht zuverlaessig
- Lead-only-Station-Freischaltung ueber Ermittler-Chat funktionierte nicht

**Fix:**
- `StationsMapScreen.jsx`: Filterlogik von `'leadonly'` auf `'lead_only'` korrigiert

---


**Erstellt:** 31.08.2026 (v1 Node/VPS), 31.08.2026 (v2 PHP/MySQL), 09.09.2026 (v3 Code-Abgleich, Phase F abgeschlossen), 10.09.2026 (BUGFIX)
**Version:** 3.1
