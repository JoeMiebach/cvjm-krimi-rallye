<?php
// POST /api/team/chat/respond.php
//
// FIX (11.09.2026, Puzzle-Progression): Bei 'puzzle_ref'-Knoten wird jetzt
// der naechste Knoten korrekt ausgeloest, auch wenn es keine story_node_options-
// Zeile mit 'correct_value' gibt. Die Progression liegt jetzt in der Option
// mit leads_to_node_id, die beim Puzzle-Node angelegt wird.
//
// FIX (11.09.2026, unlocks_station_id ENTFERNT): Stationen werden NICHT mehr
// ueber Chat freigeschaltet. Freischaltung erfolgt AUSSCHLIESSLICH per QR-Code
// oder GPS-Geofence (siehe /api/stations/unlock.php).
//
// NEU (11.09.2026, entdeckt): Chat markiert Station als "entdeckt" (discovered_at),
// damit sie in der Stations-Liste mit "🔒 verschlossen" angezeigt werden kann.

require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
requireFields($body, ['node_id', 'response']);
$nodeId = (int)$body['node_id'];
$response = (string)$body['response'];

$logStmt = $pdo->prepare("SELECT tsl.id AS log_id, tsl.is_completed, tsl.attempts, sn.type, sn.response_type, sn.points, sn.puzzle_id FROM team_story_log tsl JOIN story_nodes sn ON sn.id = tsl.node_id WHERE tsl.team_id = ? AND tsl.node_id = ?");
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
$teamResponseValue = $response;

// ---------------------------------------------------------------------
// FALL 1: Button-Antwort (normale Info/Twist/Accusation-Knoten)
// ---------------------------------------------------------------------
if ($log['response_type'] === 'buttons') {
    $optStmt = $pdo->prepare("SELECT * FROM story_node_options WHERE id = ? AND node_id = ?");
    $optStmt->execute([(int)$response, $nodeId]);
    $matchedOption = $optStmt->fetch();
    if ($matchedOption) {
        $teamResponseValue = $matchedOption['label'];
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
}
// ---------------------------------------------------------------------
// FALL 2: puzzle_ref-Knoten (Antwort kommt aus PuzzlesScreen, nicht hier)
// ---------------------------------------------------------------------
elseif ($log['response_type'] === 'puzzle_ref') {
    // Bei puzzle_ref-Knoten erfolgt die Antwort im separaten submit.php-Flow.
    // Dieser Endpunkt wird nur aufgerufen, wenn das Frontend eine "Dummy"-
    // Antwort sendet (z.B. "Raetsel geloest"-Button im Chat).
    // Wir pruefen, ob das Puzzle bereits geloest wurde:
    $puzzleSolvedStmt = $pdo->prepare(
        "SELECT 1 FROM team_attempts WHERE team_id = ? AND puzzle_id = ? AND is_correct = 1 LIMIT 1"
    );
    $puzzleSolvedStmt->execute([$team['id'], $log['puzzle_id']]);
    $isCorrect = (bool)$puzzleSolvedStmt->fetch();
    
    if ($isCorrect) {
        // Option finden, die vom Puzzle-Node zum naechsten Knoten fuehrt
        $optStmt = $pdo->prepare(
            "SELECT * FROM story_node_options WHERE node_id = ? AND leads_to_node_id IS NOT NULL LIMIT 1"
        );
        $optStmt->execute([$nodeId]);
        $matchedOption = $optStmt->fetch();
        $teamResponseValue = 'Puzzle geloest';
    }
}
// ---------------------------------------------------------------------
// FALL 3: Text/Zahl-Antwort (normale answer-Knoten)
// ---------------------------------------------------------------------
else {
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
$discoveredStationId = null;

// ---------------------------------------------------------------------
// Station als "entdeckt" markieren (unlocks_station_id) - jetzt auch bei puzzle_ref
// ---------------------------------------------------------------------
if ($matchedOption && !empty($matchedOption['unlocks_station_id'])) {
    // ANKLAGE-SPERRE: Nur bei Anklage-Knoten pruefen
    if ($log['type'] === 'accusation') {
        $accusationCheckStmt = $pdo->prepare("
            SELECT COUNT(DISTINCT s.id) AS visited_count
            FROM suspects s
            JOIN station_unlocks su ON su.station_id = s.station_id
            WHERE su.team_id = ? AND su.unlocked_at IS NOT NULL
        ");
        $accusationCheckStmt->execute([$team['id']]);
        $accusationCheck = $accusationCheckStmt->fetch();
        $allSuspectsVisited = $accusationCheck && (int)$accusationCheck['visited_count'] >= 4;

        if (!$allSuspectsVisited) {
            error_log(sprintf(
                '[ANKLAGE-SPERRE] Team %d: Anklage verweigert, nur %d/4 Verdä¨½tigen besucht',
                $team['id'],
                (int)$accusationCheck['visited_count']
            ));
        } else {
            // Station als entdeckt markieren (nicht freischalten!)
            $stationDiscoverStmt = $pdo->prepare("
                INSERT INTO station_unlocks (team_id, station_id, discovered_at)
                VALUES (?, ?, NOW())
                ON DUPLICATE KEY UPDATE discovered_at = COALESCE(discovered_at, NOW())
            ");
            $stationDiscoverStmt->execute([$team['id'], (int)$matchedOption['unlocks_station_id']]);
            $discoveredStationId = (int)$matchedOption['unlocks_station_id'];
        }
    } else {
        // Normale Station-Entdeckung (nicht Anklage)
        $stationDiscoverStmt = $pdo->prepare("
            INSERT INTO station_unlocks (team_id, station_id, discovered_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE discovered_at = COALESCE(discovered_at, NOW())
        ");
        $stationDiscoverStmt->execute([$team['id'], (int)$matchedOption['unlocks_station_id']]);
        $discoveredStationId = (int)$matchedOption['unlocks_station_id'];
    }
}

// ---------------------------------------------------------------------
// Naechsten Knoten zustellen (leads_to_node_id)
// ---------------------------------------------------------------------
if ($matchedOption && $matchedOption['leads_to_node_id']) {
    deliverNode($pdo, (int)$team['id'], (int)$matchedOption['leads_to_node_id']);
    $unlockedNodes[] = (int)$matchedOption['leads_to_node_id'];
}

jsonResponse(200, [
    'success' => true,
    'is_correct' => true,
    'bonus_awarded' => $bonusAwarded,
    'unlocked_nodes' => $unlockedNodes,
    'discovered_station_id' => $discoveredStationId
]);
