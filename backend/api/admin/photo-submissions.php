<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();
$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) jsonError(400, 'rallye_id fehlt');
$stmt = $pdo->prepare("SELECT ps.id, ps.team_id, t.name AS team_name, ps.node_id, sn.message_text AS node_message, ps.photo_path, ps.submitted_at, ps.points_awarded_at FROM photo_submissions ps JOIN teams t ON t.id = ps.team_id JOIN story_nodes sn ON sn.id = ps.node_id WHERE t.rallye_id = ? ORDER BY ps.submitted_at DESC");
$stmt->execute([$rallyeId]);
jsonResponse(200, ['success' => true, 'photo_submissions' => $stmt->fetchAll()]);
