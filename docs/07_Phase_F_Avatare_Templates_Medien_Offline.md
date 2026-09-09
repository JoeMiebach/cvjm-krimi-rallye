# Phase F: Avatare, Broadcast-Vorlagen, Audio/Video-Chatmedien, Offline-Warteschlange

Stand: 10.09.2026, 01:40 Uhr (um Lead-only-Station-Erweiterung und Bugfix-Historie ergaenzt).

## Datenmodell

- `teams.avatar_url` (neu): Pfad zum hochgeladenen Team-Avatar.
- Neue Tabelle `broadcast_templates` (rallye_id, title, message_text,
  created_by_admin_id, created_at).
- `story_nodes.media_type` (neu, ENUM none/audio_ref/video_ref) und
  `story_nodes.media_url` (neu): unabhaengig vom `response_type`.
- Migration: `backend/migrations/003_ermittler_chat_phase_f.sql`, manuell
  NACH Migration 002 auf der STRATO-Datenbank auszufuehren.

## Erweiterung (09.09.2026 abends): Lead-only-Stationen ueber Chat freischalten

Zusaetzlich zur urspruenglichen Phase-F-Spezifikation wurde
`story_node_options.unlocks_station_id` ergaenzt (Migration `004_lead_only_station_unlock.sql`):
bei korrekter Chat-Antwort mit gesetztem `unlocks_station_id` legt
`backend/api/team/chat/respond.php` einen Eintrag in `station_unlocks` mit
`unlock_source='chat'` an. `discovery_mode='lead_only'`-Stationen erscheinen dadurch
erst auf der Karte, nachdem das Team den passenden Chat-Lead gefunden hat.

**KRITISCH (noch nicht behoben):** Die Frontend-Implementierung in
`StationsEditorScreen.jsx` (Admin) und `StationsMapScreen.jsx` (Team) verwendet
faelschlich `'leadonly'` ohne Unterstrich, waehrend das Schema `'lead_only'` (mit
Unterstrich) vorgibt. Dadurch funktioniert die Freischaltung/Filterung aktuell nicht
zuverlaessig. Siehe `00_Project_Brief_Entscheidungslog_v3.md` fuer Details.

## Team-Endpunkt

`POST /api/team/avatars/upload.php` (multipart/form-data): JPEG/PNG/WebP bis
2 MB, speichert unter `/uploads/avatars/`, aktualisiert `teams.avatar_url`.

## Admin-Endpunkt

`GET/POST/PUT/DELETE /api/admin/broadcast-templates.php`: CRUD fuer
Eilmeldungs-Vorlagen, analog zu `admin/suspects.php` aufgebaut.

## Frontend

- Team-App: `AvatarScreen.jsx` (Route `/avatar`) zum Hochladen; `ChatScreen.jsx`
  zeigt den Avatar im Header (plus Link zu `/avatar`) und rendert `audio_ref`/
  `video_ref`-Knoten mit nativen `<audio>`/`<video>`-Playern.
- Admin-App: `BroadcastsScreen.jsx` um Vorlagen-Dropdown UND Team-Mehrfachauswahl
  ergaenzt (letztere am 09.09.2026 abends nachtraeglich hinzugefuegt -- sendet
  `target_team_ids` als Array numerischer IDs an `admin/broadcast.php`).
- Admin-App: `StoryNodesEditorScreen.jsx` um `media_type`/`media_url`-Felder ergaenzt
  (09.09.2026 abends -- fehlten urspruenglich komplett im Editor-Formular).

## Offline-Warteschlange

`frontend/team-app/src/offline/queue.js` speichert fehlgeschlagene Chat-Antworten und
Foto-Uploads (bei Netzwerkfehler, `ApiError.status === 0`) in einer lokalen IndexedDB
und sendet sie beim naechsten Browser-`online`-Event erneut ueber
`api.respondToChat()`/`api.submitPhoto()`.

## Offene Punkte

- **KRITISCH:** discovery_mode-Naming-Bug beheben (siehe oben).
- Eigener Admin-Screen `BroadcastTemplatesScreen.jsx` zur Vorlagen-Verwaltung fehlt
  weiterhin.
- Kein visuelles Offline-Indikator-UI.
- Avatare aktuell nur im Team-Chat-Header sichtbar, noch nicht in Rangliste oder
  Admin-Dashboard integriert (obwohl `leaderboard`-VIEW bereits `avatar_url` liefert).
