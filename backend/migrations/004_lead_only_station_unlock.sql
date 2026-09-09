-- Ermoeglicht das Freischalten einer discovery_mode='leadonly'-Station
-- durch eine passende Chat-Antwort. Nach Migration 003 ausfuehren.
ALTER TABLE story_node_options
  ADD COLUMN unlocks_station_id INT NULL AFTER unlocks_suspect_id,
  ADD FOREIGN KEY (unlocks_station_id) REFERENCES stations(id) ON DELETE SET NULL,
  ADD INDEX idx_options_unlocks_station (unlocks_station_id);

ALTER TABLE station_unlocks
  MODIFY COLUMN unlock_source ENUM('qr','gps','manual','chat') NOT NULL;
