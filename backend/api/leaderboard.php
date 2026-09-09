<?php
// GET /api/leaderboard.php?rallye_id= - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
require_once __DIR__ . '/bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}
requireRallyeAccess($rallyeId, $team);

$stmt = $pdo->prepare(
    "SELECT team_id, team_name, stations_completed, total_points, total_hints_used FROM leaderboard WHERE rallye_id = ?"
);
$stmt->execute([$rallyeId]);

jsonResponse(200, ['success' => true, 'leaderboard' => $stmt->fetchAll()]);
