<?php
// POST /api/team/chat/respond.php
// GEAENDERT (11.09.2026, Bugfix): nach jedem Antwortversuch wird jetzt
// team_progress.last_activity aktualisiert. Vorher wurde dieses Feld nur
// beim Loesen klassischer Raetsel (team_attempts-Trigger) gesetzt: in einem
// rein chat-nativen Szenario (keine team_attempts-Eintraege) blieb
// last_activity dauerhaft NULL, wodurch der 'inactivity'-Proaktiv-Trigger in
// evaluateProactiveNodes() (lib/story.php) niemals haette feuern koennen.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();
requireGameRunning($pdo, (int)$team['rallye_id']);


$body = getJsonBody();
requireFields($body, ['node_id', 'response']);
$nodeId = (int)$body['node_id'];
$response = (string)$body['response'];


$logStmt = $pdo->prepare("SELECT tsl.id AS log_id, tsl.is_completed, tsl.attempts, sn.type, sn.response_type, sn.points FROM team_story_log tsl JOIN story_nodes sn ON sn.id = tsl.node_id WHERE tsl.team_id = ? AND tsl.node_id = ?");
$logStmt->execute([$team['id'], $nodeId]);
$log = $logStmt->fetch();
if (!$log) jsonError(404, 'Dieser Knoten wurde diesem Team noch nicht zugestellt');
if ((bool)$log['is_completed']) jsonError(409, 'Dieser Knoten wurde bereits beantwortet');
if ($log['response_type'] === 'none') jsonError(400, 'Dieser Knoten erfordert keine Antwort');


$attempts = (int)$log['attempts'] + 1;
$pdo->prepare("UPDATE team_story_log SET attempts = ? WHERE id = ?")->execute([$attempts, $log['log_id']]);
$pdo->prepare("UPDATE team_progress SET last_activity = NOW() WHERE team_id = ?")->execute([$team['id']]);


$isCorrect = false;
$matchedOption = null;
$accusationReactionText = null;
$teamResponseValue = $response; // Default: Text/Zahl-Eingabe


if ($log['response_type'] === 'buttons') {
  $optStmt = $pdo->prepare("SELECT * FROM story_node_options WHERE id = ? AND node_id = ?");
  $optStmt->execute([(int)$response, $nodeId]);
  $matchedOption = $optStmt->fetch();
  if ($matchedOption) {
    $teamResponseValue = $matchedOption['label']; // Speichere Label statt ID
    if ($log['type'] === 'accusation') {
      $suspectStmt = $pdo->prepare("SELECT is_guilty, wrong_pick_reaction_text FROM suspects WHERE id = ?");
      $suspectStmt->execute([(int)$matchedOption['unlocks_suspect_id']]);
      $suspect = $suspectStmt->fetch();
      $isCorrect = $suspect && (bool)$suspect['is_guilty'];
      if ($suspect && !$isCorrect) $accusationReactionText = $suspect['wrong_pick_reaction_text'];
    } else {
      $isCorrect = true;
    }
  }
} else {
  $optStmt = $pdo->prepare("SELECT * FROM story_node_options WHERE node_id = ? AND correct_value IS NOT NULL AND LOWER(TRIM(correct_value)) = LOWER(TRIM(?))");
  $optStmt->execute([$nodeId, $response]);
  $matchedOption = $optStmt->fetch();
  $isCorrect = (bool)$matchedOption;
}


if (!$isCorrect) {
  jsonResponse(200, ['success' => true, 'is_correct' => false, 'reaction_text' => $accusationReactionText]);
}


$pdo->prepare("UPDATE team_story_log SET is_completed = 1, responded_at = NOW(), team_response = ? WHERE id = ?")->execute([$teamResponseValue, $log['log_id']]);


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
$unlockedStationId = null;
if ($matchedOption) {
  if (!empty($matchedOption['unlocks_station_id'])) {
    $stationUnlockStmt = $pdo->prepare("INSERT IGNORE INTO station_unlocks (team_id, station_id, unlock_source) VALUES (?, ?, 'chat')");
    $stationUnlockStmt->execute([$team['id'], (int)$matchedOption['unlocks_station_id']]);
    $unlockedStationId = (int)$matchedOption['unlocks_station_id'];
  }
  if ($matchedOption['leads_to_node_id']) {
    deliverNode($pdo, (int)$team['id'], (int)$matchedOption['leads_to_node_id']);
    $unlockedNodes[] = (int)$matchedOption['leads_to_node_id'];
  }
}


jsonResponse(200, ['success' => true, 'is_correct' => true, 'bonus_awarded' => $bonusAwarded, 'unlocked_nodes' => $unlockedNodes, 'unlocked_station_id' => $unlockedStationId]);
