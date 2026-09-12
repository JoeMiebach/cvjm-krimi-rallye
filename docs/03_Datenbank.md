# Datenbank-Schema

**MySQL/MariaDB — Viking-Schatz Rallye, Multi-Rallye-Schema**
**Stand:** 12.09.2026, rekonstruiert aus einem produktiven Datenbank-Export (STRATO, `dbs16076643`) — spiegelt den tatsächlichen Live-Zustand, nicht nur die ursprüngliche Planung.
**Ersetzt:** 03_Datenbank_Schema_MySQL_MultiRallye_v3.sql

Alle Tabellen: `ENGINE=InnoDB`, `CHARSET=utf8mb3` (Tabellen), Verbindung nutzt `utf8mb4`.

---

## 1. Übersicht der Tabellen

| Tabelle | Zweck |
|---|---|
| `admins` | Admin-/Viewer-Accounts |
| `admin_log` | Audit-Log aller Admin-Aktionen |
| `rallyes` | Eine Zeile pro Rallye-Durchlauf |
| `start_codes` | Team-Zugangscodes pro Rallye |
| `teams` | Teams inkl. Live-Position und Avatar |
| `stations` | Stationen (Orte) einer Rallye |
| `station_unlocks` | Freischaltungs-/Entdeckungsstatus pro Team×Station |
| `puzzles` | Klassische Rätsel pro Station |
| `answers` | Antwortoptionen/korrekte Antworten pro Rätsel |
| `team_attempts` | Alle Rätsel-Versuche eines Teams |
| `team_progress` | Aggregierter Fortschritt pro Team (1:1 zu `teams`) |
| `team_story_clues` | **Legacy:** persistente Ermittlungsakte (altes System) |
| `story_nodes` | Ermittler-Chat-Knoten |
| `story_node_options` | Antwortoptionen/Verzweigungen eines Chat-Knotens |
| `team_story_log` | Zustellungs-/Antwortprotokoll pro Team×Knoten |
| `suspects` | Verdächtige pro Rallye |
| `photo_submissions` | Foto-Einreichungen zu `photo_ref`-Knoten |
| `broadcasts` | Admin-Broadcast-Nachrichten |
| `broadcast_reads` | Lesebestätigungen pro Team×Broadcast |
| `broadcast_templates` | Wiederverwendbare Broadcast-Vorlagen |
| `leaderboard` (VIEW) | Berechnete Rangliste je Rallye |

---

## 2. Tabellendefinitionen

### `admins`
```sql
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','viewer') DEFAULT 'viewer',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    INDEX idx_admins_email (email), INDEX idx_admins_active (is_active)
);
```

### `admin_log`
```sql
CREATE TABLE admin_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL, rallye_id INT NULL,
    action VARCHAR(255) NOT NULL, details TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE SET NULL
);
```
Wird von `logAdminAction($pdo, $adminId, $rallyeId, $action, $details)` (`lib/db.php`) bei jeder Admin-Schreibaktion befüllt, `details` als JSON.

### `rallyes`
```sql
CREATE TABLE rallyes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT 'Der verschwundene Viking-Schatz',
    city VARCHAR(255), country VARCHAR(255) DEFAULT 'Schweden',
    description TEXT, story_intro TEXT,
    max_teams INT DEFAULT 10, time_limit_minutes INT DEFAULT 120,
    game_start_time DATETIME NULL, game_end_time DATETIME NULL,
    paused_at DATETIME NULL,
    is_game_running TINYINT(1) DEFAULT 0, is_archived TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `start_codes`
```sql
CREATE TABLE start_codes (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    code VARCHAR(12) UNIQUE NOT NULL, is_used TINYINT(1) DEFAULT 0,
    used_by_team_id INT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE
);
```
Codes werden 8-stellig, alphanumerisch, ohne `0/O/1/I` generiert (`admin/start-codes/generate.php`).

### `teams`
```sql
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    start_code VARCHAR(12) UNIQUE NOT NULL, name VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL,
    current_latitude DECIMAL(10,8) NULL, current_longitude DECIMAL(11,8) NULL,
    last_position_update DATETIME NULL,
    is_active TINYINT(1) DEFAULT 1, registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (start_code) REFERENCES start_codes(code) ON DELETE CASCADE
);
```

### `stations`
```sql
CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    title VARCHAR(255) NOT NULL, description TEXT, story_text TEXT,
    qr_code VARCHAR(255) UNIQUE NULL,
    latitude DECIMAL(10,8) NULL, longitude DECIMAL(11,8) NULL,
    geofence_radius_meters INT DEFAULT 50,
    unlock_type ENUM('qr','gps','manual','auto') DEFAULT 'qr',
    discovery_mode ENUM('lead_only','proximity','both') NOT NULL DEFAULT 'lead_only',
    order_index INT, points INT DEFAULT 10,
    is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE
);
```

### `station_unlocks`
```sql
CREATE TABLE station_unlocks (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, station_id INT NOT NULL,
    unlock_source ENUM('qr','gps','manual','auto') NULL,
    unlocked_at DATETIME NULL,
    discovered_at TIMESTAMP NULL,
    unlocked_by_admin_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (unlocked_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    UNIQUE KEY uq_team_station (team_id, station_id)
);
```
**Live-Abweichung ggü. ursprünglichem v3-Schema:** `unlocked_at` ist nullable und `discovered_at` (TIMESTAMP) wurde ergänzt — Stationen können jetzt separat „entdeckt" (durch Chat/Karte sichtbar) und „freigeschaltet" (Rätsel zugänglich) sein. `unlock_source` erlaubt inzwischen `'chat'` als zusätzlichen Wert (siehe `lib/story.php`), was im ENUM ggf. noch nicht überall konsistent nachgezogen ist — vor Produktivbetrieb prüfen.

### `puzzles`
```sql
CREATE TABLE puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY, station_id INT NOT NULL,
    type ENUM('multiple_choice','text','image','audio','video','number',
               'sequence','memory','word_scramble','treasure_hunt') NOT NULL,
    question TEXT NOT NULL, hint TEXT NULL, hint_penalty INT DEFAULT 5,
    story_clue_text TEXT NULL COMMENT 'Legacy-Ermittlungshinweis',
    media_url VARCHAR(255) NULL,
    points INT DEFAULT 10, time_limit_seconds INT NULL, max_attempts INT DEFAULT 3,
    order_index INT NOT NULL, is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);
```

### `answers`
```sql
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY, puzzle_id INT NOT NULL,
    answer_text VARCHAR(255) NOT NULL, is_correct TINYINT(1) DEFAULT 1,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);
```

### `team_attempts`
```sql
CREATE TABLE team_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, puzzle_id INT NOT NULL,
    attempt_number INT NOT NULL, submitted_answer TEXT NULL, is_correct TINYINT(1) NULL,
    points_earned INT DEFAULT 0, hint_used TINYINT(1) DEFAULT 0, time_taken_seconds INT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_puzzle_attempt (team_id, puzzle_id, attempt_number)
);
```
**Trigger `update_team_progress_after_attempt`** (AFTER INSERT): Bei `is_correct = 1` werden `team_progress.stations_completed`, `total_points`, `total_hints_used` und `last_activity` automatisch neu berechnet.

### `team_progress`
```sql
CREATE TABLE team_progress (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL UNIQUE,
    stations_completed INT DEFAULT 0, total_points INT DEFAULT 0, total_hints_used INT DEFAULT 0,
    last_activity DATETIME NULL, started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

### `team_story_clues` (Legacy-Ermittlungsakte)
```sql
CREATE TABLE team_story_clues (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, puzzle_id INT NOT NULL,
    story_clue_text TEXT NOT NULL, unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_puzzle_clue (team_id, puzzle_id)
);
```
**Status:** Laut Migrationsplan sollte diese Tabelle nach vollständiger Umstellung auf das Ermittler-Chat-System entfernt werden. Im aktuellen Code (`puzzles/submit.php`) wird sie jedoch weiterhin befüllt — die Migration ist funktional **nicht abgeschlossen**.

### `story_nodes` (Ermittler-Chat)
```sql
CREATE TABLE story_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    type ENUM('info','answer','twist','accusation') NOT NULL DEFAULT 'info',
    message_text TEXT NOT NULL,
    image_url VARCHAR(255) NULL, image_ref INT NULL,
    media_type ENUM('none','audio_ref','video_ref','image_ref') NOT NULL DEFAULT 'none',
    media_url VARCHAR(255) NULL,
    map_latitude DECIMAL(10,8) NULL, map_longitude DECIMAL(11,8) NULL,
    response_type ENUM('none','buttons','text','number','puzzle_ref','photo_ref')
        NOT NULL DEFAULT 'none',
    station_id INT NULL, puzzle_id INT NULL, reveals_suspect_id INT NULL,
    points INT DEFAULT 0,
    is_root TINYINT(1) DEFAULT 0, related_node_id INT NULL,
    proactive_trigger ENUM('none','inactivity','wrong_attempts') DEFAULT 'none',
    proactive_after_minutes INT NULL, proactive_after_attempts INT NULL,
    is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE SET NULL,
    FOREIGN KEY (reveals_suspect_id) REFERENCES suspects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL
);
```
**Live-Abweichung ggü. ursprünglicher Phase-A-Spezifikation:** `image_ref` (Verweis auf hochgeladenes Medium, INT), `media_type`, `is_root` und `related_node_id` wurden zusätzlich ergänzt. `is_root` markiert Einstiegsknoten, die beim ersten Kontakt eines Teams automatisch zugestellt werden (`deliverRootNodesIfNeeded()`). `related_node_id` verknüpft proaktive Fehlversuchs-Trigger mit dem ursprünglichen Knoten.

### `story_node_options`
```sql
CREATE TABLE story_node_options (
    id INT AUTO_INCREMENT PRIMARY KEY, node_id INT NOT NULL,
    label VARCHAR(255) NOT NULL, correct_value VARCHAR(255) NULL,
    leads_to_node_id INT NULL, unlocks_station_id INT NULL,
    blocks_alternate_node_id INT NULL, unlocks_suspect_id INT NULL,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (leads_to_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL,
    FOREIGN KEY (unlocks_station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (blocks_alternate_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL,
    FOREIGN KEY (unlocks_suspect_id) REFERENCES suspects(id) ON DELETE SET NULL
);
```
`unlocks_station_id` wurde gegenüber der ursprünglichen Phase-A-Spezifikation ergänzt — zentral für den Fog-of-War-Mechanismus (`lib/story.php`, `deliverNode()`).

### `team_story_log`
```sql
CREATE TABLE team_story_log (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, node_id INT NOT NULL,
    delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP, responded_at DATETIME NULL,
    team_response TEXT NULL, is_completed TINYINT(1) DEFAULT 0, attempts INT DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_node (team_id, node_id)
);
```

### `suspects`
```sql
CREATE TABLE suspects (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, portrait_icon VARCHAR(255) NULL,
    is_guilty TINYINT(1) DEFAULT 0, wrong_pick_reaction_text TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE
);
```

### `photo_submissions`
```sql
CREATE TABLE photo_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, node_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL, submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_awarded_at DATETIME NULL, points_awarded_by_admin_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (points_awarded_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
```
`points_awarded_at` dient als Sperre gegen doppelte Punktevergabe (`admin/photo-submissions/award.php` prüft dies vor dem Update).

### `broadcasts`, `broadcast_reads`, `broadcast_templates`
```sql
CREATE TABLE broadcasts (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL, message_text TEXT NOT NULL,
    sent_by_admin_id INT NULL, target_team_ids VARCHAR(255) NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE broadcast_reads (
    id INT AUTO_INCREMENT PRIMARY KEY, broadcast_id INT NOT NULL, team_id INT NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY uq_broadcast_team (broadcast_id, team_id)
);

CREATE TABLE broadcast_templates (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    title VARCHAR(255) NOT NULL, message_text TEXT NOT NULL,
    created_by_admin_id INT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
```
`target_team_ids`: kommaseparierte Team-IDs; `NULL` bedeutet „an alle Teams".

### `leaderboard` (VIEW)
```sql
CREATE VIEW leaderboard AS
SELECT t.id AS team_id, t.rallye_id, t.name AS team_name, t.avatar_url,
       tp.stations_completed, tp.total_points, tp.total_hints_used,
       tp.started_at, tp.last_activity,
       t.current_latitude, t.current_longitude
FROM teams t
JOIN team_progress tp ON t.id = tp.team_id
WHERE t.is_active = 1
ORDER BY tp.total_points DESC, tp.started_at ASC;
```

---

## 3. Nicht in dieser Doku bestätigte, aber im Code referenzierte Tabelle

`admin/media/upload.php` schreibt in eine Tabelle **`media_library`** (Spalten mindestens: `rallye_id`, `file_type`, `file_path`, `uploaded_by_admin_id`). Diese Tabelle war im gesichteten Datenbank-Export nicht enthalten — vor Produktivbetrieb prüfen, ob sie tatsächlich angelegt ist, da sonst der Medien-Upload im Story-Node-Editor fehlschlägt.

---

## 4. Empfehlung: Schema-Bereinigung

Für die nächste Iteration sollte geprüft werden:
1. Entfernen von `puzzles.story_clue_text` und `team_story_clues`, sobald der Ermittler-Chat als alleiniges Story-System bestätigt ist.
2. Ergänzen der fehlenden `media_library`-Tabelle im versionierten Schema.
3. Vereinheitlichung des `unlock_source`-ENUMs auf `stations.unlock_type` und `station_unlocks.unlock_source`, da `'chat'` inzwischen faktisch als Wert vorkommt.

---

**Quelle:** Live-Datenbank-Export STRATO (`dbs16076643`, mehrere Zeitstände 11.–12.09.2026), abgeglichen mit 03_Datenbank_Schema_MySQL_MultiRallye_v3.sql und 05_Technische_Spezifikation_Ermittler_Chat_v1.md.
