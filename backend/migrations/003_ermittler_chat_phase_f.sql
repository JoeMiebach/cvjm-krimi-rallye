-- backend/migrations/003_ermittler_chat_phase_f.sql
-- Phase F: Avatare, Broadcast-Vorlagen, Audio/Video-Chatmedien.
-- Manuell NACH Migration 002 ueber phpMyAdmin/STRATO-DB-Tool ausfuehren.

ALTER TABLE teams ADD COLUMN avatar_url VARCHAR(255) NULL AFTER name;

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

ALTER TABLE story_nodes ADD COLUMN media_type ENUM('none','audio_ref','video_ref') NOT NULL DEFAULT 'none' AFTER response_type;
ALTER TABLE story_nodes ADD COLUMN media_url VARCHAR(255) NULL AFTER image_url;
