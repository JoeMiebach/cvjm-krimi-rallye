<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['team_id', 'node_id']);
$teamId = (int)$body['team_id'];
$nodeId = (int)$body['node_id'];
if ($teamId <= 0 || $nodeId <= 0) {
    jsonError(400, 'team_id und node_id müssen gültig sein');
}

$stmt = $pdo->prepare('SELECT id, rallye_id FROM teams WHERE id = ?');
$stmt->execute([$teamId]);
$team = $stmt->fetch();
if (!$team) {
    jsonError(404, 'Team nicht gefunden');
}

$stmt = $pdo->prepare('SELECT id, rallye_id, type FROM story_nodes WHERE id = ? AND is_active = 1');
$stmt->execute([$nodeId]);
$node = $stmt->fetch();
if (!$node) {
    jsonError(404, 'Aktiver Story-Knoten nicht gefunden');
}
if ((int)$node['rallye_id'] !== (int)$team['rallye_id']) {
    jsonError(409, 'Team und Story-Knoten gehören nicht zur selben Rallye');
}

require_once __DIR__ . '/../lib/story.php';
deliverNode($pdo, (int)$team['id'], (int)$node['id']);

logAdminAction($pdo, (int)$admin['id'], (int)$team['rallye_id'], 'story_node_manually_delivered', [
    'team_id' => (int)$team['id'],
    'node_id' => (int)$node['id'],
    'node_type' => $node['type']
]);

jsonResponse(200, ['success' => true, 'team_id' => (int)$team['id'], 'node_id' => (int)$node['id']]);
