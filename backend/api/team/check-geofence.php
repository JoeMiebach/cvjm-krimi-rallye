<?php
// POST /api/team/check-geofence.php
// Speichert die Teamposition und schaltet GPS-Stationen im Geofence frei.
// Debug-Logs dokumentieren empfangene Positionen und Distanzen fuer Testlaeufe.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();


$body = getJsonBody();
$lat = isset($body['latitude']) ? (float)$body['latitude'] : null;
$lon = isset($body['longitude']) ? (float)$body['longitude'] : null;
if ($lat === null || $lon === null || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    error_log(sprintf(
        '[GEOFENCE] Team %d: ungueltige Koordinaten: lat=%s, lon=%s',
        $team['id'],
        var_export($body['latitude'] ?? null, true),
        var_export($body['longitude'] ?? null, true)
    ));
    jsonError(400, 'Ungueltige GPS-Koordinaten');
}


error_log(sprintf(
    '[GEOFENCE] Team %d: Position empfangen: lat=%.6f, lon=%.6f',
    $team['id'],
    $lat,
    $lon
));


$pdo->prepare(
    'UPDATE teams SET current_latitude = ?, current_longitude = ?, last_position_update = NOW() WHERE id = ?'
)->execute([$lat, $lon, $team['id']]);


$gameStmt = $pdo->prepare('SELECT is_game_running FROM rallyes WHERE id = ?');
$gameStmt->execute([$team['rallye_id']]);
$rallye = $gameStmt->fetch();
if (!$rallye || !(bool)$rallye['is_game_running']) {
    jsonResponse(200, ['success' => true, 'newly_unlocked_stations' => []]);
}


$stmt = $pdo->prepare(
    "SELECT id, title, latitude, longitude, geofence_radius_meters
     FROM stations
     WHERE rallye_id = ? AND is_active = 1 AND unlock_type = 'gps'"
);
$stmt->execute([$team['rallye_id']]);
$stations = $stmt->fetchAll();


$newlyUnlocked = [];
foreach ($stations as $station) {
    $distance = calculateDistance($lat, $lon, (float)$station['latitude'], (float)$station['longitude']);
    error_log(sprintf(
        '[GEOFENCE] Team %d: Station %d (%s): Distanz=%.1f m, Radius=%d m',
        $team['id'],
        $station['id'],
        $station['title'],
        $distance,
        $station['geofence_radius_meters']
    ));


    if ($distance <= (float)$station['geofence_radius_meters']) {
        $insert = $pdo->prepare(
            "INSERT INTO station_unlocks (team_id, station_id, unlock_source, unlocked_at)
             VALUES (?, ?, 'gps', NOW())
             ON DUPLICATE KEY UPDATE
                 unlock_source = COALESCE(unlock_source, 'gps'),
                 unlocked_at = COALESCE(unlocked_at, NOW())"
        );
        $insert->execute([$team['id'], $station['id']]);
        if ($insert->rowCount() > 0) {
            $newlyUnlocked[] = ['id' => (int)$station['id'], 'title' => $station['title']];
            error_log(sprintf(
                '[GEOFENCE] Team %d: Station %d (%s) freigeschaltet',
                $team['id'],
                $station['id'],
                $station['title']
            ));
        }
    }
}


jsonResponse(200, [
    'success' => true,
    'newly_unlocked_stations' => $newlyUnlocked,
]);
