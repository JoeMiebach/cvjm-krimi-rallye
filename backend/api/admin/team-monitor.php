<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$admin = requireAdminAuth();

$teamId = (int)($_GET['team_id'] ?? 0);
if ($teamId <= 0) {
    jsonError(400, 'team_id fehlt');
}

$stmt = $pdo->prepare(
    "SELECT t.id, t.name, t.rallye_id, t.is_active, t.start_code,
            tp.stations_completed, tp.total_points, tp.total_hints_used,
            tp.last_activity, tp.started_at
     FROM teams t
     LEFT JOIN team_progress tp ON tp.team_id = t.id
     WHERE t.id = ?"
);
$stmt->execute([$teamId]);
$team = $stmt->fetch();
if (!$team) {
    jsonError(404, 'Team nicht gefunden');
}

$stmt = $pdo->prepare(
    "SELECT tsl.id, tsl.node_id, sn.type AS node_type, sn.message_text,
            tsl.delivered_at, tsl.responded_at, tsl.team_response,
            tsl.is_completed, tsl.attempts
     FROM team_story_log tsl
     JOIN story_nodes sn ON sn.id = tsl.node_id
     WHERE tsl.team_id = ?
     ORDER BY tsl.delivered_at ASC, tsl.id ASC"
);
$stmt->execute([$teamId]);
$storyLog = $stmt->fetchAll();

$stmt = $pdo->prepare(
    "SELECT su.id, su.station_id, s.title, su.discovered_at, su.unlocked_at,
            su.unlock_source, su.unlocked_by_admin_id, a.name AS unlocked_by_admin_name
     FROM station_unlocks su
     JOIN stations s ON s.id = su.station_id
     LEFT JOIN admins a ON a.id = su.unlocked_by_admin_id
     WHERE su.team_id = ?
     ORDER BY COALESCE(su.unlocked_at, su.discovered_at) ASC, su.id ASC"
);
$stmt->execute([$teamId]);
$stationUnlocks = $stmt->fetchAll();

jsonResponse(200, [
    'success' => true,
    'team_id' => (int)$team['id'],
    'name' => $team['name'],
    'rallye_id' => (int)$team['rallye_id'],
    'is_active' => (bool)$team['is_active'],
    'stations_completed' => (int)($team['stations_completed'] ?? 0),
    'total_points' => (int)($team['total_points'] ?? 0),
    'total_hints_used' => (int)($team['total_hints_used'] ?? 0),
    'last_activity' => $team['last_activity'],
    'started_at' => $team['started_at'],
    'story_log' => $storyLog,
    'station_unlocks' => $stationUnlocks
]);
