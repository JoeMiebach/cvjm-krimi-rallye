<?php
// GET /api/admin/leaderboard.php?rallye_id=
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) jsonError(400, 'rallye_id fehlt');

$stmt = $pdo->prepare("SELECT * FROM leaderboard WHERE rallye_id = ? ORDER BY total_points DESC, started_at ASC");
$stmt->execute([$rallyeId]);
jsonResponse(200, ['success' => true, 'leaderboard' => $stmt->fetchAll()]);
