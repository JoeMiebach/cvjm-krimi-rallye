# Technische Spezifikation: Ermittler-Chat-System (Version 1)


**Ergaenzt:** 02_Technische_Spezifikation_PHP_v3.md, 03_Datenbank_Schema_MySQL_MultiRallye_v4.sql,
04_API_Spezifikation_PHP_v3.md
**Stand:** 11.09.2026, 03:30 Uhr
**Status:** TEILWEISE IMPLEMENTIERT -- Phase A-F umgesetzt (siehe
00_Project_Brief_Entscheidungslog_v3.md fuer Details und Bugfix-Historie). Dieses
Dokument beschreibt weiterhin die urspruengliche Zielarchitektur; Abweichungen zum
tatsaechlich implementierten Stand sind unten markiert.


---


## 1. Migrationsstrategie (umgesetzt)


Das alte `story_clue`/Ermittlungsakte-System wurde durch das Ermittler-Chat-System
ersetzt. `CaseFileScreen.jsx` wurde geloescht, `ChatScreen.jsx` ist der neue zentrale
Screen. `team_story_clues` und `GET /team/clues.php` sind noch nicht final entfernt
(warten auf erfolgreichen Praxistest).


---


## 2. Datenbankschema-Erweiterung (umgesetzt + erweitert)


Die urspruengliche Spezifikation ist in `03_Datenbank_Schema_MySQL_MultiRallye_v4.sql`
konsolidiert. Seit der urspruenglichen Fassung dieses Dokuments zusaetzlich ergaenzt:


- `story_nodes.media_type` (ENUM `none`/`audio_ref`/`video_ref`) und `media_url`
  (Phase F, Migration 003) -- unabhaengig vom `response_type`.
- `story_nodes.response_type` um `photo_ref` erweitert (Phase E, Migration 002).
- `story_node_options.unlocks_station_id` (NEU, Migration 004, 09.09.2026 abends) --
  ermoeglicht, dass eine korrekte Chat-Antwort zusaetzlich eine
  `discovery_mode='lead_only'`-Station freischaltet (Eintrag in `station_unlocks` mit
  `unlock_source='chat'`).
- `station_unlocks.unlock_source` ENUM um `'chat'` erweitert (Migration 004).
- `teams.avatar_url`: TATSAECHLICH implementiert als `VARCHAR(255)` Datei-Pfad (echter
  Bild-Upload), NICHT wie urspruenglich hier spezifiziert als kurzer Icon-Schluessel
  (`VARCHAR(64)`).


**WICHTIG:** `discovery_mode` nutzt durchgaengig Unterstriche (`'lead_only'`). Ein
Frontend-Bug vom 09.09.2026 abends (`'leadonly'` ohne Unterstrich in
`StationsEditorScreen.jsx`/`StationsMapScreen.jsx`) ist noch nicht behoben, siehe
Project Brief.


---


## 3. API-Endpunkte (umgesetzt, siehe 04_API_Spezifikation_PHP_v3.md fuer aktuellen Stand)


**Abweichung vom urspruenglichen Entwurf:** `POST /team/chat/respond.php` speichert bei
`response_type='buttons'` seit dem Bugfix vom 09.09.2026 abends das gewaehlte
**Label** (nicht die numerische Options-ID) als `team_response` -- macht die Anzeige
"Deine Antwort: ..." im `ChatScreen.jsx` lesbar. Response bei erfolgreicher Antwort
enthaelt zusaetzlich `unlocked_station_id` (nullable), falls die gewaehlte Option eine
Station freigeschaltet hat.


**Anklage-Sperre (11.09.2026):** Die Anklage-Station wird erst freigeschaltet, wenn
das Team **alle 4 Verdaechtigen** besucht hat (via `station_unlocks` mit
`unlock_source='chat'`). Die Pruefung erfolgt in `/team/chat/respond.php` vor dem
`INSERT` in `station_unlocks`. Error-Log: `[ANKLAGE-SPERRE] Team X: Anklage verweigert,
nur Y/4 Verdaechtigen besucht`.


**"00"-Bug-Fix (11.09.2026):** `GET /team/chat.php` laedt Optionen nur bei
`response_type='buttons'`, nicht bei text/number/puzzle_ref/photo_ref. Sonst wuerde
das Frontend die Options-ID (z.B. "29") fä¿½lschlicherweise als "00" im DOM rendern.


Phase F ergaenzt zusaetzlich `POST /team/avatars/upload.php` und
`GET/POST/PUT/DELETE /admin/broadcast-templates.php` (siehe
`07_Phase_F_Avatare_Templates_Medien_Offline.md`).


---


## 4. Frontend-Architektur (team-app) -- Ist-Stand


- `ChatScreen.jsx`: implementiert wie spezifiziert, plus Avatar-Anzeige im Header
  (Phase F) und Audio-/Video-Player fuer `media_type`-Knoten.
- `OpenTasksScreen.jsx`, `SuspectsScreen.jsx`: implementiert wie spezifiziert.
  `SuspectsScreen.jsx` zeigt seit 11.09.2026 die Anklage-Voraussetzung (X/4 besucht).
- `StationsMapScreen.jsx`: filtert Stationen nach `discovery_mode` -- Filterlogik
  aktuell durch den oben beschriebenen Naming-Bug beeintraechtigt.
- `AvatarScreen.jsx` (NEU, Phase F): eigener Screen zum Avatar-Upload, Route `/avatar`.
- `PuzzlesScreen.jsx`: merkt sich pro Raetsel, ob ein Hinweis angefordert wurde, und
  sendet `hint_used: true` beim Loesungsversuch mit.
- `StationsScreen.jsx` (11.09.2026): zeigt nur noch `is_unlocked`-Stationen.


---


## 5. Proaktive Trigger (Backend, unveraendert)


Siehe urspruengliche Spezifikation -- `GET /team/chat.php` prueft bei jedem Poll auf
faellige proaktive Knoten.


---


## 6. Offene technische Detailfragen (aktualisiert 11.09.2026)


- ~~discovery_mode-Naming-Bug beheben (siehe oben, KRITISCH)~~ -- offen, siehe Project Brief.
- ~~"00"-Bug im Chat~~ -- behoben 11.09.2026 (Options nur bei buttons laden).
- ~~Anklage-Sperre implementieren~~ -- behoben 11.09.2026 (≥4 Verdaechtige).
- Exaktes Bildformat/Speicherort fuer Verdaechtigen-Portraits noch offen.
- Ob Teams tatsaechlich nur fuer sie bestimmte Broadcasts sehen (Filterung nach
  `target_team_ids` auf Team-Seite), ist noch nicht verifiziert.


---


## 7. Bugfix-Historie (neu, 11.09.2026)


| Datum | Bug | Fix | Commit |
|---|---|---|---|
| 11.09.2026, 03:00 | GPS-Debug fehlte, Karten-Zentrum falsch | Debug-Logs in check-geofence.php, Schnellenbach-Center | `09e48a8` |
| 11.09.2026, 03:20 | Anklage-Sperre fehlte | AND-Gate: ≥4 Verdaechtige in respond.php | `7e6e3fc` |
| 11.09.2026, 03:33 | "00" im Chat bei text/number-Knoten | Options nur bei response_type='buttons' laden | `2c8999b` |


---


**Erstellt:** 09.09.2026, 15:17 Uhr
**Aktualisiert:** 11.09.2026, 03:30 Uhr (Anklage-Sperre, 00-Bug, GPS-Debug)
**Autor:** Joe Miebach (gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 1.2 (teilweise implementiert)
