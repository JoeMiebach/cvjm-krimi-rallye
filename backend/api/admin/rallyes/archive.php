<?php
// POST /api/admin/rallyes/archive.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['rallye_id']);
$rallyeId = (int)$body['rallye_id'];

$stmt = $pdo->prepare("UPDATE rallyes SET is_archived = 1, is_game_running = 0 WHERE id = ?");
$stmt->execute([$rallyeId]);
if ($stmt->rowCount() === 0) {
    jsonError(404, 'Rallye nicht gefunden');
}

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'rallye_archived', []);
jsonResponse(200, ['success' => true]);
