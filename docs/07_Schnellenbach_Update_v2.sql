-- ============================================================================
-- Schnellenbach-Update: Komplettes Skript fuer Live-Schema (11.09.2026)
-- Ziel: GPS-Radien aktualisieren + Anklage-Sperre (4 Verdachtige besuchen)
--
-- Dieses Skript:
-- 1. Aktualisiert GPS-Radien fuer reale Smartphone-Genauigkeit
-- 2. Ermittelt automatisch die 4 Verdachtigen-Stationen uber story_nodes
-- 3. Zeigt den Ermittlungsfortschritt pro Team
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
-- 2. Automatische Erkennung: Welche Stationen gehoren zu den 4 Verdachtigen?
-- ----------------------------------------------------------------------------

-- HINWEIS: suspects.station_id existiert im Live-Schema nicht mehr.
-- Die Zuordnung erfolgt jetzt uber story_nodes.reveals_suspect_id + station_id.

-- Temporare Tabelle: Verdachtigen-Stationen (wird am Ende wieder geloscht)
CREATE TEMPORARY TABLE IF NOT EXISTS tmp_verdachtige_stationen (
    suspect_id INT,
    station_id INT
);

-- Verdachtigen-Stationen ermitteln: story_nodes, die einen Suspect aufdecken UND eine Station haben
INSERT INTO tmp_verdachtige_stationen (suspect_id, station_id)
SELECT DISTINCT reveals_suspect_id, station_id
FROM story_nodes
WHERE reveals_suspect_id IS NOT NULL
  AND station_id IS NOT NULL
  AND rallye_id = (SELECT id FROM rallyes WHERE name LIKE '%Schnellenbach%');

-- Kontrolle: Welche Verdachtigen-Stationen wurden erkannt?
SELECT
    s.name AS suspect_name,
    st.id AS station_id,
    st.title AS station_title
FROM tmp_verdachtige_stationen vs
JOIN suspects s ON s.id = vs.suspect_id
JOIN stations st ON st.id = vs.station_id
WHERE s.rallye_id = (SELECT id FROM rallyes WHERE name LIKE '%Schnellenbach%')
ORDER BY s.id;

-- ----------------------------------------------------------------------------
-- 3. Anklage-Sperre: Alle 4 Verdachtigen mussen besucht werden
-- ----------------------------------------------------------------------------

-- View: Ermittlungsfortschritt pro Team
-- Zeigt, wie viele der 4 Verdachtigen jedes Team bereits besucht hat

SELECT
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT vs.station_id) AS visited_suspects_count,
    CASE
        WHEN COUNT(DISTINCT vs.station_id) >= 4 THEN 'Anklage freigeschaltet'
        ELSE CONCAT('Noch gesperrt (', COUNT(DISTINCT vs.station_id), '/4)')
    END AS accusation_status
FROM teams t
LEFT JOIN station_unlocks su ON su.team_id = t.id AND su.unlock_source = 'chat'
LEFT JOIN tmp_verdachtige_stationen vs ON vs.station_id = su.station_id
WHERE t.rallye_id = (SELECT id FROM rallyes WHERE name LIKE '%Schnellenbach%')
GROUP BY t.id, t.name
ORDER BY t.id;

-- ----------------------------------------------------------------------------
-- 4. Optional: Test-Abfrage fuer ein einzelnes Team
-- ----------------------------------------------------------------------------

-- Setze hier die Team-ID ein, die du testen willst
SET @test_team_id = 1;

SELECT
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT vs.station_id) AS visited_suspects_count,
    CASE
        WHEN COUNT(DISTINCT vs.station_id) >= 4 THEN 'Anklage freigeschaltet'
        ELSE CONCAT('Noch gesperrt (', COUNT(DISTINCT vs.station_id), '/4)')
    END AS accusation_status
FROM teams t
LEFT JOIN station_unlocks su ON su.team_id = t.id AND su.unlock_source = 'chat'
LEFT JOIN tmp_verdachtige_stationen vs ON vs.station_id = su.station_id
WHERE t.id = @test_team_id
GROUP BY t.id, t.name;

-- ----------------------------------------------------------------------------
-- 5. Aufrumen (temporare Tabelle wird automatisch bei Session-Ende geloscht)
-- ----------------------------------------------------------------------------

-- Die temporare Tabelle tmp_verdachtige_stationen existiert nur in dieser Session.
-- Sie muss nicht explizit geloscht werden.

-- ----------------------------------------------------------------------------
-- 6. Hinweise
-- ----------------------------------------------------------------------------

-- - suspects.station_id wurde im Live-Schema entfernt.
-- - Die Zuordnung Verdachtiger -> Station erfolgt jetzt uber story_nodes.reveals_suspect_id + station_id.
-- - Die Anklage-Sperre (4 Verdachtige besuchen) wird in /team/chat/respond.php umgesetzt.
-- - Die Abfrage oben zeigt den aktuellen Ermittlungsfortschritt aller Teams.
-- - Wenn keine Verdachtigen-Stationen erkannt werden, musst du story_nodes mit
--   reveals_suspect_id + station_id fur deine Schnellenbach-Rallye nachrusten.
