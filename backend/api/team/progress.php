<?php
// GET /api/team/progress.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$stmt = $pdo->prepare("SELECT * FROM team_progress WHERE team_id = ?");
$stmt->execute([$team['id']]);
$progress = $stmt->fetch();

if (!$progress) {
    jsonError(404, 'Fortschritt nicht gefunden');
}

jsonResponse(200, [
    'success' => true,
    'progress' => [
        'stations_completed' => (int)$progress['stations_completed'],
        'total_points'       => (int)$progress['total_points'],
        'total_hints_used'   => (int)$progress['total_hints_used'],
        'started_at'         => $progress['started_at'],
        'last_activity'      => $progress['last_activity'],
    ],
]);
