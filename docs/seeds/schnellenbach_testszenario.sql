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
