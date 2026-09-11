<?php
// TEMPORAERER, minimaler Diagnose-Endpunkt fuer den Chat-500er.
// Nur mit gueltigem Team-Token erreichbar. Nach Analyse loeschen.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('GET');

try {
    $team = requireTeamAuth();
} catch (Throwable $error) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'stage' => 'requireTeamAuth', 'error' => $error->getMessage()]);
    exit;
}

$diagnostic = [
    'success' => true,
    'temporary' => true,
    'team_id' => isset($team['id']) ? (int)$team['id'] : null,
    'rallye_id' => isset($team['rallye_id']) ? (int)$team['rallye_id'] : null,
    'steps' => [],
];

try {
    $stmt = $pdo->prepare('SELECT id FROM team_story_log WHERE team_id = ? LIMIT 1');
    $stmt->execute([(int)$team['id']]);
    $diagnostic['steps'][] = ['name' => 'team_story_log_id', 'ok' => true];
} catch (Throwable $error) {
    $diagnostic['steps'][] = ['name' => 'team_story_log_id', 'ok' => false, 'error' => $error->getMessage()];
    jsonResponse(200, $diagnostic);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id FROM story_nodes WHERE rallye_id = ? LIMIT 1');
    $stmt->execute([(int)$team['rallye_id']]);
    $diagnostic['steps'][] = ['name' => 'story_nodes_id', 'ok' => true];
} catch (Throwable $error) {
    $diagnostic['steps'][] = ['name' => 'story_nodes_id', 'ok' => false, 'error' => $error->getMessage()];
    jsonResponse(200, $diagnostic);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT sn.id AS node_id, tsl.id AS log_id FROM story_nodes sn JOIN team_story_log tsl ON tsl.node_id = sn.id WHERE tsl.team_id = ? LIMIT 1');
    $stmt->execute([(int)$team['id']]);
    $diagnostic['steps'][] = ['name' => 'story_nodes_log_join', 'ok' => true];
} catch (Throwable $error) {
    $diagnostic['steps'][] = ['name' => 'story_nodes_log_join', 'ok' => false, 'error' => $error->getMessage()];
    jsonResponse(200, $diagnostic);
    exit;
}

try {
    $stmt = $pdo->query('SELECT id, node_id, label FROM story_node_options LIMIT 1');
    $stmt->fetch();
    $diagnostic['steps'][] = ['name' => 'story_node_options_minimal', 'ok' => true];
} catch (Throwable $error) {
    $diagnostic['steps'][] = ['name' => 'story_node_options_minimal', 'ok' => false, 'error' => $error->getMessage()];
    jsonResponse(200, $diagnostic);
    exit;
}

jsonResponse(200, $diagnostic);
