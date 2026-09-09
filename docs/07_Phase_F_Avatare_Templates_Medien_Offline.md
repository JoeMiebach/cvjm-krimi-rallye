# Phase F: Avatare, Broadcast-Vorlagen, Audio/Video-Chatmedien, Offline-Warteschlange

Stand: 09.09.2026, additiv auf Basis der vom Projektinhaber bereitgestellten
echten Dateiinhalte umgesetzt (analog zur korrigierten Phase E).

## Datenmodell

- `teams.avatar_url` (neu): Pfad zum hochgeladenen Team-Avatar.
- Neue Tabelle `broadcast_templates` (rallye_id, title, message_text,
  created_by_admin_id, created_at).
- `story_nodes.media_type` (neu, ENUM none/audio_ref/video_ref) und
  `story_nodes.media_url` (neu): unabhaengig vom `response_type` -- ein
  Info- oder Frage-Knoten kann zusaetzlich einen Audio-/Video-Clip enthalten.
- Migration: `backend/migrations/003_ermittler_chat_phase_f.sql`, manuell
  NACH Migration 002 auf der STRATO-Datenbank auszufuehren.

## Team-Endpunkt

`POST /api/team/avatars/upload.php` (multipart/form-data): JPEG/PNG/WebP bis
2 MB, speichert unter `/uploads/avatars/`, aktualisiert `teams.avatar_url`.

## Admin-Endpunkt

`GET/POST/PUT/DELETE /api/admin/broadcast-templates.php`: CRUD fuer
Eilmeldungs-Vorlagen, analog zu `admin/suspects.php` aufgebaut.

## Frontend

- Team-App: neuer Screen `AvatarScreen.jsx` (Route `/avatar`) zum Hochladen;
  `ChatScreen.jsx` zeigt den Avatar im Header und rendert `audio_ref`/
  `video_ref`-Knoten mit nativen `<audio>`/`<video>`-Playern.
- Admin-App: `BroadcastsScreen.jsx` um ein Vorlagen-Dropdown ergaenzt, das
  das Nachrichtenfeld vorbefuellt (Vorlagenverwaltung selbst folgt als
  eigener Screen in einem spaeteren Schritt).

## Offline-Warteschlange

Bewusst OHNE eigenen Backend-Sync-Endpunkt umgesetzt, um keine unverifizierten
Server-Signaturen zu erfinden: `frontend/team-app/src/offline/queue.js`
speichert fehlgeschlagene Chat-Antworten und Foto-Uploads (bei Netzwerkfehler,
`ApiError.status === 0`) in einer lokalen IndexedDB-Datenbank und sendet sie
beim naechsten Browser-`online`-Event ueber die bestehenden Funktionen
`api.respondToChat()`/`api.submitPhoto()` erneut. Ein fehlgeschlagener Retry
bleibt einfach in der Warteschlange und wird beim naechsten `online`-Event
erneut versucht.

## Offene Punkte

- Eigener Admin-Screen `BroadcastTemplatesScreen.jsx` zur Verwaltung
  (Anlegen/Bearbeiten/Loeschen) der Vorlagen -- aktuell nur Auswahl in
  `BroadcastsScreen.jsx` moeglich, CRUD muss noch per API-Client direkt oder
  in einem Folge-Schritt per UI umgesetzt werden.
- Kein visuelles Offline-Indikator-UI (z. B. Banner "X Aktionen warten auf
  Verbindung") -- aktuell rein technische Warteschlange ohne Team-Feedback.
- Avatare aktuell nur im Team-Chat-Header sichtbar, noch nicht in Rangliste
  oder Admin-Dashboard integriert.
