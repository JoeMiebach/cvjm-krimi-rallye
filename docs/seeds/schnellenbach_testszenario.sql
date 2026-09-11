-- Schnellenbach-Testlauf: GPS-Radien fuer reale Smartphone-Genauigkeit.
-- Dieser Patch kann auf eine bereits eingespielte Schnellenbach-Rallye
-- angewendet werden; er veraendert ausschliesslich die beiden GPS-Stationen.

UPDATE stations
SET geofence_radius_meters = 50
WHERE title IN ('Friedhof Schnellenbach', 'Sportplatz auf dem Hoechsten')
  AND unlock_type = 'gps';

SELECT id, title, latitude, longitude, geofence_radius_meters
FROM stations
WHERE title IN ('Friedhof Schnellenbach', 'Sportplatz auf dem Hoechsten');

-- Anklage-Sperre: Alle 4 Verdä±½tigen müssen besucht werden
-- Diese Abfrage zeigt, wie viele Verdä±½tige jedes Team bereits besucht hat
SELECT
  t.id AS team_id,
  t.team_name,
  COUNT(DISTINCT s.id) AS visited_suspects_count,
  CASE
    WHEN COUNT(DISTINCT s.id) >= 4 THEN 'Anklage freigeschaltet'
    ELSE 'Noch gesperrt'
  END AS accusation_status
FROM teams t
LEFT JOIN station_unlocks su ON su.team_id = t.id AND su.unlock_source = 'chat'
LEFT JOIN suspects s ON s.station_id = su.station_id
WHERE t.rallye_id = (SELECT id FROM rallyes WHERE title = 'Schnellenbach')
GROUP BY t.id, t.team_name;
