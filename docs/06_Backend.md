# Backend-Dokumentation

**PHP 8.3 REST-API — vollständige Ordnerstruktur und Funktionsreferenz**
**Stand:** 13.09.2026, erstellt aus vollständigem Codeexport (`backend/`, 56 Dateien) + GitHub-Abgleich

---

## 1. Ordnerstruktur

```
backend/
├── migrations/
│   └── 009_remove_legacy_ermittlungsakte.sql
└── api/
    ├── .htaccess
    ├── bootstrap.php
    ├── config.php
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
        ├── avatars/
        │   └── upload.php
        ├── broadcasts.php
        ├── chat.php
        ├── check-geofence.php
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
| `getJsonBody(): array` | — | dekodierter JSON-Body, 400 bei ungültigem JSON |
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
| `verifyToken(string $token): ?array` | Token-String | dekodiertes Payload-Array oder `null` bei Ungültigkeit/Ablauf |
| `getBearerToken(): ?string` | — | Token aus `Authorization: Bearer ...`-Header |
| `requireTeamAuth(): array` | — | Team-Datensatz (assoziatives Array); 401 bei Fehlschlag |
| `requireAdminAuth(): array` | — | Admin-Datensatz, nur Rolle `admin`; 403 bei Viewer-Rolle |
| `requireAdminOrViewerAuth(): array` | — | Admin-Datensatz, Rolle `admin` oder `viewer` |
| `requireRallyeAccess(int $rallyeId, array $entity): void` | Ziel-Rallye-ID, Entität mit `rallye_id`-Feld | 403 bei Cross-Rallye-Zugriff |
| `checkRateLimit(string $key, int $maxAttempts = 10, int $windowSeconds = 60): void` | eindeutiger Schlüssel (z. B. `endpunktname . '_' . $_SERVER['REMOTE_ADDR']`) | 429 bei Überschreitung, sonst kein Rückgabewert. Dateibasiert (`logs/ratelimit/<key>.json`), kein DB-Zugriff nötig. |

### `lib/geofence.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float` | zwei Koordinatenpaare | Distanz in Metern (Haversine-Formel) |

### `lib/game.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `requireGameRunning(PDO $pdo, int $rallyeId): void` | Rallye-ID | kein Rückgabewert; 403 mit passender Meldung, falls Spiel pausiert/nicht gestartet/beendet; 404 falls Rallye fehlt |

### `lib/cleanup.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `cleanupExpiredPositions(PDO $pdo, int $maxAgeHours = 4): int` | max. Alter in Stunden | Anzahl bereinigter Zeilen |

### `lib/story.php`
| Funktion | Parameter | Rückgabe |
|---|---|---|
| `deliverNode(PDO $pdo, int $teamId, int $nodeId): void` | Team-ID, Knoten-ID | kein Rückgabewert; stellt Knoten zu, kaskadiert bei Info-Knoten automatisch |
| `awardStoryPoints(PDO $pdo, int $teamId, int $points): void` | Team-ID, Punktzahl | addiert Punkte zu `team_progress.total_points` |
| `deliverRootNodesIfNeeded(PDO $pdo, int $teamId, int $rallyeId): void` | Team-ID, Rallye-ID | stellt alle `is_root=1`-Knoten zu, falls Team noch keinen Log-Eintrag hat |
| `evaluateProactiveNodes(PDO $pdo, int $teamId, int $rallyeId): void` | Team-ID, Rallye-ID | prüft und stellt fällige proaktive Knoten zu (Inaktivität/Fehlversuche) |

---

## 3. Rate-Limiting

`checkRateLimit(string $key, int $maxAttempts = 10, int $windowSeconds = 60)` wird ausschließlich auf den vier öffentlich erreichbaren, unauthentifizierten Auth-Endpunkten eingesetzt — dort, wo Brute-Force-Versuche ohne vorherige Authentifizierung möglich wären. Alle anderen Endpunkte erfordern bereits ein gültiges Token (`requireTeamAuth()`/`requireAdminAuth()`) und sind dadurch indirekt gegen Massenzugriffe abgesichert.

| Endpunkt | Rate-Limit-Key | Grenzwert |
|---|---|---|
| `POST /auth/admin-login.php` | `'admin-login_' . $_SERVER['REMOTE_ADDR']` | 10 Versuche / 60 s pro IP |
| `POST /auth/check-code.php` | `'check-code_' . $_SERVER['REMOTE_ADDR']` | 10 Versuche / 60 s pro IP |
| `POST /auth/login.php` | `'login_' . $_SERVER['REMOTE_ADDR']` | 10 Versuche / 60 s pro IP |
| `POST /auth/register.php` | `'register_' . $_SERVER['REMOTE_ADDR']` | 10 Versuche / 60 s pro IP |

Das Limit ist bewusst pro IP-Adresse, nicht pro Team/Code gesetzt — bei einer Jugendfreizeit mit gemeinsamem WLAN teilen sich mehrere Teams dieselbe öffentliche IP. Bei sehr vielen Teams im selben Netz (z. B. > 10 gleichzeitige Login-Versuche innerhalb einer Minute) kann das Limit theoretisch versehentlich mehrere Teams gleichzeitig blockieren. Dies ist bei der Einsatzplanung zu beachten (z. B. Teams zeitlich gestaffelt einloggen lassen), wurde aber bislang nicht als Problem beobachtet.

---

## 4. Öffentliche Endpunkte

### `GET /config.php?rallye_id=`
Kein Auth erforderlich. Liefert Rallye-Metadaten + Spielstatus (`is_game_running`, `is_paused`, `has_started`, `game_end_time`).

### `POST /auth/check-code.php`
Body: `{ "code": "..." }` → `{ valid, already_registered }`. Rate-limitiert.

### `POST /auth/register.php`
Body: `{ "code", "team_name" }` → `{ success, team, token }`, setzt Cookie `team_code`. `team.rallye_id` immer vorhanden. Rate-limitiert.

### `POST /auth/login.php`
Body: `{ "code" }` → analog zu `register.php`. `team.rallye_id` immer vorhanden. Rate-limitiert.

### `POST /auth/admin-login.php`
Body: `{ "email", "password" }` → `{ success, admin, token }`. Rate-limitiert.

---

## 5. Team-Endpunkte

| Methode | Endpunkt | Auth | Beschreibung |
|---|---|---|---|
| GET | `/team/me.php` | Team | Eigene Team-Daten inkl. `avatar_url` |
| GET | `/stations.php?rallye_id=` | Team | Stationen inkl. Status |
| POST | `/stations/unlock.php` | Team | QR-Freischaltung |
| POST | `/team/check-geofence.php` | Team | GPS-Position melden |
| GET | `/puzzles.php?station_id=` | Team | Rätsel einer Station |
| POST | `/puzzles/hint.php` | Team | Hinweis anfordern |
| POST | `/puzzles/submit.php` | Team | Antwort einreichen |
| GET | `/team/progress.php` | Team | Eigener Fortschritt |
| GET | `/leaderboard.php?rallye_id=` | Team | Rangliste |
| GET | `/team/broadcasts.php?since=` | Team | Neue Broadcasts |
| GET | `/team/chat.php` | Team | Chat-Verlauf |
| POST | `/team/chat/respond.php` | Team | Antwort auf Chat-Knoten |
| GET | `/team/open-tasks.php` | Team | Unbeantwortete Chat-Knoten |
| GET | `/team/completed-tasks.php` | Team | Abgeschlossene Chat-Knoten |
| GET | `/team/suspects.php` | Team | Bisher entdeckte Verdächtige |
| POST | `/team/photos/submit.php` | Team | Foto-Einreichung (multipart) |
| POST | `/team/avatars/upload.php` | Team | Avatar-Upload (multipart) |

### `POST /puzzles/submit.php`
Body: `{ "puzzle_id", "answer", "hint_used" }`
**Response 200 (korrekt):**
```json
{
  "success": true, "is_correct": true, "is_solved": true,
  "points_earned": 25, "message": "Richtig! +25 Punkte",
  "next_node_id": 293
}
```
**Response 200 (falsch):** `{ "success": true, "is_correct": false, "attempts_remaining": 2, "message": "..." }`
Löst bei korrekter Antwort automatisch den verknüpften Chat-Knoten aus (`deliverNode()`).

### `POST /team/photos/submit.php`
`multipart/form-data`: `node_id`, `photo`. Validierung: JPEG/PNG/WebP, max. 8 MB, Knoten muss zugestellt und `response_type='photo_ref'` sein, noch nicht abgeschlossen. Speichert unter `/uploads/photos/team<teamId>_node<nodeId>_<timestamp>.<ext>`. Keine automatische Punktevergabe.

### `POST /team/avatars/upload.php`
`multipart/form-data`: `avatar`. Validierung: JPEG/PNG/WebP, max. 2 MB. Speichert unter `/uploads/avatars/team<teamId>_<timestamp>.<ext>`, aktualisiert `teams.avatar_url`.

---

## 6. Admin-Endpunkte

| Methode | Endpunkt | Auth | Beschreibung |
|---|---|---|---|
| GET | `/admin/dashboard.php?rallye_id=` | Admin/Viewer | Dashboard-Kennzahlen |
| GET | `/admin/leaderboard.php?rallye_id=` | Admin/Viewer | Detaillierte Rangliste |
| GET | `/admin/positions.php?rallye_id=` | Admin/Viewer | Live-Positionen |
| GET/POST | `/admin/broadcast.php`, `/admin/broadcasts.php` | Admin/Viewer | Broadcast senden/lesen |
| GET/POST/PUT/DELETE | `/admin/broadcast-templates.php` | Admin/Viewer | CRUD Broadcast-Vorlagen |
| GET/POST/PUT | `/admin/rallyes.php` | Admin/Viewer | CRUD Rallyes |
| POST | `/admin/rallyes/archive.php` | Admin | Rallye archivieren — erwartet `{ rallye_id }` im Body |
| GET | `/admin/start-codes.php?rallye_id=` | Admin/Viewer | Startcodes |
| POST | `/admin/start-codes/generate.php` | Admin | Startcodes erzeugen |
| GET/PUT/DELETE | `/admin/teams.php` | Admin/Viewer | Teams verwalten |
| POST | `/admin/teams/reset-progress.php` | Admin | Teamfortschritt zurücksetzen |
| GET/POST/PUT/DELETE | `/admin/stations.php` | Admin/Viewer | CRUD Stationen |
| POST | `/admin/stations/unlock-for-team.php` | Admin | Manuelle Freischaltung |
| GET/POST/PUT/DELETE | `/admin/puzzles.php?station_id=` | Admin/Viewer | CRUD Rätsel inkl. Antworten |
| GET/POST/PUT/DELETE | `/admin/story-nodes.php?rallye_id=` | Admin/Viewer | CRUD Chat-Knoten |
| GET/POST/PUT/DELETE | `/admin/story-node-options.php?node_id=` | Admin/Viewer | CRUD Knoten-Optionen |
| GET/POST/PUT/DELETE | `/admin/suspects.php?rallye_id=` | Admin/Viewer | CRUD Verdächtige |
| GET | `/admin/photo-submissions.php?rallye_id=` | Admin/Viewer | Foto-Einsendungen |
| POST | `/admin/photo-submissions/award.php` | Admin | Bonus-Punkte vergeben |
| POST | `/admin/media/upload.php` | Admin | Medien-Upload, schreibt in `media_library` |
| POST | `/admin/game/start.php` | Admin | Spiel starten/fortsetzen |
| POST | `/admin/game/pause.php` | Admin | Spiel pausieren |
| POST | `/admin/game/end.php` | Admin | Spiel beenden |
| POST | `/admin/game/reset.php` | Admin | Rallye vollständig zurücksetzen |

### `POST /admin/rallyes/archive.php`
Body: `{ "rallye_id": 14 }`. Setzt `is_archived = 1, is_game_running = 0`.

### `POST /admin/game/reset.php`
Body: `{ "rallye_id": 14, "confirm": true }`. **Destruktive Operation**, läuft in einer Transaktion (`beginTransaction`/`commit`/`rollBack` bei Fehler).

**Genaue Lösch-Reihenfolge** (wichtig für Fremdschlüssel-Abhängigkeiten):
1. `team_attempts` aller Teams der Rallye (`WHERE team_id IN (...)`)
2. `station_unlocks` aller Teams der Rallye
3. `team_progress` aller Teams der Rallye
4. `teams` der Rallye (`WHERE rallye_id = ?`)
5. `broadcasts` der Rallye
6. `start_codes` der Rallye
7. `rallyes`-Zeile selbst wird NICHT gelöscht, sondern per `UPDATE` auf `is_game_running = 0, game_start_time = NULL, game_end_time = NULL, paused_at = NULL` zurückgesetzt

**Nicht gelöscht werden:** `stations`, `puzzles`, `answers`, `story_nodes`, `story_node_options`, `suspects`, `broadcast_templates`, `media_library` — der komplette inhaltliche Aufbau der Rallye (Stationen, Rätsel, Story) bleibt erhalten, nur der Spielfortschritt und die Teams werden zurückgesetzt. Das ermöglicht einen erneuten Testlauf oder eine erneute Durchführung derselben Rallye ohne Neuaufbau.

**Manuelle Prüf-Checkliste nach einem Reset:**
- [ ] Admin-Dashboard zeigt `team_count: 0`
- [ ] `GET /admin/teams.php` liefert leere Liste
- [ ] `GET /admin/start-codes.php` liefert keine Codes mehr (alle gelöscht, müssen neu generiert werden)
- [ ] Stationen/Rätsel/Story-Knoten sind unverändert weiterhin vorhanden
- [ ] `is_game_running`, `game_start_time`, `game_end_time` sind zurückgesetzt (Dashboard zeigt "Noch nicht gestartet")

---

## 7. System-Endpunkt

### `GET /system/cleanup.php?token=<cleanup_secret>`
Token-Vergleich via `hash_equals()`. Response 200: `{ success: true, cleaned_teams: N }`. Response 401 bei ungültigem Token. Einrichtung des `cleanup_secret` siehe `docs/02_Technische_Spezifikation.md`, Abschnitt "Lazy Cleanup".

---

## 8. Fehlercodes

| Code | Bedeutung |
|---|---|
| 400 | Fehlende/ungültige Parameter |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung / Spiel nicht aktiv |
| 404 | Ressource nicht gefunden |
| 405 | HTTP-Methode nicht erlaubt |
| 409 | Konflikt |
| 429 | Rate-Limit überschritten |
| 500 | Interner Serverfehler |

---

## 9. Bekannte Detailpunkte für die Weiterentwicklung

1. `admin/suspects.php` prüft nicht serverseitig, ob bereits ein anderer Verdächtiger als schuldig markiert ist — offene fachliche Entscheidung (Joe), ob dies ergänzt werden soll.
2. `media_library`-Tabelle vor Produktivbetrieb auf STRATO verifizieren.
3. **Encoding-Verifikation nicht abschließend möglich (13.09.2026):** Bei direkten `get_file_contents`-Aufrufen über die verfügbaren Tools wurde der Dateiinhalt nur als Metadaten (SHA, Größe), nicht als Rohtext zurückgegeben. Ob die in älteren Codeexporten sichtbaren Umlaut-Fehler („RÃ¤tsel" statt „Rätsel") tatsächlich im gespeicherten Quelltext oder nur im Export-/Anzeigeprozess vorliegen, konnte damit nicht abschließend geprüft werden. Empfehlung: Stichprobe direkt im GitHub-Web-Editor.

---

**Quelle:** Vollständiger Codeexport `backend/` + GitHub-Abgleich, Stand 13.09.2026.
