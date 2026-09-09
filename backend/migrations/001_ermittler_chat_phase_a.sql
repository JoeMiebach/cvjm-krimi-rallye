-- backend/migrations/001_ermittler_chat_phase_a.sql
-- Phase A der Ermittler-Chat-Umsetzung (siehe docs/05_Technische_Spezifikation_Ermittler_Chat_v1.md)
-- Manuell ueber phpMyAdmin/STRATO-DB-Tool auf der produktiven Datenbank ausfuehren.
-- Reihenfolge wichtig (Foreign-Key-Abhaengigkeiten): stations vor suspects vor story_nodes vor
-- story_node_options vor team_story_log.

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

-- story_nodes: is_root und related_node_id gegenueber der urspruenglichen Spezifikation (05_...v1)
-- ergaenzt -- noetig fuer den Einstiegspunkt des Chats bzw. fuer proaktive Fehlversuch-Hinweise.
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
