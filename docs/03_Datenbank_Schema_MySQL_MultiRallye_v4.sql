-- Viking-Schatz Rallye: Multi-Rallye-Datenbankschema (Version 4.0)
-- Ersetzt: 03_Datenbank_Schema_MySQL_MultiRallye_v3.sql (bitte archivieren als
-- ARCHIV_03_..._v3.sql)
-- AENDERUNG v4.0 (09.09.2026, 15:20 Uhr): Ermittler-Chat-System Phase A ergaenzt
-- (siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md). Neue Tabellen: suspects,
-- story_nodes, story_node_options, team_story_log. stations.discovery_mode ergaenzt,
-- stations.unlock_type um Wert 'auto' erweitert.
-- HINWEIS: team_story_clues bleibt vorerst bestehen (wird erst nach erfolgreichem Test
-- von Phase A+B des Ermittler-Chat-Systems entfernt, siehe Project Brief Punkt 17).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE=InnoDB;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','viewer') DEFAULT 'viewer', is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login DATETIME NULL,
    INDEX idx_admins_email (email), INDEX idx_admins_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE start_codes (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    code VARCHAR(12) UNIQUE NOT NULL, is_used TINYINT(1) DEFAULT 0,
    used_by_team_id INT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    INDEX idx_start_codes_code (code), INDEX idx_start_codes_rallye (rallye_id),
    INDEX idx_start_codes_used (is_used)
) ENGINE=InnoDB;

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL,
    start_code VARCHAR(12) UNIQUE NOT NULL, name VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL, current_latitude DECIMAL(10,8) NULL,
    current_longitude DECIMAL(11,8) NULL, last_position_update DATETIME NULL,
    is_active TINYINT(1) DEFAULT 1, registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (start_code) REFERENCES start_codes(code) ON DELETE CASCADE,
    INDEX idx_teams_rallye (rallye_id), INDEX idx_teams_position (current_latitude, current_longitude),
    INDEX idx_teams_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE stations (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL, title VARCHAR(255) NOT NULL,
    description TEXT, story_text TEXT, qr_code VARCHAR(255) UNIQUE,
    latitude DECIMAL(10,8), longitude DECIMAL(11,8), geofence_radius_meters INT DEFAULT 50,
    unlock_type ENUM('qr','gps','manual','auto') DEFAULT 'qr',
    discovery_mode ENUM('lead_only','proximity','both') NOT NULL DEFAULT 'lead_only',
    order_index INT, points INT DEFAULT 10,
    is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    INDEX idx_stations_rallye (rallye_id), INDEX idx_stations_gps (latitude, longitude),
    INDEX idx_stations_active (is_active), INDEX idx_stations_unlock (unlock_type)
) ENGINE=InnoDB;

CREATE TABLE station_unlocks (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, station_id INT NOT NULL,
    unlock_source ENUM('qr','gps','manual') NOT NULL, unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unlocked_by_admin_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    FOREIGN KEY (unlocked_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    UNIQUE KEY uq_team_station (team_id, station_id),
    INDEX idx_station_unlocks_team (team_id), INDEX idx_station_unlocks_station (station_id)
) ENGINE=InnoDB;

CREATE TABLE puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY, station_id INT NOT NULL,
    type ENUM('multiple_choice','text','image','audio','video','number','sequence','memory','word_scramble','treasure_hunt') NOT NULL,
    question TEXT NOT NULL, hint TEXT, hint_penalty INT DEFAULT 5,
    story_clue_text TEXT NULL COMMENT 'ALT -- wird mit Ermittler-Chat-Migration abgeloest',
    media_url VARCHAR(255),
    points INT DEFAULT 10, time_limit_seconds INT, max_attempts INT DEFAULT 3,
    order_index INT NOT NULL, is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
    INDEX idx_puzzles_station (station_id), INDEX idx_puzzles_type (type), INDEX idx_puzzles_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY, puzzle_id INT NOT NULL, answer_text VARCHAR(255) NOT NULL,
    is_correct TINYINT(1) DEFAULT 1,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    INDEX idx_answers_puzzle (puzzle_id), INDEX idx_answers_correct (is_correct)
) ENGINE=InnoDB;

CREATE TABLE team_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, puzzle_id INT NOT NULL,
    attempt_number INT NOT NULL, submitted_answer TEXT, is_correct TINYINT(1),
    points_earned INT DEFAULT 0, hint_used TINYINT(1) DEFAULT 0, time_taken_seconds INT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_puzzle_attempt (team_id, puzzle_id, attempt_number),
    INDEX idx_team_attempts_team (team_id), INDEX idx_team_attempts_puzzle (puzzle_id),
    INDEX idx_team_attempts_correct (is_correct)
) ENGINE=InnoDB;

CREATE TABLE team_progress (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL UNIQUE,
    stations_completed INT DEFAULT 0, total_points INT DEFAULT 0, total_hints_used INT DEFAULT 0,
    last_activity DATETIME NULL, started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team_progress_team (team_id)
) ENGINE=InnoDB;

CREATE TABLE team_story_clues (
    id INT AUTO_INCREMENT PRIMARY KEY, team_id INT NOT NULL, puzzle_id INT NOT NULL,
    story_clue_text TEXT NOT NULL, unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_team_puzzle_clue (team_id, puzzle_id),
    INDEX idx_team_story_clues_team (team_id), INDEX idx_team_story_clues_puzzle (puzzle_id)
) ENGINE=InnoDB COMMENT='ALT -- wird nach Abschluss der Ermittler-Chat-Migration entfernt';

-- NEU (v4): Ermittler-Chat-System, Phase A
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
    map_latitude DECIMAL(10,8) NULL, map_longitude DECIMAL(11,8) NULL,
    response_type ENUM('none','buttons','text','number','puzzle_ref') NOT NULL DEFAULT 'none',
    station_id INT NULL, puzzle_id INT NULL, reveals_suspect_id INT NULL,
    points INT DEFAULT 0,
    is_root TINYINT(1) DEFAULT 0,
    related_node_id INT NULL,
    proactive_trigger ENUM('none','inactivity','wrong_attempts') DEFAULT 'none',
    proactive_after_minutes INT NULL, proactive_after_attempts INT NULL,
    is_active TINYINT(1) DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE SET NULL,
    FOREIGN KEY (reveals_suspect_id) REFERENCES suspects(id) ON DELETE SET NULL,
    FOREIGN KEY (related_node_id) REFERENCES story_nodes(id) ON DELETE SET NULL,
    INDEX idx_story_nodes_rallye (rallye_id), INDEX idx_story_nodes_type (type),
    INDEX idx_story_nodes_root (is_root)
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

DELIMITER //
CREATE TRIGGER update_team_progress_after_attempt
AFTER INSERT ON team_attempts
FOR EACH ROW
BEGIN
    IF NEW.is_correct = 1 THEN
        UPDATE team_progress
        SET stations_completed = (SELECT COUNT(DISTINCT p.station_id) FROM team_attempts ta JOIN puzzles p ON ta.puzzle_id = p.id WHERE ta.team_id = NEW.team_id AND ta.is_correct = 1),
            total_points = (SELECT COALESCE(SUM(points_earned),0) FROM team_attempts WHERE team_id = NEW.team_id),
            total_hints_used = (SELECT COALESCE(SUM(CASE WHEN hint_used=1 THEN 1 ELSE 0 END),0) FROM team_attempts WHERE team_id = NEW.team_id),
            last_activity = CURRENT_TIMESTAMP
        WHERE team_id = NEW.team_id;
    END IF;
END//
DELIMITER ;

CREATE TABLE broadcasts (
    id INT AUTO_INCREMENT PRIMARY KEY, rallye_id INT NOT NULL, message_text TEXT NOT NULL,
    sent_by_admin_id INT NULL, target_team_ids VARCHAR(255) NULL, sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    FOREIGN KEY (sent_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_broadcasts_rallye (rallye_id), INDEX idx_broadcasts_active (is_active), INDEX idx_broadcasts_sent_at (sent_at)
) ENGINE=InnoDB;

CREATE TABLE broadcast_reads (
    id INT AUTO_INCREMENT PRIMARY KEY, broadcast_id INT NOT NULL, team_id INT NOT NULL,
    read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY uq_broadcast_team (broadcast_id, team_id),
    INDEX idx_broadcast_reads_broadcast (broadcast_id), INDEX idx_broadcast_reads_team (team_id)
) ENGINE=InnoDB;

CREATE TABLE admin_log (
    id INT AUTO_INCREMENT PRIMARY KEY, admin_id INT NULL, rallye_id INT NULL,
    action VARCHAR(255) NOT NULL, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE SET NULL,
    INDEX idx_admin_log_admin (admin_id), INDEX idx_admin_log_rallye (rallye_id),
    INDEX idx_admin_log_action (action), INDEX idx_admin_log_created (created_at)
) ENGINE=InnoDB;

CREATE VIEW leaderboard AS
SELECT t.id AS team_id, t.rallye_id, t.name AS team_name, t.avatar_url,
       tp.stations_completed, tp.total_points, tp.total_hints_used, tp.started_at, tp.last_activity,
       t.current_latitude, t.current_longitude
FROM teams t JOIN team_progress tp ON t.id = tp.team_id
WHERE t.is_active = 1
ORDER BY tp.total_points DESC, tp.started_at ASC;

UPDATE teams
SET current_latitude = NULL, current_longitude = NULL, last_position_update = NULL
WHERE last_position_update IS NOT NULL
  AND last_position_update < (NOW() - INTERVAL 4 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
