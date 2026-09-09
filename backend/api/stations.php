<?php
// GET /api/stations.php?rallye_id=
require_once __DIR__ . '/bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) jsonError(400, 'rallye_id fehlt');
requireRallyeAccess($rallyeId, $team);

$stmt = $pdo->prepare("SELECT * FROM stations WHERE rallye_id = ? AND is_active = 1 ORDER BY order_index");
$stmt->execute([$rallyeId]);
$stations = $stmt->fetchAll();

$unlockStmt = $pdo->prepare("SELECT station_id FROM station_unlocks WHERE team_id = ?");
$unlockStmt->execute([$team['id']]);
$unlockedIds = array_column($unlockStmt->fetchAll(), 'station_id');

$result = array_map(function ($s) use ($unlockedIds) {
  return [
    'id' => (int)$s['id'],
    'title' => $s['title'],
    'description' => $s['description'],
    'story_text' => $s['story_text'],
    'latitude' => $s['latitude'],
    'longitude' => $s['longitude'],
    'geofence_radius_meters' => (int)$s['geofence_radius_meters'],
    'unlock_type' => $s['unlock_type'],
    'discovery_mode' => $s['discovery_mode'],
    'points' => (int)$s['points'],
    'is_unlocked' => in_array((int)$s['id'], $unlockedIds, true),
  ];
}, $stations);

jsonResponse(200, ['success' => true, 'stations' => $result]);
