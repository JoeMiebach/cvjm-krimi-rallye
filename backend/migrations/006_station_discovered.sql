-- Migration 006: Station "entdeckt"-Status
--
-- AENDERO (11.09.2026): Neue Spalte discovered_at in station_unlocks.
-- NULL = nicht entdeckt, TIMESTAMP = via Chat entdeckt.
-- Freigeschaltete Stationen haben weiterhin unlocked_at != NULL.

ALTER TABLE station_unlocks
ADD COLUMN discovered_at TIMESTAMP NULL DEFAULT NULL AFTER unlocked_at;

-- Kommentar zur Spalte
ALTER TABLE station_unlocks
MODIFY COLUMN discovered_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Via Chat entdeckt (NULL = nicht entdeckt)';
