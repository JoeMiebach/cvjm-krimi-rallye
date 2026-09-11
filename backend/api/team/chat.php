<?php
// GET /api/team/chat.php
// Kompatibilitaets-Hotfix: Es werden nur Basisfelder abgefragt, die fuer
// den Chat zwingend vorhanden sein muessen. Optionale Phase-E/F-Spalten
// werden als null geliefert, damit fehlende DB-Migrationen keinen 500er ausloesen.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$chatStmt = $pdo->prepare(
    "SELECT sn.id AS node_id, sn.message_text, sn.image_url, sn.response_type,
            sn.station_id, sn.puzzle_id, sn.points, tsl.delivered_at,
            tsl.responded_at, tsl.team_response, tsl.is_completed, tsl.attempts, sn.type
     FROM story_nodes sn
     JOIN team_story_log tsl ON tsl.node_id = sn.id
     WHERE tsl.team_id = ? AND sn.is_active = 1
     ORDER BY tsl.delivered_at ASC, tsl.id ASC"
);
$chatStmt->execute([$team['id']]);
$chat = $chatStmt->fetchAll();

$optionStmt = $pdo->prepare(
    "SELECT id, label
     FROM story_node_options
     WHERE node_id = ?
     ORDER BY id ASC"
);

$result = [];
foreach ($chat as $entry) {
    $options = [];
    if ($entry['response_type'] === 'buttons') {
        $optionStmt->execute([$entry['node_id']]);
        $options = $optionStmt->fetchAll();
    }

    $result[] = [
        'node_id' => (int)$entry['node_id'],
        'delivered_at' => $entry['delivered_at'],
        'responded_at' => $entry['responded_at'],
        'team_response' => $entry['team_response'],
        'is_completed' => (bool)$entry['is_completed'],
        'attempts' => (int)$entry['attempts'],
        'type' => $entry['type'],
        'message_text' => $entry['message_text'],
        'image_url' => $entry['image_url'],
        'media_type' => 'none',
        'media_url' => null,
        'map_latitude' => null,
        'map_longitude' => null,
        'response_type' => $entry['response_type'],
        'station_id' => $entry['station_id'] !== null ? (int)$entry['station_id'] : null,
        'puzzle_id' => $entry['puzzle_id'] !== null ? (int)$entry['puzzle_id'] : null,
        'points' => (int)$entry['points'],
        'options' => $options,
    ];
}

jsonResponse(200, ['success' => true, 'chat' => $result]);
