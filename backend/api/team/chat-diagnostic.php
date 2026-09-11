<?php
// TEMPORAERER Diagnose-Endpunkt fuer GET /team/chat.php.
// Ausschliesslich mit gueltigem Team-Token erreichbar. Nach der Fehleranalyse loeschen.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

function diagnosticStep(PDO $pdo, string $name, string $sql, array $params = []): array
{
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        return [
            'name' => $name,
            'ok' => true,
            'row_count' => count($rows),
            'sample' => array_slice($rows, 0, 1),
        ];
    } catch (Throwable $error) {
        return [
            'name' => $name,
            'ok' => false,
            'error_class' => get_class($error),
            'error_message' => $error->getMessage(),
        ];
    }
}

$steps = [];
$steps[] = diagnosticStep($pdo, 'team_story_log',
    'SELECT id, team_id, node_id, delivered_at, responded_at, team_response, is_completed FROM team_story_log WHERE team_id = ? ORDER BY delivered_at ASC LIMIT 3',
    [(int)$team['id']]
);
$steps[] = diagnosticStep($pdo, 'story_nodes_core',
    'SELECT id, rallye_id, type, message_text, image_url, response_type, station_id, puzzle_id, points, is_active FROM story_nodes WHERE rallye_id = ? LIMIT 3',
    [(int)$team['rallye_id']]
);
$steps[] = diagnosticStep($pdo, 'chat_core_join',
    'SELECT sn.id AS node_id, sn.message_text, sn.image_url, sn.response_type, sn.station_id, sn.puzzle_id, sn.points, tsl.delivered_at, tsl.responded_at, tsl.team_response, tsl.is_completed, sn.type FROM story_nodes sn JOIN team_story_log tsl ON tsl.node_id = sn.id WHERE tsl.team_id = ? AND sn.is_active = 1 ORDER BY tsl.delivered_at ASC LIMIT 3',
    [(int)$team['id']]
);
$steps[] = diagnosticStep($pdo, 'story_node_options_minimal',
    'SELECT id, node_id, label FROM story_node_options LIMIT 3'
);
$steps[] = diagnosticStep($pdo, 'story_node_options_extended',
    'SELECT id, node_id, label, unlocks_station_id, leads_to_node_id, unlocks_suspect_id FROM story_node_options LIMIT 3'
);
$steps[] = diagnosticStep($pdo, 'story_nodes_phase_f_fields',
    'SELECT id, media_type, media_url, map_latitude, map_longitude FROM story_nodes LIMIT 3'
);
$steps[] = diagnosticStep($pdo, 'team_story_log_attempts',
    'SELECT id, attempts FROM team_story_log LIMIT 3'
);

jsonResponse(200, [
    'success' => true,
    'temporary' => true,
    'team_id' => (int)$team['id'],
    'rallye_id' => (int)$team['rallye_id'],
    'steps' => $steps,
]);
