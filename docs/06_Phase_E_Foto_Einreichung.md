# Phase E: Foto-Einreichung und Admin-Review

Stand: 09.09.2026 (korrigierte, additive Neufassung nach Rollback des
fehlerhaften ersten Phase-E-Commits)

## Hintergrund

Der urspruengliche Phase-E-Commit hat versehentlich grosse Teile bestehender
Dateien geloescht (u. a. App.jsx beider Frontends, beide api/client.js,
ChatScreen.jsx, StoryNodesEditorScreen.jsx). Diese Fassung wurde auf Basis der
vom Projektinhaber bereitgestellten echten Dateiinhalte (Stand nach Phase D)
neu erstellt und fuegt die Foto-Funktion rein additiv hinzu.

## Datenmodell

- `story_nodes.response_type` erhaelt den neuen Wert `photo_ref`.
- Neue Tabelle `photo_submissions` (team_id, node_id, photo_path,
  submitted_at, points_awarded_at, points_awarded_by_admin_id).
- Migration: `backend/migrations/002_ermittler_chat_phase_e.sql`, manuell
  NACH Migration 001 auf der STRATO-Datenbank auszufuehren.

## Team-Endpunkt

`POST /api/team/photos/submit.php` (multipart/form-data): nimmt `node_id`
und `photo` entgegen, akzeptiert JPEG/PNG/WebP bis 8 MB, speichert die Datei
unter `/uploads/photos/` und markiert den Chat-Knoten als abgeschlossen.

## Admin-Endpunkte

- `GET /api/admin/photo-submissions.php?rallye_id=`: Liste aller Einsendungen
  einer Rallye (Admin oder Beobachter).
- `POST /api/admin/photo-submissions/award.php`: vergibt einmalig Bonus-
  Punkte fuer eine Einsendung (`submission_id`, `points`); ein zweiter Versuch
  fuer dieselbe Einsendung wird mit Statuscode 409 abgelehnt.

## Offene Punkte

- Speicherplatz- und Backup-Strategie fuer `/uploads/photos/` auf STRATO
  festlegen.
- Datenschutz-/Einwilligungstexte fuer Foto-Einsendungen Minderjaehriger
  ergaenzen.
- Optionale Kaskaden-Weiterleitung (leads_to_node_id) nach Foto-Einreichung
  wurde in dieser Fassung bewusst nicht automatisiert, da die genaue
  Signatur von deliverNode() in lib/story.php noch nicht verifiziert ist --
  kann in einem gezielten Folge-Schritt ergaenzt werden.
