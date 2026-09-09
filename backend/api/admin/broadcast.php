<?php
// POST /api/admin/broadcast.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['rallye_id', 'message_text']);
$rallyeId = (int)$body['rallye_id'];
$targetTeamIds = null;
if (!empty($body['target_team_ids']) && is_array($body['target_team_ids'])) {
    $targetTeamIds = implode(',', array_map('intval', $body['target_team_ids']));
}

$stmt = $pdo->prepare(
    "INSERT INTO broadcasts (rallye_id, message_text, sent_by_admin_id, target_team_ids) VALUES (?, ?, ?, ?)"
);
$stmt->execute([$rallyeId, $body['message_text'], $admin['id'], $targetTeamIds]);
$id = (int)$pdo->lastInsertId();

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'broadcast_sent', ['broadcast_id' => $id]);
jsonResponse(201, ['success' => true, 'broadcast_id' => $id]);
