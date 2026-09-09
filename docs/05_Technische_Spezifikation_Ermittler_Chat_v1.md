# Technische Spezifikation: Ermittler-Chat-System (Version 1)

**Ergaenzt:** 02_Technische_Spezifikation_PHP_v3.md, 03_Datenbank_Schema_MySQL_MultiRallye_v4.sql,
04_API_Spezifikation_PHP_v3.md (dieses Dokument beschreibt NUR die Aenderungen/Ergaenzungen fuer
das Ermittler-Chat-Konzept aus 01_Konzeptpapier_Viking_Schatz_v3.md)
**Stand:** 09.09.2026, 18:00 Uhr
**Status:** IMPLEMENTIERT (Phase A–F abgeschlossen)
**Umfang:** Volles Konzept (Chat, Leads, Offene Aufgaben, Verdä±±chtige, finale Anklage,
Foto-Einreichung, Team-Avatare, Eilmeldungen, Offline-Warteschlange).

---

## 1. Migrationsstrategie: Vollstaendige Abloesung

Das bestehende `story_clue`/Ermittlungsakte-System (`puzzles.story_clue_text`,
`team_story_clues`, `GET /team/clues.php`, `CaseFileScreen.jsx`) wird durch das Ermittler-Chat-
System vollstaendig ersetzt, nicht parallel weiterbetrieben.

**Migrationsschritte:**
1. Neue Tabellen anlegen (siehe Abschnitt 2), bestehende Tabellen per `ALTER TABLE` erweitern.
2. Bestehende Stationen/Raetsel bleiben als Datenbasis erhalten (Spezial-Raetsel-Screens nutzen
   sie unveraendert); zusaetzlich werden `story_nodes` fuer die neue Chat-Fuehrung angelegt.
3. `team_story_clues` und `GET /team/clues.php` werden nach erfolgreicher Umstellung entfernt.
   `CaseFileScreen.jsx` wird durch `ChatScreen.jsx` ersetzt (der Chat-Verlauf uebernimmt die
   Funktion der Ermittlungsakte).
4. Die aktuell in der Live-DB vorhandene Test-Rallye (rallye_id=1, Testdaten aus der
   Entwicklungsphase) wird VOR dem produktiven Ersteinsatz zurueckgesetzt (`POST
   /admin/game/reset.php`) und die Stationen/Raetsel/Knoten fuer die echte erste Rallye neu
   angelegt -- keine Datenmigration bestehender Test-Fortschritte noetig.
5. Reihenfolge der Umsetzung (Phasenplan trotz vollem Zielumfang, um Testbarkeit zu erhalten):
   - Phase A: Schema + Backend-Endpunkte fuer Chat-Kern (Knoten, Optionen, Log) ✅
   - Phase B: Team-App ChatScreen + OpenTasksScreen ✅
   - Phase C: Verdä±±chtige + finale Anklage ✅
   - Phase D: Admin-Content-Editor fuer Knoten/Verdaechtige ✅
   - Phase E: Foto-Einreichung + Admin-Review ✅
   - Phase F: Team-Avatare, Eilmeldungs-Vorlagen, Audio/Video-Medien, Offline-Warteschlange ✅

---

## 2. Datenbankschema-Erweiterung

```sql
ALTER TABLE stations
  ADD COLUMN discovery_mode ENUM('lead_only','proximity','both') NOT NULL DEFAULT 'lead_only'
    AFTER unlock_type,
  MODIFY COLUMN unlock_type ENUM('qr','gps','manual','auto') DEFAULT 'qr';

CREATE TABLE suspects (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, portrait_icon VARCHAR(255) NULL,
    is_guilty TINYINT(1) DEFAULT 0,
    wrong_pick_reaction_text TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    INDEX idx_suspects_rallye (rallye_id)
) ENGINE=InnoDB;

CREATE TABLE story_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    type ENUM('info','answer','twist','accusation') NOT NULL DEFAULT 'info',
    message_text TEXT NOT NULL, image_url VARCHAR(255) NULL,
    media_type ENUM('none','audio_ref','video_ref') NOT NULL DEFAULT 'none' COMMENT 'Phase F',
    media_url VARCHAR(255) NULL COMMENT 'Phase F',
    map_latitude DECIMAL(10,8) NULL, map_longitude DECIMAL(11,8) NULL,
    response_type ENUM('none','buttons','text','number','puzzle_ref','photo_ref') NOT NULL DEFAULT 'none',
    station_id INT NULL, puzzle_id INT NULL, reveals_suspect_id INT NULL,
    points INT DEFAULT 0,
    proactive_trigger ENUM('none','inactivity','wrong_attempts') DEFAULT 'none',
    proactive_after_minutes INT NULL, proactive_after_attempts INT NULL,
    is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE SET NULL,
    FOREIGN KEY (reveals_suspect_id) REFERENCES suspects(id) ON DELETE SET NULL,
    INDEX idx_story_nodes_rallye (rallye_id), INDEX idx_story_nodes_type (type)
) ENGINE=InnoDB;

CREATE TABLE story_node_options (
    id INT AUTO_INCREMENT PRIMARY KEY, node_id INT NOT NULL,
    label VARCHAR(255) NOT NULL, correct_value VARCHAR(255) NULL,
    leads_to_node_id INT NULL, blocks_alternate_node_id INT NULL,
    unlocks_suspect_id INT NULL,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (leads_to_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL,
    FOREIGN KEY (blocks_alternate_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL,
    FOREIGN KEY (unlocks_suspect_id) REFERENCES suspects(id) ON DELETE SET NULL,
    INDEX idx_options_node (node_id)
) ENGINE=InnoDB;

CREATE TABLE team_story_log (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, node_id INT NOT NULL,
    delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP, responded_at DATETIME NULL,
    team_response TEXT NULL, is_completed TINYINT(1) DEFAULT 0,
    attempts INT DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_node (team_id, node_id),
    INDEX idx_story_log_team (team_id), INDEX idx_story_log_completed (is_completed)
) ENGINE=InnoDB;

CREATE TABLE photo_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, node_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL, submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_awarded_at DATETIME NULL, points_awarded_by_admin_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (points_awarded_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_photo_submissions_team (team_id)
) ENGINE=InnoDB;

-- Phase F: Broadcast-Vorlagen
CREATE TABLE broadcast_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rallye_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    created_by_admin_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_broadcast_templates_rallye (rallye_id)
) ENGINE=InnoDB;

ALTER TABLE teams
  MODIFY COLUMN avatar_url VARCHAR(255) NULL COMMENT 'Pfad zum hochgeladenen Team-Avatar (Phase F)';
```

`team_story_clues` und die Spalte `puzzles.story_clue_text` werden nach Abschluss der Migration
per separatem `ALTER TABLE ... DROP` entfernt (nicht Teil dieses initialen Schemas, um
Rueckwaertskompatibilitaet waehrend der Umstellung zu erlauben).

---

## 3. API-Endpunkte (Ergaenzung zu 04_API_Spezifikation_PHP_v3.md)

### Team-Endpunkte (NEU)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /team/chat.php | Vollstaendiger Chat-Verlauf (alle `team_story_log`-Eintraege, chronologisch) |
| GET | /team/open-tasks.php | Alle unbeantworteten/nicht abgeschlossenen Knoten des Teams |
| POST | /team/chat/respond.php | Antwort auf einen Knoten einreichen (Button-Wahl, Text, Zahl) |
| GET | /team/suspects.php | Bisher entdeckte Verdä±±chtige des Teams |
| POST | /team/photos/submit.php | Foto-Upload fuer einen `photo_ref`-Knoten (multipart/form-data) |
| POST | /team/avatars/upload.php | Avatar-Upload (multipart/form-data, Phase F) |

### Admin-Endpunkte (NEU)

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET/POST/PUT/DELETE | /admin/story-nodes.php | CRUD fuer Chat-Knoten |
| GET/POST/PUT/DELETE | /admin/story-node-options.php | CRUD fuer Antwortoptionen |
| GET/POST/PUT/DELETE | /admin/suspects.php | CRUD fuer Verdä±±chtige |
| GET | /admin/photo-submissions.php?rallye_id= | Liste aller Foto-Einsendungen einer Rallye |
| POST | /admin/photo-submissions/award.php | Punkte fuer eine Einsendung vergeben |
| GET/POST/PUT/DELETE | /admin/broadcast-templates.php | CRUD fuer Eilmeldungs-Vorlagen (Phase F) |

---

## 4. Frontend-Architektur (team-app)

**Neue Screens:**
- `ChatScreen.jsx` (ERSETZT `CaseFileScreen.jsx`): rendert `team_story_log` chronologisch;
  Nachrichtentypen (Text/Bild/Kartenposition) als unterschiedliche Bubble-Varianten; offene
  Antwortknoten zeigen inline Buttons/Eingabefelder direkt in der letzten Bubble.
- `OpenTasksScreen.jsx` (NEU): gefilterte Liste aller `is_completed = 0`-Eintraege.
- `SuspectsScreen.jsx` (NEU): Galerie der ueber `GET /team/suspects.php` gemeldeten Verdä±±chtigen.
- `AvatarScreen.jsx` (NEU, Phase F): Avatar hochladen.

**Angepasste Screens:**
- `StationsMapScreen.jsx`: filtert Stationen nach Entdeckungsstatus.
- `PuzzlesScreen.jsx`: bleibt fuer Spezial-Raetseltypen bestehen, wird kontextuell aus dem Chat geoeffnet.
- `StationDetailScreen.jsx`: wird zum "Vor-Ort-Bestaetigungs-Screen".
- `StationsScreen.jsx`: ENTFAELLT.

**Neue Infrastruktur:**
- Offline-Warteschlange: `src/offline/queue.js`, nutzt IndexedDB, haengt sich an den Service
  Worker (Background Sync API, Fallback: Retry bei Reconnect-Event).
- Sound/Vibration: ⚠️ Geplant, nicht implementiert.
- Foto-Komprimierung vor Upload: `src/lib/compressImage.js` (Canvas-Resize + JPEG-Export).

---

## 5. Proaktive Trigger (Backend)

Konsistent mit dem bestehenden Lazy-Cleanup-Prinzip: `GET /team/chat.php` prueft bei jedem Poll
zusaetzlich, ob proaktive Knoten faellig sind:
- `proactive_trigger = 'inactivity'`: `NOW() - team_progress.last_activity > proactive_after_minutes`
- `proactive_trigger = 'wrong_attempts'`: `team_story_log.attempts >= proactive_after_attempts`

Faellige proaktive Knoten werden bei diesem Check automatisch in `team_story_log` eingetragen.

---

## 6. Offene technische Detailfragen

- Exaktes Bildformat/Speicherort fuer Verdä±±chtigen-Portraits und Foto-Einsendungen
  (`/uploads/suspects/`, `/uploads/photos/`?) -- an bestehende `media_url`-Konvention anlehnen.
- Admin-Tabellen-Editor fuer `story_node_options`: verschachtelte Bearbeitung oder eigene Unterseite?
- Exakte Icon-Assets fuer Team-Avatare (6–8 Stueck) muessen noch erstellt/ausgewaehlt werden.
- Sound/Vibration-Feedback: ⚠️ Geplant, nicht implementiert (niedrige Prioritaet).
- Eigener Admin-Screen `BroadcastTemplatesScreen.jsx`: ⚠️ Geplant, nicht implementiert (CRUD-API vorhanden).

---

**Erstellt:** 09.09.2026, 15:17 Uhr (Spezifikation), 09.09.2026, 18:00 Uhr (IMPLEMENTIERT)
**Autor:** Joe Miebach (gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 1.0 (Spezifikation, IMPLEMENTIERT)
