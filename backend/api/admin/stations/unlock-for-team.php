<?php
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['team_id', 'station_id']);
$teamId = (int)$body['team_id'];
$stationId = (int)$body['station_id'];
if ($teamId <= 0 || $stationId <= 0) {
    jsonError(400, 'team_id und station_id müssen gültig sein');
}

$stmt = $pdo->prepare('SELECT id, rallye_id FROM teams WHERE id = ?');
$stmt->execute([$teamId]);
$team = $stmt->fetch();
if (!$team) {
    jsonError(404, 'Team nicht gefunden');
}

$stmt = $pdo->prepare('SELECT id, rallye_id FROM stations WHERE id = ?');
$stmt->execute([$stationId]);
$station = $stmt->fetch();
if (!$station) {
    jsonError(404, 'Station nicht gefunden');
}
if ((int)$team['rallye_id'] !== (int)$station['rallye_id']) {
    jsonError(409, 'Team und Station gehören nicht zur selben Rallye');
}

$stmt = $pdo->prepare(
    "INSERT INTO station_unlocks (team_id, station_id, unlock_source, unlocked_at, unlocked_by_admin_id)
     VALUES (?, ?, 'manual', NOW(), ?)
     ON DUPLICATE KEY UPDATE
       unlock_source = 'manual',
       unlocked_at = NOW(),
       unlocked_by_admin_id = VALUES(unlocked_by_admin_id)"
);
$stmt->execute([$teamId, $stationId, (int)$admin['id']]);

logAdminAction($pdo, (int)$admin['id'], (int)$team['rallye_id'], 'station_manually_unlocked', [
    'team_id' => $teamId,
    'station_id' => $stationId
]);
jsonResponse(200, ['success' => true]);
