<?php
// GET /api/team/chat.php - siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md
// NEU (Phase A): Liefert den vollstaendigen Chat-Verlauf des Teams. Stellt bei
// Bedarf zunaechst die Root-Knoten zu (erster Kontakt) und prueft anschliessend,
// ob proaktive Knoten (Inaktivitaet/Fehlversuche) faellig sind -- alles per
// Lazy Evaluation bei diesem Request, kein Cronjob noetig.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

deliverRootNodesIfNeeded($pdo, (int)$team['id'], (int)$team['rallye_id']);
evaluateProactiveNodes($pdo, (int)$team['id'], (int)$team['rallye_id']);

$stmt = $pdo->prepare(
    "SELECT tsl.node_id, tsl.delivered_at, tsl.responded_at, tsl.team_response,
            tsl.is_completed, tsl.attempts,
            sn.type, sn.message_text, sn.image_url, sn.map_latitude, sn.map_longitude,
            sn.response_type, sn.station_id, sn.puzzle_id, sn.points
     FROM team_story_log tsl
     JOIN story_nodes sn ON sn.id = tsl.node_id
     WHERE tsl.team_id = ?
     ORDER BY tsl.delivered_at ASC"
);
$stmt->execute([$team['id']]);
$entries = $stmt->fetchAll();

// Antwortoptionen fuer alle noch offenen Antwortknoten mitladen. WICHTIG:
// correct_value wird hier bewusst NICHT selektiert, um Loesungen nicht an den
// Client zu verraten.
$openNodeIds = array_values(array_unique(array_map(
    static fn ($e) => (int)$e['node_id'],
    array_filter($entries, static fn ($e) => !$e['is_completed'] && $e['response_type'] !== 'none')
)));

$optionsByNode = [];
if (!empty($openNodeIds)) {
    $placeholders = implode(',', array_fill(0, count($openNodeIds), '?'));
    $optStmt = $pdo->prepare(
        "SELECT id, node_id, label FROM story_node_options WHERE node_id IN ($placeholders)"
    );
    $optStmt->execute($openNodeIds);
    foreach ($optStmt->fetchAll() as $opt) {
        $optionsByNode[(int)$opt['node_id']][] = ['id' => (int)$opt['id'], 'label' => $opt['label']];
    }
}

$chat = array_map(static function ($entry) use ($optionsByNode) {
    $entry['options'] = $optionsByNode[(int)$entry['node_id']] ?? [];
    return $entry;
}, $entries);

jsonResponse(200, ['success' => true, 'chat' => $chat]);
