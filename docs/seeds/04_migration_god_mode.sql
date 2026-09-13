-- Migration: Admin God Mode Features
-- Datum: 2026-09-13
-- Beschreibung: Tabellen für Team-Fortschritt, Chat-Historie und Admin-Aktionen

-- 1. Chat-Historie pro Team
CREATE TABLE IF NOT EXISTS team_chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  node_id INT NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answer TEXT NULL,
  answered_at DATETIME NULL,
  is_correct TINYINT(1) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id),
  INDEX idx_node (node_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES chat_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Admin-Aktionen loggen
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  team_id INT NOT NULL,
  action_type ENUM('send_node', 'unlock_station', 'reset_team', 'send_hint', 'unlock_station_no_check') NOT NULL,
  action_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_user_id),
  INDEX idx_team (team_id),
  INDEX idx_created (created_at),
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. team_stations: Spalte für manuell freigeschaltet
ALTER TABLE team_stations 
ADD COLUMN IF NOT EXISTS manually_unlocked TINYINT(1) DEFAULT 0 AFTER is_unlocked;

-- 4. teams: Spalte für God Mode-Flag (optional, für Debugging)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_god_mode TINYINT(1) DEFAULT 0 AFTER game_session_id;
