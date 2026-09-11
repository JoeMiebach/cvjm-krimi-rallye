-- ============================================================================
-- Schnellenbach-Update: Angepasst an Live-Schema (11.09.2026)
-- Ziel: GPS-Radien aktualisieren + Anklage-Sperre (4 Verdachtige besuchen)
--
-- ACHTUNG: suspects.station_id existiert im Live-Schema NICHT mehr.
-- Die Zuordnung Verdachtiger -> Station muss anders gelost werden.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. GPS-Radien fuer reale Smartphone-Genauigkeit
-- ----------------------------------------------------------------------------

UPDATE stations
SET geofence_radius_meters = 50
WHERE title IN ('Friedhof Schnellenbach', 'Sportplatz auf dem Hoechsten')
  AND unlock_type = 'gps';

-- Kontrolle
SELECT id, title, latitude, longitude, geofence_radius_meters
FROM stations
WHERE title IN ('Friedhof Schnellenbach', 'Sportplatz auf dem Hoechsten');

-- ----------------------------------------------------------------------------
-- 2. Anklage-Sperre: Alle 4 Verdachtigen mussen besucht werden
-- ----------------------------------------------------------------------------

-- HINWEIS: suspects.station_id existiert im Live-Schema nicht mehr.
-- Alternative 1: Zuordnung ueber story_nodes (reveals_suspect_id + station_id)
-- Alternative 2: Separates Mapping (noch zu definieren)
-- Alternative 3: Feste Station-IDs der 4 Verdachtigen hier eintragen

-- Beispiel-Abfrage mit ANNahme, dass die 4 Verdachtigen-Stationen bekannt sind:
-- Ersetze 101, 102, 103, 104 durch die tatsaechlichen Station-IDs.

SET @verdachtige_stationen = '101,102,103,104';

SELECT
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT su.station_id) AS visited_suspects_count,
    CASE
        WHEN COUNT(DISTINCT su.station_id) >= 4 THEN 'Anklage freigeschaltet'
        ELSE 'Noch gesperrt'
    END AS accusation_status
FROM teams t
LEFT JOIN station_unlocks su ON su.team_id = t.id AND su.unlock_source = 'chat'
WHERE t.rallye_id = (SELECT id FROM rallyes WHERE name LIKE '%Schnellenbach%')
  AND FIND_IN_SET(su.station_id, @verdachtige_stationen)
GROUP BY t.id, t.name;

-- ----------------------------------------------------------------------------
-- 3. Optional: Story-Knoten fuer Schnellenbach nachruesten
-- ----------------------------------------------------------------------------

-- Falls noch keine story_nodes fuer Schnellenbach existieren:
-- (Dies ist ein Platzhalter - muss an deine Story angepasst werden)

-- INSERT INTO story_nodes (rallye_id, type, message_text, response_type, is_root, is_active)
-- SELECT id, 'info', 'Willkommen in Schnellenbach!', 'none', 1, 1
-- FROM rallyes
-- WHERE name LIKE '%Schnellenbach%'
--   AND NOT EXISTS (SELECT 1 FROM story_nodes sn WHERE sn.rallye_id = rallyes.id);

-- ----------------------------------------------------------------------------
-- 4. Hinweise
-- ----------------------------------------------------------------------------

-- - suspects.station_id wurde im Live-Schema entfernt.
-- - Die Zuordnung Verdachtiger -> Station muss ueber story_nodes oder ein separates Mapping erfolgen.
-- - Die Anklage-Sperre (4 Verdachtige besuchen) wird in /team/chat/respond.php umgesetzt.
-- - Ersetze die Beispiel-Station-IDs 101,102,103,104 durch die tatsaechlichen IDs deiner Verdachtigen-Stationen.
