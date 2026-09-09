<?php
// POST /api/admin/teams/reset-progress.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['team_id']);
$teamId = (int)$body['team_id'];

$pdo->beginTransaction();
try {
    $pdo->prepare("DELETE FROM team_attempts WHERE team_id = ?")->execute([$teamId]);
    $pdo->prepare("DELETE FROM station_unlocks WHERE team_id = ?")->execute([$teamId]);
    $pdo->prepare(
        "UPDATE team_progress SET stations_completed = 0, total_points = 0, total_hints_used = 0, last_activity = NULL WHERE team_id = ?"
    )->execute([$teamId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    logError('reset-progress.php: ' . $e->getMessage());
    jsonError(500, 'Zurücksetzen fehlgeschlagen');
}

logAdminAction($pdo, (int)$admin['id'], null, 'team_progress_reset', ['team_id' => $teamId]);
jsonResponse(200, ['success' => true]);
