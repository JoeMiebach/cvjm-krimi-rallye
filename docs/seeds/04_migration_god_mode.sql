-- Migration: Admin God Mode Features
-- Datum: 2026-09-13
-- Beschreibung: Neue Tabellen für Team-Fortschritt, Chat-Historie und Admin-Aktionen

-- HINWEIS: Diese Migration erstellt NUR neue Tabellen.
-- Basis-Tabellen (teams, game_sessions, chat_nodes, etc.) müssen bereits existieren!

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
  INDEX idx_node (node_id)
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
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Team-Hinweise
CREATE TABLE IF NOT EXISTS team_hints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Spalte für manuell freigeschaltete Stationen
-- HINWEIS: Nur ausfÃ¼hren, wenn station_unlocks bereits existiert!
ALTER TABLE station_unlocks 
ADD COLUMN IF NOT EXISTS manually_unlocked TINYINT(1) DEFAULT 0 AFTER unlocked_at;

-- 5. God Mode-Flag für Teams (optional)
-- HINWEIS: Nur ausfÃ¼hren, wenn teams bereits existiert!
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_god_mode TINYINT(1) DEFAULT 0 AFTER is_active;
