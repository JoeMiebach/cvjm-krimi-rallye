<?php
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();
$body = getJsonBody();
requireFields($body, ['submission_id', 'points']);
$stmt = $pdo->prepare("SELECT ps.*, sn.rallye_id FROM photo_submissions ps JOIN story_nodes sn ON sn.id = ps.node_id WHERE ps.id = ?");
$stmt->execute([(int)$body['submission_id']]);
$submission = $stmt->fetch();
if (!$submission) jsonError(404, 'Einsendung nicht gefunden');
if ($submission['points_awarded_at']) jsonError(409, 'Fuer diese Einsendung wurden bereits Punkte vergeben');
$points = (int)$body['points'];
$pdo->prepare("UPDATE photo_submissions SET points_awarded_at = NOW(), points_awarded_by_admin_id = ? WHERE id = ?")->execute([(int)$admin['id'], (int)$submission['id']]);
awardStoryPoints($pdo, (int)$submission['team_id'], $points);
logAdminAction($pdo, (int)$admin['id'], (int)$submission['rallye_id'], 'photo_submission_awarded', ['submission_id' => (int)$submission['id'], 'points' => $points]);
jsonResponse(200, ['success' => true]);
