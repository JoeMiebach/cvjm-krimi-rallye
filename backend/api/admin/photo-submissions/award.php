<?php
// POST /api/admin/photo-submissions/award.php
// NEU (Phase E, Ermittler-Chat-System): Vergibt nach Sichtpruefung Bonus-
// Punkte fuer eine Foto-Einsendung. points_awarded_at dient als Sperre gegen
// Doppel-Vergabe (kann pro Einsendung nur einmal ausgefuehrt werden).
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['submission_id', 'points']);
$submissionId = (int)$body['submission_id'];
$points = (int)$body['points'];

$stmt = $pdo->prepare(
    "SELECT ps.*, sn.rallye_id FROM photo_submissions ps
     JOIN story_nodes sn ON sn.id = ps.node_id
     WHERE ps.id = ?"
);
$stmt->execute([$submissionId]);
$submission = $stmt->fetch();

if (!$submission) {
    jsonError(404, 'Einsendung nicht gefunden');
}
if ($submission['points_awarded_at']) {
    jsonError(409, 'Fuer diese Einsendung wurden bereits Punkte vergeben');
}

$pdo->prepare(
    "UPDATE photo_submissions SET points_awarded_at = NOW(), points_awarded_by_admin_id = ? WHERE id = ?"
)->execute([(int)$admin['id'], $submissionId]);

$pdo->prepare(
    "UPDATE team_progress SET total_points = total_points + ? WHERE team_id = ?"
)->execute([$points, (int)$submission['team_id']]);

logAdminAction(
    $pdo,
    (int)$admin['id'],
    (int)$submission['rallye_id'],
    'photo_submission_awarded',
    ['submission_id' => $submissionId, 'points' => $points]
);

jsonResponse(200, ['success' => true]);
