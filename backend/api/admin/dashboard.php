<?php
// GET /api/admin/dashboard.php?rallye_id= - siehe 04_API_Spezifikation_PHP.md ("Beobachter-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$rallyeStmt = $pdo->prepare("SELECT * FROM rallyes WHERE id = ?");
$rallyeStmt->execute([$rallyeId]);
$rallye = $rallyeStmt->fetch();
if (!$rallye) {
    jsonError(404, 'Rallye nicht gefunden');
}

$teamCountStmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM teams WHERE rallye_id = ? AND is_active = 1");
$teamCountStmt->execute([$rallyeId]);
$teamCount = (int)$teamCountStmt->fetch()['cnt'];

$activeTeamsStmt = $pdo->prepare(
    "SELECT COUNT(*) AS cnt FROM teams WHERE rallye_id = ? AND is_active = 1 AND last_position_update > DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
);
$activeTeamsStmt->execute([$rallyeId]);
$activeTeams = (int)$activeTeamsStmt->fetch()['cnt'];

$stationCountStmt = $pdo->prepare("SELECT COUNT(*) AS cnt FROM stations WHERE rallye_id = ? AND is_active = 1");
$stationCountStmt->execute([$rallyeId]);
$stationCount = (int)$stationCountStmt->fetch()['cnt'];

$remainingSeconds = null;
if ($rallye['game_end_time']) {
    $remainingSeconds = max(0, strtotime($rallye['game_end_time']) - time());
}

jsonResponse(200, [
    'success' => true,
    'dashboard' => [
        'team_count'        => $teamCount,
        'active_teams'      => $activeTeams,
        'station_count'     => $stationCount,
        'is_game_running'   => (bool)$rallye['is_game_running'],
        // NEU: is_paused, damit das Frontend zwischen "noch nie gestartet"
        // und "läuft aktuell nicht, weil pausiert" unterscheiden kann
        // (Variante B: paused_at speichert den Pausenzeitpunkt).
        'is_paused'         => $rallye['paused_at'] !== null,
        'has_started'       => $rallye['game_start_time'] !== null,
        'game_end_time'     => $rallye['game_end_time'],
        'remaining_seconds' => $remainingSeconds,
    ],
]);
