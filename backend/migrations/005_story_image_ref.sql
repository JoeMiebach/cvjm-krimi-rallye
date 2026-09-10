-- Migration 005: story_image_ref + media_library
CREATE TABLE IF NOT EXISTS media_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rallye_id INT NOT NULL,
    file_type ENUM('image', 'audio', 'video') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by_admin_id INT NOT NULL,
    CONSTRAINT fk_media_rallye FOREIGN KEY (rallye_id) REFERENCES rallyes(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_admin FOREIGN KEY (uploaded_by_admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE story_nodes
ADD COLUMN image_ref INT DEFAULT NULL AFTER image_url,
ADD CONSTRAINT fk_story_image_ref FOREIGN KEY (image_ref) REFERENCES media_library(id) ON DELETE SET NULL;
ALTER TABLE story_nodes
MODIFY COLUMN media_type ENUM('none', 'audio_ref', 'video_ref', 'image_ref') NOT NULL DEFAULT 'none';