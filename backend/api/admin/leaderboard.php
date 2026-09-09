<?php
// GET /api/admin/leaderboard.php?rallye_id= - siehe 04_API_Spezifikation_PHP.md ("Beobachter-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$stmt = $pdo->prepare("SELECT * FROM leaderboard WHERE rallye_id = ?");
$stmt->execute([$rallyeId]);
jsonResponse(200, ['success' => true, 'leaderboard' => $stmt->fetchAll()]);
