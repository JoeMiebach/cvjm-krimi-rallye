# Team-App-Dokumentation

**React + Vite + Tailwind — vollständige Ordnerstruktur und Komponentenreferenz**
**Stand:** 13.09.2026, erstellt aus vollständigem Codeexport (`frontend/team-app/src/`, 28 Dateien) + GitHub-Abgleich

---

## 1. Ordnerstruktur

```
frontend/team-app/
├── postcss.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── api/
    │   └── client.js
    ├── components/
    │   ├── BottomNav.jsx
    │   ├── BroadcastBanner.jsx
    │   ├── GameStatusBanner.jsx
    │   ├── GeofenceStatus.jsx
    │   ├── PauseEndOverlay.jsx
    │   ├── PuzzleRefButton.jsx
    │   ├── QrScanner.jsx
    │   └── StationCompass.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── BroadcastsContext.jsx
    │   ├── GameStatusContext.jsx
    │   └── GeofenceContext.jsx
    ├── offline/
    │   └── queue.js
    └── screens/
        ├── AvatarScreen.jsx
        ├── BroadcastsScreen.jsx
        ├── ChatScreen.jsx
        ├── LeaderboardScreen.jsx
        ├── OpenTasksScreen.jsx
        ├── PuzzlesScreen.jsx
        ├── StartScreen.jsx
        ├── StationDetailScreen.jsx
        ├── StationsMapScreen.jsx
        ├── StationsScreen.jsx
        └── SuspectsScreen.jsx
```

**Basename der App:** `/team` (`main.jsx`, `BrowserRouter basename="/team"`).

---

## 2. Routing (`App.jsx`)

| Pfad | Screen | Schutz |
|---|---|---|
| `/` | `StartScreen` | öffentlich |
| `/stations` | `StationsScreen` | `ProtectedRoute` |
| `/stations/:id` | `StationDetailScreen` | `ProtectedRoute` |
| `/stations/:id/puzzles` | `PuzzlesScreen` | `ProtectedRoute` |
| `/karte` | `StationsMapScreen` | `ProtectedRoute` |
| `/chat` | `ChatScreen` | `ProtectedRoute` |
| `/open-tasks` | `OpenTasksScreen` | `ProtectedRoute` |
| `/suspects` | `SuspectsScreen` | `ProtectedRoute` |
| `/avatar` | `AvatarScreen` | `ProtectedRoute` |
| `/broadcasts` | `BroadcastsScreen` | `ProtectedRoute` |
| `/leaderboard` | `LeaderboardScreen` | `ProtectedRoute` |

Provider-Verschachtelung (`main.jsx`): `AuthProvider` → `BroadcastsProvider` → `GeofenceProvider` → `App` (mit `GameStatusProvider` innerhalb von `App.jsx`).

---

## 3. `api/client.js` — API-Client

Basis-URL aus `VITE_API_BASE_URL` (Pflicht, sonst `throw Error`). Zentrale `request()`-Funktion mit Bearer-Token, `credentials: 'include'`. Separater `requestMultipart()`-Pfad für Datei-Uploads.

| Funktion | Parameter | Endpunkt | Rückgabe (Kernfelder) |
|---|---|---|---|
| `getConfig(rallyeId)` | Rallye-ID | `GET /config.php` | Rallye-Metadaten + Spielstatus |
| `checkCode(code)` | Startcode | `POST /auth/check-code.php` | `{ valid, already_registered }` |
| `register(code, teamName)` | Code, Teamname | `POST /auth/register.php` | `{ success, team, token }` — **`team.rallye_id` verifiziert vorhanden** (siehe Abschnitt 8) |
| `login(code)` | Code | `POST /auth/login.php` | `{ success, team, token }` — **`team.rallye_id` verifiziert vorhanden** (siehe Abschnitt 8) |
| `getMe()` | — | `GET /team/me.php` | Team-Objekt inkl. `avatar_url` |
| `getStations(rallyeId)` | Rallye-ID | `GET /stations.php` | `{ success, stations }` |
| `unlockStation(stationId, qrCode)` | Station-ID, QR-Inhalt | `POST /stations/unlock.php` | `{ success }` |
| `checkGeofence(latitude, longitude)` | Koordinaten | `POST /team/check-geofence.php` | `{ success, newly_unlocked_stations }` |
| `getPuzzles(stationId)` | Station-ID | `GET /puzzles.php` | `{ success, puzzles }` |
| `requestHint(puzzleId)` | Rätsel-ID | `POST /puzzles/hint.php` | `{ success, hint, hint_penalty }` |
| `submitAnswer(puzzleId, answer, hintUsed)` | Rätsel-ID, Antworttext, Hinweis-Flag | `POST /puzzles/submit.php` | siehe Backend-Doku (kein `story_clue`-Feld mehr, siehe Option A) |
| `getProgress()` | — | `GET /team/progress.php` | Fortschrittsobjekt |
| `getLeaderboard(rallyeId)` | Rallye-ID | `GET /leaderboard.php` | `{ success, leaderboard }` |
| `getBroadcasts(since)` | ISO-Zeitstempel | `GET /team/broadcasts.php` | `{ success, broadcasts }` |
| `getChat()` | — | `GET /team/chat.php` | `{ success, chat }` |
| `respondToChat(nodeId, response)` | Knoten-ID, Antwort | `POST /team/chat/respond.php` | siehe Backend-Doku |
| `getOpenTasks()` | — | `GET /team/open-tasks.php` | `{ success, open_tasks }` |
| `getCompletedTasks()` | — | `GET /team/completed-tasks.php` | `{ success, completed_tasks }` |
| `getSuspects()` | — | `GET /team/suspects.php` | `{ success, suspects }` |
| `submitPhoto(nodeId, file)` | Knoten-ID, Datei | `POST /team/photos/submit.php` (multipart) | `{ success, photo_path }` |
| `uploadAvatar(file)` | Datei | `POST /team/avatars/upload.php` (multipart) | `{ success, avatar_url }` |

`ApiError`-Klasse trägt `status`, `message`, `data`. Bei `status === 0` liegt ein Netzwerkfehler vor — wird von `ChatScreen` **und `PuzzlesScreen`** (seit 13.09.2026) genutzt, um Aktionen in die Offline-Warteschlange zu legen.

---

## 4. Contexts

### `AuthContext.jsx`
State: `status` (`checking|loggedOut|needsTeamName|loggedIn`), `team`, `token`, `rallyeId`, `pendingCode`, `error`.
| Funktion | Beschreibung |
|---|---|
| `submitCode(code)` | Prüft Code über `checkCode()`; bei `already_registered` sofort `login()`, sonst Übergang zu `needsTeamName` |
| `submitTeamName(teamName)` | Registriert Team mit `pendingCode` + Name |
| `logout()` | Löscht lokalen Code, setzt Status auf `loggedOut` |

Persistiert den Startcode in `localStorage` (`viking_rallye_team_code`) für Auto-Re-Login beim App-Start (das eigentliche Session-Cookie ist httpOnly und für JS nicht lesbar).

**Verifiziert (13.09.2026):** `rallyeId` wird im Reducer aus `action.team?.rallye_id` gesetzt (`LOGIN_SUCCESS`-Case). Backend-Code von `auth/login.php` und `auth/register.php` wurde per Volltextsuche im tatsächlichen Quellcode geprüft — beide liefern `rallye_id` zuverlässig im `team`-Objekt der Response. **Kein Bug**, der vormals dokumentierte Prüfhinweis ist damit aufgelöst.

### `BroadcastsContext.jsx`
State: `messages[]`, `latestUnseen`, `unreadCount`. Pollt `getBroadcasts(since)` alle 10 s. `since`-Wert wird in `localStorage` (`viking_rallye_broadcasts_since`) persistiert und **nur bei explizitem Logout** zurückgesetzt (nicht bei `checking`/`needsTeamName`).
| Funktion | Beschreibung |
|---|---|
| `markAllAsRead()` | Setzt `unreadCount` auf 0, `latestUnseen` auf `null` |

### `GameStatusContext.jsx`
Pollt `getConfig(rallyeId)` alle 10 s, nur wenn `status === 'loggedIn'` und `rallyeId` bekannt ist.
Abgeleitete Werte: `isGameRunning`, `isPaused`, `hasStarted`, `isGameOver`, `canAct` (= `gameStatus !== null && isGameRunning && !isPaused && !isGameOver`).

### `GeofenceContext.jsx`
Meldet Position alle 25 s via `navigator.geolocation.getCurrentPosition()` an `checkGeofence()`.
State: `permissionState` (`unknown|granted|denied|unsupported`), `lastPosition`, `newlyUnlocked[]`.
| Funktion | Beschreibung |
|---|---|
| `setOnStationUnlocked(callback)` | Registriert Callback, der bei neu freigeschalteten Stationen aufgerufen wird (genutzt von `PuzzlesScreen`/`StationDetailScreen` zum gezielten Neuladen) |
| `dismissUnlockNotice()` | Blendet die „Neue Station freigeschaltet"-Meldung aus |

---

## 5. Components

| Komponente | Props | Zweck |
|---|---|---|
| `BottomNav` | — | Feste Bottom-Navigation (Stationen/Karte/Chat/Aufgaben/Nachrichten/Rangliste), zeigt `unreadCount`-Badge |
| `BroadcastBanner` | — | Zeigt `latestUnseen`-Broadcast als Banner, Klick ruft `markAllAsRead()` |
| `GameStatusBanner` | — | Zeigt Status „Pausiert"/„Noch nicht gestartet"/„Beendet"; nichts, wenn Spiel läuft oder Status noch unbekannt |
| `GeofenceStatus` | — | Zeigt GPS-Berechtigungsstatus + „Neue Station freigeschaltet"-Hinweis |
| `PauseEndOverlay` | — | Vollflächiges Overlay bei `isPaused`/`isGameOver` |
| `PuzzleRefButton` | `stationId`, `puzzleId`, `onClick` | Button „Station öffnen", zeigt „Bereits gelöst", falls zutreffend (prüft via `getPuzzles`) |
| `QrScanner` | `onScanSuccess(text)`, `onScanError(msg)` | Kamera-QR-Scanner (html5-qrcode), Rückkamera bevorzugt |
| `StationCompass` | `station`, `onUnlock` | GPS-Kompass mit Distanz-/Richtungsanzeige, ruft `onUnlock()` bei Erreichen des Geofence-Radius |

---

## 6. `offline/queue.js` — Offline-Warteschlange

IndexedDB-basiert (`ermittler_offline_queue`), rein clientseitig — kein eigener Backend-Sync-Endpunkt.

| Funktion | Parameter | Rückgabe |
|---|---|---|
| `queueAction(action)` | `{ type: 'respond'\|'photo'\|'answer', ...payload }` | `Promise<void>` |
| `getQueuedActions()` | — | `Promise<Array>` aller wartenden Aktionen |
| `removeQueuedAction(id)` | Aktions-ID | `Promise<void>` |
| `flushQueue(handlers)` | `{ respondToChat, submitPhoto, submitAnswer }` | sendet alle wartenden Aktionen erneut; verbleibt in der Queue bei erneutem Fehler |

**GEÄNDERT (13.09.2026):** Aktionstyp `'answer'` ergänzt — deckt jetzt auch klassische Rätsel-Antworten ab (`puzzleId`, `answer`, `hintUsed` als Payload), nicht mehr nur Chat-Antworten und Foto-Uploads. Wird von `ChatScreen` (Typen `respond`/`photo`) **und `PuzzlesScreen`** (Typ `answer`) beim Browser-`online`-Event aufgerufen — jeder Screen registriert dafür einen eigenen `online`-Listener mit dem für ihn relevanten Handler-Subset.

---

## 7. Screens

### `StartScreen.jsx`
Zwei-Schritt-Formular: Startcode → (bei Neuregistrierung) Teamname + optionaler Avatar-Upload. Avatar-Upload-Fehler blockiert die Registrierung nicht (Team ist bereits angelegt, Nachreichen über `/avatar` möglich).

### `StationsScreen.jsx`
Listet Stationen, filtert `status !== 'locked'` heraus (nur entdeckte/freigeschaltete sichtbar).

### `StationDetailScreen.jsx`
Zeigt Stationsdetails, externen OpenStreetMap-Link, und je nach `unlock_type` den passenden Freischalt-Weg (QR-Scanner, GPS-Kompass, oder Hinweis auf manuelle Freischaltung).

### `StationsMapScreen.jsx`
Leaflet-Karte mit eigener Live-Position (`watchPosition`, Genauigkeitskreis) und sichtbaren Stationen (gefiltert: nicht `locked`). Folge-Modus (`followMode`) zentriert die Karte automatisch auf die eigene Position, bis der Nutzer manuell die Karte verschiebt (`FollowController`, `RecenterButton`).

### `PuzzlesScreen.jsx`
Lädt Station + Rätsel, rendert je nach `puzzle.type` das passende Eingabeformular (Buttons bei Multiple-Choice, Text/Zahl sonst). Reagiert auf Freischaltungs-Callback aus `GeofenceContext`.

**GEÄNDERT (13.09.2026, Option A):** Der Story-Clue-Reveal-Block wurde entfernt — das Legacy-Ermittlungsakte-System existiert nicht mehr, Backend liefert kein `story_clue`-Feld mehr.

**GEÄNDERT (13.09.2026):** Bei Netzwerkfehlern (`ApiError.status === 0`) wird die Rätsel-Antwort jetzt über `queueAction({ type: 'answer', puzzleId, answer, hintUsed })` in die Offline-Warteschlange gelegt, statt nur eine Fehlermeldung anzuzeigen. Ein eigener `online`-Event-Listener ruft `flushQueue({ submitAnswer: api.submitAnswer })` auf und lädt danach die Rätselliste neu.

### `ChatScreen.jsx`
Kernscreen des Ermittler-Chats. Pollt `getChat()` alle 10 s. Rendert je Eintrag eine `ChatBubble` mit dem passenden Interaktionselement je `response_type` (`buttons`, `text`/`number`, `puzzle_ref` → `PuzzleRefButton`, `photo_ref` → `PhotoUploadForm`). Unterstützt Medienanzeige (`image_url`, `media_type: audio_ref/video_ref`), Kartenverweis-Button, sowie Highlight+Scroll zu einem Knoten via URL-Parameter `?highlight=node_<id>` (Sprungziel aus `OpenTasksScreen`). Bei Netzwerkfehlern (`ApiError.status === 0`) werden Antworten/Fotos über `offline/queue.js` zwischengespeichert.

### `OpenTasksScreen.jsx`
Zeigt offene und erledigte Chat-Aufgaben (`getOpenTasks()` + `getCompletedTasks()`), Klick navigiert zu `/chat?highlight=node_<id>`.

### `SuspectsScreen.jsx`
Galerie der über `getSuspects()` gemeldeten Verdächtigen.

### `AvatarScreen.jsx`
Avatar-Anzeige + Upload-Formular (`api.uploadAvatar`), max. 2 MB, JPEG/PNG/WebP.

### `BroadcastsScreen.jsx`
Chronologische Liste aller `messages` aus `BroadcastsContext`, markiert beim Öffnen alles als gelesen.

### `LeaderboardScreen.jsx`
Pollt `getLeaderboard(rallyeId)` alle 10 s, sortierte Liste nach `total_points`.

---

## 8. Erledigte Prüfpunkte (Historie)

1. **`rallye_id` in Login-Antwort (erledigt, 13.09.2026):** Ursprünglich als Risiko dokumentiert, dass `AuthContext.jsx` `rallyeId` dauerhaft `null` bleiben könnte, falls `auth/login.php`/`auth/register.php` kein `rallye_id`-Feld liefern. Per Volltextsuche im tatsächlichen Backend-Quellcode verifiziert: Beide Endpunkte liefern `rallye_id` zuverlässig im `team`-Objekt. **Kein Handlungsbedarf.**
2. **Offline-Queue nur für Chat/Foto (erledigt, 13.09.2026):** `submitAnswer` (klassisches Rätsel-Submit) ist jetzt ebenfalls über die Offline-Queue abgesichert (siehe Abschnitt 6 und `PuzzlesScreen.jsx`).
3. **Toter Link zu `/ermittlungsakte` (erledigt, 13.09.2026):** Entfällt vollständig, da der gesamte Story-Clue-Reveal-Block im Zuge von Option A entfernt wurde.

---

**Quelle:** Vollständiger Codeexport `frontend/team-app/src/` + GitHub-Abgleich + Volltextsuche im Backend-Quellcode, Stand 13.09.2026.
