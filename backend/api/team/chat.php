<?php
// GET /api/team/chat.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// GEAENDERT (11.09.2026, 00-Bug-Fix): Optionen werden nur bei response_type='buttons'
// geladen, nicht bei text/number/puzzle_ref/photo_ref. Sonst rendert das Frontend
// fä¿½lschlicherweise die Options-ID (z.B. "00") statt nur das Eingabeformular.
// HOTFIX (11.09.2026, 03:40): Robustere Options-Abfrage mit explizitem ORDER BY.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$chatStmt = $pdo->prepare(
    "SELECT sn.id AS node_id, sn.message_text, sn.image_url, sn.media_type, sn.media_url,
            sn.map_latitude, sn.map_longitude, sn.response_type, sn.station_id, sn.puzzle_id,
            sn.points, tsl.delivered_at, tsl.responded_at, tsl.team_response, tsl.is_completed,
            tsl.attempts, sn.type
     FROM story_nodes sn
     JOIN team_story_log tsl ON tsl.node_id = sn.id
     WHERE tsl.team_id = ? AND sn.is_active = 1
     ORDER BY tsl.delivered_at ASC"
);
$chatStmt->execute([$team['id']]);
$chat = $chatStmt->fetchAll();

$result = [];
foreach ($chat as &$entry) {
    $options = [];
    // Optionen nur bei buttons laden -- das ist der Fix fuer den "00"-Bug
    if ($entry['response_type'] === 'buttons') {
        $optStmt = $pdo->prepare(
            "SELECT id, label, unlocks_station_id, leads_to_node_id, unlocks_suspect_id
             FROM story_node_options
             WHERE node_id = ?
             ORDER BY id ASC"
        );
        $optStmt->execute([$entry['node_id']]);
        $optRows = $optStmt->fetchAll();
        if ($optRows) {
            $options = $optRows;
        }
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
        'media_type' => $entry['media_type'],
        'media_url' => $entry['media_url'],
        'map_latitude' => $entry['map_latitude'],
        'map_longitude' => $entry['map_longitude'],
        'response_type' => $entry['response_type'],
        'station_id' => $entry['station_id'] ? (int)$entry['station_id'] : null,
        'puzzle_id' => $entry['puzzle_id'] ? (int)$entry['puzzle_id'] : null,
        'points' => (int)$entry['points'],
        'options' => $options,
    ];
}

jsonResponse(200, ['success' => true, 'chat' => $result]);
