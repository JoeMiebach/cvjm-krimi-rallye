# Backend-Dokumentation

**PHP 8.3 REST-API — vollständige Ordnerstruktur und Funktionsreferenz**
**Stand:** 12.09.2026, erstellt aus vollständigem Codeexport (`backend/`, 57 Dateien) + GitHub-Abgleich

---

## 1. Ordnerstruktur

```
backend/api/
├── .htaccess
├── bootstrap.php
├── config.php                  (rekonstruierte Kopfzeilen, siehe Hinweis unten)
├── config.php.example
├── leaderboard.php
├── puzzles.php
├── stations.php
├── admin/
│   ├── broadcast.php
│   ├── broadcasts.php
│   ├── broadcast-templates.php
│   ├── dashboard.php
│   ├── leaderboard.php
│   ├── photo-submissions.php
│   ├── positions.php
│   ├── puzzles.php
│   ├── rallyes.php
│   ├── start-codes.php
│   ├── stations.php
│   ├── story-node-options.php
│   ├── story-nodes.php
│   ├── suspects.php
│   ├── teams.php
│   ├── game/
│   │   ├── end.php
│   │   ├── pause.php
│   │   ├── reset.php
│   │   └── start.php
│   ├── media/
│   │   └── upload.php
│   ├── photo-submissions/
│   │   └── award.php
│   ├── rallyes/
│   │   └── archive.php
│   ├── start-codes/
│   │   └── generate.php
│   ├── stations/
│   │   └── unlock-for-team.php
│   └── teams/
│       └── reset-progress.php
├── auth/
│   ├── admin-login.php
│   ├── check-code.php
│   ├── login.php
│   └── register.php
├── lib/
│   ├── auth.php
│   ├── cleanup.php
│   ├── db.php
│   ├── game.php
│   ├── geofence.php
│   ├── response.php
│   └── story.php
├── puzzles/
│   ├── hint.php
│   └── submit.php
├── stations/
│   └── unlock.php
├── system/
│   └── cleanup.php
└── team/
    ├── avatars/                (Upload-Zielordner)
    ├── broadcasts.php
    ├── chat.php
    ├── check-geofence.php
    ├── clues.php
    ├── completed-tasks.php
    ├── me.php
    ├── open-tasks.php
    ├── progress.php
    ├── suspects.php
    ├── chat/
    │   └── respond.php
    └── photos/
        └── submit.php
```

---

## 2. `lib/` — Gemeinsame Bibliotheksfunktionen

### `lib/response.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `jsonResponse(int $statusCode, array $data): void` | HTTP-Status, Datenarray | sendet JSON-Response, `exit` |
| `jsonError(int $statusCode, string $message): void` | HTTP-Status, Fehlermeldung | ruft `jsonResponse` mit `{success:false, error:$message}` |
| `requireMethod(string $method): void` | erwartete HTTP-Methode | 405-Fehler falls Methode nicht passt |
| `requireMethods(array $methods): void` | Liste erlaubter Methoden | 405-Fehler falls nicht enthalten |
| `getJsonBody(): array` | — | dekodierter JSON-Body, 400 bei ungultigem JSON |
| `requireFields(array $data, array $fields): void` | Datenarray, Pflichtfeldnamen | 400 mit Liste fehlender Felder |

### `lib/db.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `getDb(): PDO` | — | Singleton-PDO-Verbindung, liest `config.local.php` |
| `getAppConfig(): array` | — | Inhalt von `config.local.php` |
| `logError(string $message): void` | Fehlertext | schreibt Zeile in `logs/error.log` |
| `logAdminAction(PDO $pdo, ?int $adminId, ?int $rallyeId, string $action, array $details = []): void` | Admin-ID, Rallye-ID, Aktionsname, Detail-Array | Insert in `admin_log`, `details` als JSON |

### `lib/auth.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `createToken(array $payload, int $ttlSeconds = 21600): string` | Payload-Array, Gültigkeitsdauer in Sekunden | signiertes Token `base64payload.signatur` |
| `verifyToken(string $token): ?array` | Token-String | dekodiertes Payload-Array oder `null` bei Ungultigkeit/Ablauf |
| `getBearerToken(): ?string` | — | Token aus `Authorization: Bearer ...`-Header |
| `requireTeamAuth(): array` | — | Team-Datensatz (assoziatives Array); 401 bei Fehlschlag |
| `requireAdminAuth(): array` | — | Admin-Datensatz, nur Rolle `admin`; 403 bei Viewer-Rolle |
| `requireAdminOrViewerAuth(): array` | — | Admin-Datensatz, Rolle `admin` oder `viewer` |
| `requireRallyeAccess(int $rallyeId, array $entity): void` | Ziel-Rallye-ID, Entitat mit `rallye_id`-Feld | 403 bei Cross-Rallye-Zugriff |
| `checkRateLimit(string $key, int $maxAttempts = 10, int $windowSeconds = 60): void` | eindeutiger Schlussel (z. B. IP+Endpunkt) | 429 bei Uberschreitung, sonst kein Ruckgabewert |

### `lib/geofence.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float` | zwei Koordinatenpaare | Distanz in Metern (Haversine-Formel) |

### `lib/game.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `requireGameRunning(PDO $pdo, int $rallyeId): void` | Rallye-ID | kein Ruckgabewert; 403 mit passender Meldung, falls Spiel pausiert/nicht gestartet/beendet; 404 falls Rallye fehlt |

### `lib/cleanup.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `cleanupExpiredPositions(PDO $pdo, int $maxAgeHours = 4): int` | max. Alter in Stunden | Anzahl bereinigter Zeilen |

### `lib/story.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `deliverNode(PDO $pdo, int $teamId, int $nodeId): void` | Team-ID, Knoten-ID | kein Ruckgabewert; stellt Knoten zu, kaskadiert bei Info-Knoten automatisch |
| `awardStoryPoints(PDO $pdo, int $teamId, int $points): void` | Team-ID, Punktzahl | addiert Punkte zu `team_progress.total_points` |
| `deliverRootNodesIfNeeded(PDO $pdo, int $teamId, int $rallyeId): void` | Team-ID, Rallye-ID | stellt alle `is_root=1`-Knoten zu, falls Team noch keinen Log-Eintrag hat |
| `evaluateProactiveNodes(PDO $pdo, int $teamId, int $rallyeId): void` | Team-ID, Rallye-ID | pruft und stellt fallige proaktive Knoten zu (Inaktivitat/Fehlversuche) |

---

## 3. Öffentliche Endpunkte

### `GET /config.php?rallye_id=`
Kein Auth erforderlich.
**Response 200:**
```json
{
  "rallye_id": 14,
  "rallye_name": "...",
  "rallye_city": "...",
  "rallye_country": "...",
  "description": "...",
  "story_intro": "...",
  "max_teams": 10,
  "time_limit_minutes": 120,
  "is_game_running": true,
  "is_paused": false,
  "has_started": true,
  "game_end_time": "2026-09-12 01:36:38"
}
```

### `POST /auth/check-code.php`
Body: `{ "code": "SNB-TEST-01" }`
Response: `{ "valid": true, "already_registered": false }` oder `{ "valid": false, "error": "..." }` (400)

### `POST /auth/register.php`
Body: `{ "code": "...", "team_name": "..." }`
Response 201: `{ "success": true, "team": { "id": 33, "name": "...", "rallye_id": 14 }, "token": "..." }`
Setzt zusatzlich Cookie `team_code`.

### `POST /auth/login.php`
Body: `{ "code": "..." }`
Response 200: analog zu `register.php`, ohne Teamname-Vergabe.

### `POST /auth/admin-login.php`
Body: `{ "email": "...", "password": "..." }`
Response 200: `{ "success": true, "admin": { "id": 1, "name": "...", "role": "admin" }, "token": "..." }`
Rate-limitiert uber `checkRateLimit()`.

---

## 4. Team-Endpunkte

| Methode | Endpunkt | Auth | Beschreibung |
|---|---|---|---|
| GET | `/team/me.php` | Team | Eigene Team-Daten inkl. `avatar_url` |
| GET | `/stations.php?rallye_id=` | Team | Stationen inkl. Status (`locked`/`discovered`/`unlocked`) |
| POST | `/stations/unlock.php` | Team | QR-Freischaltung |
| POST | `/team/check-geofence.php` | Team | GPS-Position melden, Geofence-Stationen prufen |
| GET | `/puzzles.php?station_id=` | Team | Ratsel einer Station inkl. Losungsstatus |
| POST | `/puzzles/hint.php` | Team | Hinweis anfordern |
| POST | `/puzzles/submit.php` | Team | Antwort einreichen |
| GET | `/team/progress.php` | Team | Eigener Fortschritt |
| GET | `/leaderboard.php?rallye_id=` | Team | Rangliste |
| GET | `/team/broadcasts.php?since=` | Team | Neue Broadcasts seit Zeitstempel |
| GET | `/team/chat.php` | Team | Vollstandiger Chat-Verlauf, inkl. proaktive Zustellung |
| POST | `/team/chat/respond.php` | Team | Antwort auf Chat-Knoten |
| GET | `/team/open-tasks.php` | Team | Unbeantwortete Chat-Knoten |
| GET | `/team/completed-tasks.php` | Team | Abgeschlossene Chat-Knoten |
| GET | `/team/suspects.php` | Team | Bisher entdeckte Verdachtige |
| POST | `/team/photos/submit.php` | Team | Foto-Einreichung (multipart) |
| POST | `/team/avatars/upload.php` | Team | Avatar-Upload (multipart) |
| GET | `/team/clues.php` | Team | Legacy-Ermittlungsakte (aus `team_story_clues`) |

### `GET /stations.php?rallye_id=`
**Response 200:**
```json
{ "success": true, "stations": [ { "id": 249, "title": "...", "status": "unlocked|discovered|locked", "unlock_type": "qr|gps|manual|auto", "discovery_mode": "lead_only|proximity|both", "latitude": 51.004, "longitude": 7.454, "geofence_radius_meters": 50, "points": 25 } ] }
```

### `POST /stations/unlock.php`
Body: `{ "station_id": 249, "qr_code": "VIKING2026-KIRCHE-SCHNELLENBACH" }`
Response 200: `{ "success": true }`; Fehler bei falschem/fehlendem QR-Code oder bereits freigeschalteter Station.

### `POST /team/check-geofence.php`
Body: `{ "latitude": 51.004, "longitude": 7.454 }`
Response 200: `{ "success": true, "newly_unlocked_stations": [ { "id": 249, "title": "..." } ] }`

### `GET /puzzles.php?station_id=`
**Response 200:**
```json
{ "success": true, "puzzles": [ {
  "id": 1057, "type": "number", "question": "...", "media_url": null,
  "points": 25, "time_limit_seconds": null, "max_attempts": 3,
  "attempts_used": 0, "is_solved": false,
  "options": ["..."]  // nur bei type=multiple_choice, gemischt, ohne is_correct
} ] }
```
403 falls Station nicht freigeschaltet (`unlocked_at IS NOT NULL` ODER `unlock_type='auto'`).

### `POST /puzzles/hint.php`
Body: `{ "puzzle_id": 1057 }`
Response 200: `{ "success": true, "hint": "...", "hint_penalty": 5 }`
409 falls Ratsel bereits gelost.

### `POST /puzzles/submit.php`
Body: `{ "puzzle_id": 1057, "answer": "3", "hint_used": false }`
**Response 200 (korrekt):**
```json
{
  "success": true, "is_correct": true, "is_solved": true,
  "points_earned": 25, "message": "Richtig! +25 Punkte",
  "story_clue": "..." ,
  "next_node_id": 293
}
```
**Response 200 (falsch, Versuche ubrig):** `{ "success": true, "is_correct": false, "attempts_remaining": 2, "message": "Falsch. Noch 2 Versuche." }`
**Response 200 (falsch, keine Versuche mehr):** `{ "success": true, "is_correct": false, "attempts_remaining": 0, "message": "Falsch. Keine Versuche mehr ubrig." }`
Lost bei korrekter Antwort automatisch den verknupften Chat-Knoten aus (`deliverNode()`) und schreibt — sofern gesetzt — weiterhin `story_clue_text` in `team_story_clues` (Legacy-Pfad, siehe Datenbank-Dokument).

### `GET /team/chat.php`
Pruft vor der Antwort proaktive Knoten (`evaluateProactiveNodes()`) und Root-Knoten (`deliverRootNodesIfNeeded()`).
**Response 200:**
```json
{ "success": true, "chat": [ {
  "node_id": 289, "type": "answer", "message_text": "...",
  "image_url": null, "media_type": "none", "media_url": null,
  "map_latitude": null, "map_longitude": null,
  "response_type": "puzzle_ref", "station_id": 248, "puzzle_id": 1056,
  "options": [ { "id": 275, "label": "..." } ],
  "delivered_at": "...", "is_completed": false, "team_response": null
} ] }
```

### `POST /team/chat/respond.php`
Body: `{ "node_id": 288, "response": "275" }` (Button-Option-ID) oder `{ "node_id": 289, "response": "1523" }` (Text/Zahl)
**Response 200 (korrekt):** `{ "success": true, "is_correct": true, "message": "...", "unlocked_nodes": [289], "points_earned": 0 }`
**Response 200 (falsch):** `{ "success": true, "is_correct": false, "message": "...", "reaction_text": "..." }` — chat-nativ, kein Punktabzug, keine Versuchsgrenze.
Bei `type='twist'` mit `blocks_alternate_node_id`: deaktiviert den alternativen Pfad fur dieses Team. Bei `type='accusation'`: pruft gegen `suspects.is_guilty`, Bonus nur bei `attempts === 1`.

### `GET /team/open-tasks.php`
**Response 200:** `{ "success": true, "open_tasks": [ { "node_id", "delivered_at", "type", "message_text", "image_url", "map_latitude", "map_longitude", "response_type", "station_id", "puzzle_id" } ] }`
Filtert Buttons-Knoten mit ≤1 Option per `HAVING`-Klausel heraus (siehe Fix vom 12.09.2026).

### `GET /team/completed-tasks.php`
Analoge Struktur zu `open-tasks.php`, jedoch `is_completed = 1`.

### `GET /team/suspects.php`
**Response 200:** `{ "success": true, "suspects": [ { "id", "name", "portrait_icon" } ] }` — nur bereits uber `reveals_suspect_id` entdeckte Verdachtige.

### `POST /team/photos/submit.php`
**Vollstandig verifiziert (GitHub, SHA: c295469d):**
`multipart/form-data`: `node_id`, `photo` (Datei)

**Validierung:**
- `node_id` vorhanden und > 0 → sonst 400
- Knoten wurde Team zugestellt → sonst 404
- `response_type = 'photo_ref'` → sonst 400
- Noch nicht abgeschlossen (`is_completed = 0`) → sonst 409
- Datei: JPEG/PNG/WebP, max. 8 MB → sonst 400

**Dateiablage:** `/uploads/photos/team<teamId>_node<nodeId>_<timestamp>.<ext>`

**Datenbank:**
```sql
INSERT INTO photo_submissions (team_id, node_id, photo_path) VALUES (?, ?, ?);
UPDATE team_story_log SET is_completed = 1, responded_at = NOW(), team_response = ? WHERE id = ?;
```

**Response 201:** `{ "success": true, "photo_path": "/uploads/photos/..." }`

**Punkte:** Keine automatische Punktevergabe — Admin vergibt Bonus uber `/admin/photo-submissions/award.php`.

### `POST /team/avatars/upload.php`
**Vollstandig verifiziert (GitHub, SHA: 2c8181b9):**
`multipart/form-data`: `avatar` (Datei)

**Validierung:**
- Datei vorhanden, `UPLOAD_ERR_OK` → sonst 400
- MIME-Type: `image/jpeg`, `image/png`, `image/webp` → sonst 400
- Max. 2 MB → sonst 400

**Dateiablage:** `/uploads/avatars/team<teamId>_<timestamp>.<ext>`

**Datenbank:**
```sql
UPDATE teams SET avatar_url = ? WHERE id = ?
```

**Response 200:** `{ "success": true, "avatar_url": "/uploads/avatars/..." }`

---

## 5. Admin-Endpunkte

| Methode | Endpunkt | Auth | Beschreibung |
|---|---|---|---|
| GET | `/admin/dashboard.php?rallye_id=` | Admin/Viewer | Dashboard-Kennzahlen |
| GET | `/admin/leaderboard.php?rallye_id=` | Admin/Viewer | Detaillierte Rangliste |
| GET | `/admin/positions.php?rallye_id=` | Admin/Viewer | Live-Positionen aller aktiven Teams |
| GET/POST | `/admin/broadcast.php`, `/admin/broadcasts.php` | Admin (POST) / Admin+Viewer (GET) | Broadcast senden/Verlauf lesen |
| GET/POST/PUT/DELETE | `/admin/broadcast-templates.php` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Broadcast-Vorlagen |
| GET/POST/PUT | `/admin/rallyes.php` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Rallyes |
| POST | `/admin/rallyes/archive.php` | Admin | Rallye archivieren |
| GET | `/admin/start-codes.php?rallye_id=` | Admin/Viewer | Alle Startcodes (benutzt+unbenutzt) |
| POST | `/admin/start-codes/generate.php` | Admin | Neue Startcodes erzeugen |
| GET/PUT/DELETE | `/admin/teams.php` | Admin (PUT/DELETE) / Admin+Viewer (GET) | Teams verwalten |
| POST | `/admin/teams/reset-progress.php` | Admin | Fortschritt eines Teams zurucksetzen |
| GET/POST/PUT/DELETE | `/admin/stations.php` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Stationen |
| POST | `/admin/stations/unlock-for-team.php` | Admin | Manuelle Freischaltung fur ein Team |
| GET/POST/PUT/DELETE | `/admin/puzzles.php?station_id=` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Ratsel inkl. Antworten |
| GET/POST/PUT/DELETE | `/admin/story-nodes.php?rallye_id=` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Chat-Knoten |
| GET/POST/PUT/DELETE | `/admin/story-node-options.php?node_id=` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Knoten-Optionen |
| GET/POST/PUT/DELETE | `/admin/suspects.php?rallye_id=` | Admin (Schreiben) / Admin+Viewer (Lesen) | CRUD Verdachtige |
| GET | `/admin/photo-submissions.php?rallye_id=` | Admin/Viewer | Liste aller Foto-Einsendungen |
| POST | `/admin/photo-submissions/award.php` | Admin | Bonus-Punkte fur Einsendung vergeben |
| POST | `/admin/media/upload.php` | Admin | Bild/Audio/Video-Upload (multipart) |
| POST | `/admin/game/start.php` | Admin | Spiel starten/fortsetzen |
| POST | `/admin/game/pause.php` | Admin | Spiel pausieren |
| POST | `/admin/game/end.php` | Admin | Spiel beenden |
| POST | `/admin/game/reset.php` | Admin | Rallye-Fortschritt vollstandig zurucksetzen |

### `GET /admin/dashboard.php?rallye_id=`
**Response 200:**
```json
{ "success": true, "dashboard": {
  "team_count": 3, "active_teams": 1, "station_count": 6,
  "is_game_running": true, "is_paused": false, "has_started": true,
  "game_end_time": "...", "remaining_seconds": 3542
} }
```

### `POST /admin/broadcast.php`
Body: `{ "rallye_id": 14, "message_text": "...", "target_team_ids": [33,34] }` (`target_team_ids` optional, `null` = alle)
Response 201: `{ "success": true, "broadcast_id": 7 }`

### `GET /admin/start-codes.php?rallye_id=`
**Response 200:**
```json
{ "success": true, "start_codes": [
  { "id": 62, "code": "SNB-TEST-01", "is_used": 1, "used_by_team_id": 33, "team_name": "Team Wolf", "created_at": "..." }
] }
```

### `POST /admin/start-codes/generate.php`
Body: `{ "rallye_id": 14, "count": 5 }` (1–200)
Response 201: `{ "success": true, "codes": ["AB3C7DXQ", "..."] }`

### `GET/POST/PUT/DELETE /admin/puzzles.php`
GET liefert pro Ratsel zusatzlich `answers: [{ id, answer_text, is_correct }]`. POST/PUT-Body erlaubt optionales `answers`-Array — bei PUT werden bestehende Antworten vollstandig ersetzt (Delete + Insert).

### `GET/POST/PUT/DELETE /admin/stations.php`
Feld-Whitelist bei POST/PUT: `title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active`. Validiert `unlock_type` gegen `['qr','gps','manual','auto']` und `discovery_mode` gegen `['lead_only','proximity','both']`.

### `GET/POST/PUT/DELETE /admin/story-nodes.php`
POST erfordert `rallye_id, type, message_text, response_type`. Feld-Whitelist bei PUT umfasst zusatzlich `is_active`. Validiert `media_type` gegen `['none','audio_ref','video_ref','image_ref']`.

### `GET/POST/PUT/DELETE /admin/story-node-options.php`
POST erfordert `node_id, label`. Felder: `label, correct_value, leads_to_node_id, blocks_alternate_node_id, unlocks_suspect_id, unlocks_station_id`.

### `GET/POST/PUT/DELETE /admin/suspects.php`
POST erfordert `rallye_id, name`. Felder: `name, portrait_icon, is_guilty, wrong_pick_reaction_text`.

### `GET /admin/photo-submissions.php?rallye_id=`
**Response 200:**
```json
{ "success": true, "photo_submissions": [ {
  "id", "team_id", "team_name", "node_id", "node_message",
  "photo_path", "submitted_at", "points_awarded_at", "points_awarded_by_admin_id"
} ] }
```

### `POST /admin/photo-submissions/award.php`
Body: `{ "submission_id": 1, "points": 15 }`
Response 200: `{ "success": true }`; 409 falls bereits bewertet, 404 falls nicht gefunden.

### `POST /admin/media/upload.php`
`multipart/form-data`: `rallye_id`, `file_type` (`image|audio|video`), `file`
Limits: Bild 5 MB, Audio/Video 20 MB. Erlaubte Endungen: `jpg/jpeg/png/webp`, `mp3/wav/ogg`, `mp4/webm/mov`.
Response 201: `{ "success": true, "media_id": 12, "url": "/uploads/14/story/<uuid>.jpg" }`
**Hinweis:** schreibt in Tabelle `media_library` — im gesichteten DB-Export nicht vorgefunden (siehe Datenbank-Dokument, Abschnitt 3).

### `POST /admin/game/start.php`
Body: `{ "rallye_id": 14 }`
Unterscheidet Erststart (setzt `game_start_time` + berechnet `game_end_time` aus `time_limit_minutes`) und Fortsetzen nach Pause (verschiebt `game_end_time` um die Pausendauer).

### `POST /admin/game/reset.php`
Body: `{ "rallye_id": 14, "confirm": true }`
Loscht `team_attempts`, `station_unlocks`, `team_progress`, `teams`, `broadcasts`, `start_codes` der Rallye; setzt Zeitfelder zuruck. **Destruktive Operation.**

### `POST /admin/teams/reset-progress.php`
Body: `{ "team_id": 33 }`
Loscht `team_attempts` und `station_unlocks` des Teams, setzt `team_progress`-Zahler auf 0.

---

## 6. System-Endpunkt

### `GET /system/cleanup.php?token=<cleanup_secret>`
**Vollstandig verifiziert (GitHub, SHA: 42ea00ac):**

**Voraussetzungen:**
- Methode: `GET`
- Query-Parameter: `token`
- Token-Vergleich: `hash_equals((string) $config['cleanup_secret'], $token)`

**Response 401 (ungultiges Token):**
```json
{ "success": false, "error": "Ungultiges Cleanup-Token" }
```

**Response 200 (Erfolg):**
```json
{ "success": true, "cleaned_teams": 3 }
```

Ruft `cleanupExpiredPositions($pdo, 4)` auf und gibt die Anzahl bereinigter Teams zuruck.

---

## 7. Fehlercodes (durchgangiges Schema)

| Code | Bedeutung |
|---|---|
| 400 | Fehlende/ungultige Parameter |
| 401 | Nicht authentifiziert / Token ungultig oder abgelaufen |
| 403 | Authentifiziert, aber keine Berechtigung (z. B. Viewer bei Schreibzugriff) oder Spiel nicht aktiv |
| 404 | Ressource nicht gefunden |
| 405 | HTTP-Methode nicht erlaubt |
| 409 | Konflikt (z. B. bereits gelost, bereits bewertet, bereits registriert) |
| 429 | Rate-Limit uberschritten |
| 500 | Interner Serverfehler |

Alle Fehlerantworten folgen dem Format: `{ "success": false, "error": "<Meldung>" }`.

---

## 8. Bekannte Detailpunkte fur die Weiterentwicklung

1. **Feldnamen-Mismatch** bei `archiveRallye()` — Client sendet `{ id }`, Backend erwartet `{ rallye_id }` (laut Code in `admin/rallyes/archive.php`). Vor Produktivnutzung testen.
2. `media_library`-Tabelle im DB-Export nicht gefunden, aber von `admin/media/upload.php` beschrieben — vor Produktivbetrieb prufen, ob Tabelle existiert.
3. Zwei parallele Ermittlungsakte-Systeme (`team_story_clues` + `team_story_log`) — Migration noch nicht abgeschlossen, beide Pfade werden parallel bedient.

---

**Quelle:** Vollstandiger Codeexport `backend/` (57 Dateien, Stand 12.09.2026) + GitHub-Abgleich (`team/avatars/upload.php`, `team/photos/submit.php`, `system/cleanup.php`).