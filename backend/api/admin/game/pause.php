<?php
// POST /api/admin/game/pause.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
$rallyeId = (int)($body['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

// Variante B: paused_at speichert den Pausenzeitpunkt, damit start.php beim
// Fortsetzen die Restzeit korrekt um die Pausendauer verschieben kann,
// statt die Spielzeit einfach weiterlaufen zu lassen.
$stmt = $pdo->prepare("UPDATE rallyes SET is_game_running = 0, paused_at = NOW() WHERE id = ?");
$stmt->execute([$rallyeId]);
if ($stmt->rowCount() === 0) {
    jsonError(404, 'Rallye nicht gefunden');
}

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'game_paused', []);
jsonResponse(200, ['success' => true]);
