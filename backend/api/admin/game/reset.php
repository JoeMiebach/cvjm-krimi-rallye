<?php
// POST /api/admin/game/reset.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
// Nur die UPDATE-Zeile am Ende wurde ergänzt (paused_at = NULL), Rest unverändert.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
$rallyeId = (int)($body['rallye_id'] ?? 0);
if ($rallyeId === 0 || empty($body['confirm'])) {
    jsonError(400, 'rallye_id oder confirm fehlt');
}

$pdo->beginTransaction();
try {
    $teamIdsStmt = $pdo->prepare("SELECT id FROM teams WHERE rallye_id = ?");
    $teamIdsStmt->execute([$rallyeId]);
    $teamIds = array_column($teamIdsStmt->fetchAll(), 'id');

    if (!empty($teamIds)) {
        $in = implode(',', array_fill(0, count($teamIds), '?'));
        $pdo->prepare("DELETE FROM team_attempts WHERE team_id IN ($in)")->execute($teamIds);
        $pdo->prepare("DELETE FROM station_unlocks WHERE team_id IN ($in)")->execute($teamIds);
        $pdo->prepare("DELETE FROM team_progress WHERE team_id IN ($in)")->execute($teamIds);
    }

    $pdo->prepare("DELETE FROM teams WHERE rallye_id = ?")->execute([$rallyeId]);
    $pdo->prepare("DELETE FROM broadcasts WHERE rallye_id = ?")->execute([$rallyeId]);
    $pdo->prepare("DELETE FROM start_codes WHERE rallye_id = ?")->execute([$rallyeId]);
    $pdo->prepare(
        "UPDATE rallyes SET is_game_running = 0, game_start_time = NULL, game_end_time = NULL, paused_at = NULL WHERE id = ?"
    )->execute([$rallyeId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    logError('game/reset.php: ' . $e->getMessage());
    jsonError(500, 'Zurücksetzen fehlgeschlagen');
}

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'game_reset', []);
jsonResponse(200, ['success' => true]);
