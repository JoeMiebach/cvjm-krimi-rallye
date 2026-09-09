-- backend/migrations/002_ermittler_chat_phase_e.sql
-- Phase E der Ermittler-Chat-Umsetzung. Manuell NACH 001_ermittler_chat_phase_a.sql
-- ueber phpMyAdmin/STRATO-DB-Tool ausfuehren.

ALTER TABLE story_nodes
  MODIFY COLUMN response_type ENUM('none','buttons','text','number','puzzle_ref','photo_ref')
    NOT NULL DEFAULT 'none';

CREATE TABLE photo_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    node_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    points_awarded_at DATETIME NULL,
    points_awarded_by_admin_id INT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES story_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (points_awarded_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_photo_submissions_team (team_id)
) ENGINE=InnoDB;
