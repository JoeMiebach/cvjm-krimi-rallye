<?php
// POST /api/team/chat/respond.php - siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md
// Team beantwortet einen Chat-Knoten (Button-Wahl, Text- oder Zahleneingabe).
// Chat-native Falschantworten sind straffrei und unbegrenzt wiederholbar (siehe
// Konzeptpapier v3, Punkt 7) -- AUSNAHME: bei einer finalen Anklage (type=accusation)
// zaehlt nur der ALLERERSTE Versuch fuer den Bonus (Konzeptpapier, "nur erster
// Versuch zaehlt").
// GEAENDERT (Phase C, Ermittler-Chat-System): Bei falscher Anklage wird jetzt
// zusaetzlich suspects.wrong_pick_reaction_text als "reaction_text" zurueckgegeben,
// damit ChatScreen.jsx eine passende Reaktion von Freya anzeigen kann (z.B. "Nein,
// das war nicht Erik, er hat ein Alibi...").
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
requireFields($body, ['node_id', 'response']);
$nodeId = (int)$body['node_id'];
$response = (string)$body['response'];

$logStmt = $pdo->prepare(
    "SELECT tsl.id AS log_id, tsl.is_completed, tsl.attempts, sn.type, sn.response_type, sn.points
     FROM team_story_log tsl
     JOIN story_nodes sn ON sn.id = tsl.node_id
     WHERE tsl.team_id = ? AND tsl.node_id = ?"
);
$logStmt->execute([$team['id'], $nodeId]);
$log = $logStmt->fetch();

if (!$log) {
    jsonError(404, 'Dieser Knoten wurde diesem Team noch nicht zugestellt');
}
if ((bool)$log['is_completed']) {
    jsonError(409, 'Dieser Knoten wurde bereits beantwortet');
}
if ($log['response_type'] === 'none') {
    jsonError(400, 'Dieser Knoten erfordert keine Antwort');
}

$attempts = (int)$log['attempts'] + 1;
$pdo->prepare("UPDATE team_story_log SET attempts = ? WHERE id = ?")
    ->execute([$attempts, $log['log_id']]);

$isCorrect = false;
$matchedOption = null;
$accusationReactionText = null;

if ($log['response_type'] === 'buttons') {
    $optStmt = $pdo->prepare("SELECT * FROM story_node_options WHERE id = ? AND node_id = ?");
    $optStmt->execute([(int)$response, $nodeId]);
    $matchedOption = $optStmt->fetch();

    if ($matchedOption) {
        if ($log['type'] === 'accusation') {
            $suspectStmt = $pdo->prepare(
                "SELECT is_guilty, wrong_pick_reaction_text FROM suspects WHERE id = ?"
            );
            $suspectStmt->execute([(int)$matchedOption['unlocks_suspect_id']]);
            $suspect = $suspectStmt->fetch();
            $isCorrect = $suspect && (bool)$suspect['is_guilty'];
            if ($suspect && !$isCorrect) {
                $accusationReactionText = $suspect['wrong_pick_reaction_text'];
            }
        } else {
            // Bestaetigungs-/Verzweigungs-Buttons: jede angebotene Option ist gueltig,
            // es gibt kein "falsch" -- die Wahl selbst ist die Konsequenz.
            $isCorrect = true;
        }
    }
} else {
    // text oder number: Vergleich gegen alle hinterlegten korrekten Antworten,
    // Gross-/Kleinschreibung und Leerzeichen werden ignoriert.
    $optStmt = $pdo->prepare(
        "SELECT * FROM story_node_options
         WHERE node_id = ? AND correct_value IS NOT NULL
           AND LOWER(TRIM(correct_value)) = LOWER(TRIM(?))"
    );
    $optStmt->execute([$nodeId, $response]);
    $matchedOption = $optStmt->fetch();
    $isCorrect = (bool)$matchedOption;
}

if (!$isCorrect) {
    // Chat-nativ: kein Punktabzug, keine Versuchsgrenze -- Team kann beliebig oft erneut antworten.
    jsonResponse(200, [
        'success' => true,
        'is_correct' => false,
        'reaction_text' => $accusationReactionText,
    ]);
}

$pdo->prepare(
    "UPDATE team_story_log SET is_completed = 1, responded_at = NOW(), team_response = ? WHERE id = ?"
)->execute([$response, $log['log_id']]);

$bonusAwarded = false;
if ($log['type'] === 'accusation') {
    if ($attempts === 1) {
        awardStoryPoints($pdo, (int)$team['id'], (int)$log['points']);
        $bonusAwarded = true;
    }
} elseif ((int)$log['points'] > 0) {
    awardStoryPoints($pdo, (int)$team['id'], (int)$log['points']);
}

$unlockedNodes = [];
if ($matchedOption && $matchedOption['leads_to_node_id']) {
    deliverNode($pdo, (int)$team['id'], (int)$matchedOption['leads_to_node_id']);
    $unlockedNodes[] = (int)$matchedOption['leads_to_node_id'];
}

jsonResponse(200, [
    'success' => true,
    'is_correct' => true,
    'bonus_awarded' => $bonusAwarded,
    'unlocked_nodes' => $unlockedNodes,
]);
