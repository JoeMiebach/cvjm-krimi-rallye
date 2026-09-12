# Admin-App-Dokumentation

**React + Vite + Tailwind — vollständige Ordnerstruktur und Komponentenreferenz**
**Stand:** 12.09.2026, erstellt aus vollständigem Codeexport (`frontend/admin-app/src/`, 17 Dateien) + GitHub-Abgleich

---

## 1. Ordnerstruktur

```
frontend/admin-app/
├── postcss.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── api/
    │   └── client.js
    ├── context/
    │   ├── AuthContext.jsx
    │   └── RallyeContext.jsx
    └── screens/
        ├── BroadcastsScreen.jsx
        ├── DashboardScreen.jsx
        ├── LeaderboardScreen.jsx
        ├── LoginScreen.jsx
        ├── MapScreen.jsx
        ├── PhotoSubmissionsScreen.jsx
        ├── PuzzlesEditorScreen.jsx
        ├── RallyesScreen.jsx
        ├── StationsEditorScreen.jsx
        ├── StoryNodesEditorScreen.jsx
        ├── SuspectsEditorScreen.jsx
        └── TeamsScreen.jsx
```

**Basename der App:** `/admin` (`main.jsx`, `BrowserRouter basename="/admin"`).

---

## 2. Routing (`App.jsx`)

| Pfad | Screen | Schutz |
|---|---|---|
| `/login` | `LoginScreen` | öffentlich |
| `/dashboard` | `DashboardScreen` | `ProtectedRoute` (Admin+Viewer) |
| `/rallyes` | `RallyesScreen` | `ProtectedRoute requireAdmin` |
| `/teams` | `TeamsScreen` | `ProtectedRoute requireAdmin` |
| `/stations` | `StationsEditorScreen` | `ProtectedRoute requireAdmin` |
| `/puzzles` | `PuzzlesEditorScreen` | `ProtectedRoute requireAdmin` |
| `/story-nodes` | `StoryNodesEditorScreen` | `ProtectedRoute requireAdmin` |
| `/suspects` | `SuspectsEditorScreen` | `ProtectedRoute requireAdmin` |
| `/photo-submissions` | `PhotoSubmissionsScreen` | `ProtectedRoute requireAdmin` |
| `/broadcasts` | `BroadcastsScreen` | `ProtectedRoute requireAdmin` |
| `/leaderboard` | `LeaderboardScreen` | `ProtectedRoute` (Admin+Viewer) |
| `/map` | `MapScreen` | `ProtectedRoute` (Admin+Viewer) |

`AppShell` umschließ·t alle geschutzten Routen mit Header-Navigation, Rallye-Dropdown (`RallyeSelect`) und Logout-Button. `ProtectedRoute` mit `requireAdmin` leitet Viewer-Rollen auf `/dashboard` um.

---

## 3. `api/client.js` — API-Client

Gleiche Grundstruktur wie Team-App-Client, zusätzlich `requestMultipart()` fur Datei-Uploads (`uploadStoryMedia`).

| Funktion | Parameter | Endpunkt |
|---|---|---|
| `adminLogin(email, password)` | E-Mail, Passwort | `POST /auth/admin-login.php` |
| `getDashboard(rallyeId)` | Rallye-ID | `GET /admin/dashboard.php` |
| `getLeaderboard(rallyeId)` | Rallye-ID | `GET /admin/leaderboard.php` |
| `getPositions(rallyeId)` | Rallye-ID | `GET /admin/positions.php` |
| `getBroadcasts(rallyeId)` | Rallye-ID | `GET /admin/broadcasts.php` |
| `getRallyes()` | — | `GET /admin/rallyes.php` |
| `createRallye(payload)` | Rallye-Felder | `POST /admin/rallyes.php` |
| `updateRallye(id, payload)` | Rallye-ID, Felder | `PUT /admin/rallyes.php?id=` |
| `archiveRallye(id)` | Rallye-ID | `POST /admin/rallyes/archive.php` |
| `generateStartCodes(rallyeId, count)` | Rallye-ID, Anzahl | `POST /admin/start-codes/generate.php` |
| `getStartCodes(rallyeId)` | Rallye-ID | `GET /admin/start-codes.php` |
| `getTeams(rallyeId)` | Rallye-ID | `GET /admin/teams.php` |
| `updateTeam(id, payload)` | Team-ID, Felder | `PUT /admin/teams.php?id=` |
| `deleteTeam(id)` | Team-ID | `DELETE /admin/teams.php?id=` |
| `resetTeamProgress(teamId)` | Team-ID | `POST /admin/teams/reset-progress.php` |
| `getStations(rallyeId)` | Rallye-ID | `GET /admin/stations.php` |
| `createStation(payload)` | Stationsfelder | `POST /admin/stations.php` |
| `updateStation(id, payload)` | Station-ID, Felder | `PUT /admin/stations.php?id=` |
| `deleteStation(id)` | Station-ID | `DELETE /admin/stations.php?id=` |
| `unlockStationForTeam(stationId, teamId)` | Station-ID, Team-ID | `POST /admin/stations/unlock-for-team.php` |
| `getPuzzles(stationId)` | Station-ID | `GET /admin/puzzles.php` |
| `createPuzzle(payload)` | Ratsel-Felder | `POST /admin/puzzles.php` |
| `updatePuzzle(id, payload)` | Ratsel-ID, Felder | `PUT /admin/puzzles.php?id=` |
| `deletePuzzle(id)` | Ratsel-ID | `DELETE /admin/puzzles.php?id=` |
| `sendBroadcast(rallyeId, messageText, targetTeamIds=null)` | Rallye-ID, Text, optionale Team-IDs | `POST /admin/broadcast.php` |
| `startGame(rallyeId)` | Rallye-ID | `POST /admin/game/start.php` |
| `pauseGame(rallyeId)` | Rallye-ID | `POST /admin/game/pause.php` |
| `endGame(rallyeId)` | Rallye-ID | `POST /admin/game/end.php` |
| `resetGame(rallyeId)` | Rallye-ID | `POST /admin/game/reset.php` (sendet `confirm: true` fest mit) |
| `getStoryNodes(rallyeId)` | Rallye-ID | `GET /admin/story-nodes.php` |
| `createStoryNode(payload)` | Knoten-Felder | `POST /admin/story-nodes.php` |
| `updateStoryNode(id, payload)` | Knoten-ID, Felder | `PUT /admin/story-nodes.php?id=` |
| `deleteStoryNode(id)` | Knoten-ID | `DELETE /admin/story-nodes.php?id=` |
| `getStoryNodeOptions(nodeId)` | Knoten-ID | `GET /admin/story-node-options.php` |
| `createStoryNodeOption(payload)` | Options-Felder | `POST /admin/story-node-options.php` |
| `updateStoryNodeOption(id, payload)` | Options-ID, Felder | `PUT /admin/story-node-options.php?id=` |
| `deleteStoryNodeOption(id)` | Options-ID | `DELETE /admin/story-node-options.php?id=` |
| `getSuspects(rallyeId)` | Rallye-ID | `GET /admin/suspects.php` |
| `createSuspect(payload)` | Verdachtigen-Felder | `POST /admin/suspects.php` |
| `updateSuspect(id, payload)` | Verdachtigen-ID, Felder | `PUT /admin/suspects.php?id=` |
| `deleteSuspect(id)` | Verdachtigen-ID | `DELETE /admin/suspects.php?id=` |
| `getPhotoSubmissions(rallyeId)` | Rallye-ID | `GET /admin/photo-submissions.php` |
| `awardPhotoPoints(submissionId, points)` | Einsendungs-ID, Punkte | `POST /admin/photo-submissions/award.php` |
| `getBroadcastTemplates(rallyeId)` | Rallye-ID | `GET /admin/broadcast-templates.php` |
| `createBroadcastTemplate(payload)` | Vorlage-Felder | `POST /admin/broadcast-templates.php` |
| `updateBroadcastTemplate(id, payload)` | Vorlage-ID, Felder | `PUT /admin/broadcast-templates.php?id=` |
| `deleteBroadcastTemplate(id)` | Vorlage-ID | `DELETE /admin/broadcast-templates.php?id=` |
| `uploadStoryMedia(rallyeId, fileType, fileBlob, fileName)` | Rallye-ID, Typ, Datei, Dateiname | `POST /admin/media/upload.php` (multipart) |

**Prufhinweis:** `archiveRallye(id)` sendet `{ id }` im Body; das Backend (`admin/rallyes/archive.php`) liest laut Code `$body['rallye_id']`. Dieser Feldnamen-Mismatch sollte vor Produktivnutzung getestet werden (siehe auch Technische Spezifikation, Abschnitt 10).

---

## 4. Contexts

### `AuthContext.jsx`
State: `status` (`checking|loggedOut|loggedIn`), `admin`, `token`, `role` (`admin|viewer`), `error`.
| Funktion | Beschreibung |
|---|---|
| `login(email, password)` | Ruft `adminLogin()`, speichert Token in `localStorage` (`viking_rallye_admin_token`) |
| `logout()` | Entfernt Token, setzt Status zuruck |

Token-Payload wird clientseitig dekodiert (`decodeTokenPayload`) und auf Ablauf gepruft (`isTokenExpired`), um bei App-Start ohne Server-Roundtrip einen ungultigen Token zu verwerfen.

### `RallyeContext.jsx`
State: `rallyes[]`, `rallyeId`, `status` (`loading|ready|error`).
| Funktion | Beschreibung |
|---|---|
| `setRallyeId(id)` | Setzt aktive Rallye, persistiert in `localStorage` (`viking_rallye_admin_selected_rallye`) |
| `reload()` | Ladt Rallyes neu; falls gespeicherte ID nicht mehr existiert, fallt auf erste nicht-archivierte Rallye zuruck |

Ersetzt die fruhere feste `VITE_DEFAULT_RALLYE_ID`-Umgebungsvariable durch eine im UI wahlbare Rallye (Dropdown im Header).

---

## 5. Screens

### `LoginScreen.jsx`
E-Mail/Passwort-Formular, leitet bei bestehendem Login direkt zu `/dashboard` um.

### `DashboardScreen.jsx`
Pollt `getDashboard(rallyeId)` alle 10 s. Zeigt Team-/Stationszahlen und Restzeit. Spielsteuerungs-Buttons sind **zustandsabhangig**: „Spiel starten" (falls `!has_started`), „Pausieren"+„Beenden" (falls `is_game_running`), „Fortsetzen"+„Beenden" (falls `is_paused`), „Zurucksetzen" (immer, mit `window.confirm()`-Sicherheitsabfrage, da destruktiv). Nur fur Rolle `admin` aktiv — Viewer sehen einen Hinweistext statt der Buttons.

### `RallyesScreen.jsx`
Formular zum Anlegen neuer Rallyes (Name, Stadt, feste `time_limit_minutes: 120`), Tabelle aller Rallyes mit Archivieren-Aktion.

### `TeamsScreen.jsx`
**Vollstandiger Code aus GitHub (SHA: 63c3363f):** Verwaltet Teams inkl. der integrierten Startcode-Verwaltung (ersetzt den fruheren eigenstandigen `StartCodesScreen`) — zeigt Startcode pro Team sowie unbenutzte Codes, mit Generieren-Formular. Funktionen:
- Tabelle mit Team, Startcode, Punkten, Aktiv-Status, Aktionen (Fortschritt zurucksetzen, loschen)
- Formular zum Generieren neuer Startcodes (1–50 Stuck)
- Liste unbenutzter Startcodes als Grid

### `StationsEditorScreen.jsx`
CRUD-Formular fur Stationen. Dropdown fur `unlock_type` (`qr|gps|manual|auto`) und `discovery_mode` (`lead_only|proximity|both`). Koordinatenfelder werden nur eingeblendet, wenn fachlich notig (`unlock_type==='gps'` oder `discovery_mode` ∈ `{proximity, both}`). Geofence-Radius-Feld nur bei `unlock_type==='gps'`.

### `PuzzlesEditorScreen.jsx`
Umfangreichstes Formular (10 Ratseltypen: `text, multiple_choice, number, image, audio, video, sequence, memory, word_scramble, treasure_hunt`). Bei Multiple-Choice: strukturierte Options-Liste mit Radio-Button fur die korrekte Antwort (mind. 2 Optionen, genau eine korrekt). Bei anderen Typen: kommaseparierte Liste akzeptierter Antworten. Medien-URL ist Pflichtfeld bei `image/audio/video`. Enthalt ein eigenes Feld fur den (Legacy-)Ermittlungshinweis `story_clue_text`.

### `StoryNodesEditorScreen.jsx`
Umfangreichstes Formular der gesamten App (~24 KB Quellcode). Verwaltet Chat-Knoten (`type`, `response_type`, `media_type`, Kartenposition, Verknupfungen zu Station/Ratsel/Verdachtigtem, proaktive Trigger) und pro Knoten dessen Antwortoptionen (verschachteltes Options-Formular: Label, `correct_value`, `leads_to_node_id`, `blocks_alternate_node_id`, `unlocks_suspect_id`, `unlocks_station_id`). Bildupload lauft uber `compressImageFile()` (client-seitige Kompression via `OffscreenCanvas`, max. Breite 1920px, JPEG-Qualitat 0,8) vor dem Hochladen uber `uploadStoryMedia()`.

### `SuspectsEditorScreen.jsx`
**Vollstandiger Code aus GitHub (SHA: c9729c03):** CRUD-Formular fur Verdachtige. Funktionen:
- Formularfelder: Name, Portrait-URL (optional), Checkbox „Ist der/die Schuldige", Reaktionstext bei falscher Anklage (optional)
- Warnhinweis, wenn bereits ein Verdachtiger als schuldig markiert ist
- Tabelle aller Verdachtigen mit Bearbeiten/Loschen-Aktionen
- Anzeige des Schuldigen-Status mit Schloss-Icon und Reaktionstext als Zitat

### `PhotoSubmissionsScreen.jsx`
Trennt Einsendungen in „offen" (`!points_awarded_at`) und „bereits bewertet". Zeigt Foto-Thumbnail, Team, Knoten-Nachricht (gekurzt), Zeitstempel. Punktevergabe uber Zahleneingabe + „Vergeben"-Button (`awardPhotoPoints`).

### `BroadcastsScreen.jsx`
Formular mit optionaler Vorlagen-Auswahl (`getBroadcastTemplates`) und optionaler Team-Mehrfachauswahl (leer = alle Teams). Zeigt Verlauf aller bisherigen Broadcasts.

### `LeaderboardScreen.jsx`
Pollt `getLeaderboard(rallyeId)` alle 10 s, Tabelle mit Rang, Team, Punkten, abgeschlossenen Stationen.

### `MapScreen.jsx`
Leaflet-Karte mit zwei Ebenen: Stationen (`CircleMarker`, teal) und Team-Live-Positionen (`CircleMarker`, orange), gefiltert auf vorhandene Koordinaten. Nutzt `CircleMarker` statt Standard-Icon-Marker, um Vite-Bundling-Probleme mit Bild-Assets zu vermeiden. Pollt `getPositions(rallyeId)` alle 10 s; Stationsliste wird nur einmalig geladen.

---

## 6. Bekannte Detailpunkte fur die Weiterentwicklung

1. **Feldnamen-Mismatch** bei `archiveRallye()` — Client sendet `{ id }`, Backend erwartet vermutlich `{ rallye_id }` (siehe Abschnitt 3). Vor Produktivnutzung testen.
2. `StoryNodesEditorScreen.jsx` erlaubt Bild-Upload nur fur `media_type='image_ref'`; bei `audio_ref`/`video_ref` wird stattdessen eine reine URL-Eingabe angezeigt (kein Upload-Button) — falls Audio-/Video-Uploads kunftig ebenfalls uber den Admin-Bereich laufen sollen, ist hier eine Erweiterung notig.

---

**Quelle:** Vollstandiger Codeexport `frontend/admin-app/src/` (17 Dateien, ohne `node_modules`), Stand 12.09.2026 + GitHub-Abgleich (`SuspectsEditorScreen.jsx`, `TeamsScreen.jsx`).