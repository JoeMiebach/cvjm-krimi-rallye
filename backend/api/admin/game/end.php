<?php
// POST /api/admin/game/end.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
$rallyeId = (int)($body['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

// paused_at zurücksetzen, damit ein späterer erneuter Start (z. B. für einen
// Testlauf) nicht fälschlich als "Fortsetzen nach Pause" behandelt wird.
$stmt = $pdo->prepare(
    "UPDATE rallyes SET is_game_running = 0, game_end_time = NOW(), paused_at = NULL WHERE id = ?"
);
$stmt->execute([$rallyeId]);
if ($stmt->rowCount() === 0) {
    jsonError(404, 'Rallye nicht gefunden');
}

// Löst sofortiges Lazy Cleanup aus, siehe 02_Technische_Spezifikation_PHP.md ("Lazy Cleanup")
cleanupExpiredPositions($pdo);

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'game_ended', []);
jsonResponse(200, ['success' => true]);
