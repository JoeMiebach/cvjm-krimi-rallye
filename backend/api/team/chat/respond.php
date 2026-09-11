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
// FIX (11.09.2026, 13:59): discovered_at nur setzen wenn Spalte existiert
//
// FIX (11.09.2026, 22:32, KRITISCH): Die Anklage-Sperre pruefte bisher
// "suspects.station_id" -- diese Spalte existiert im Schema gar nicht!
// Jetzt korrekt gegen team_story_log + story_nodes.reveals_suspect_id.
//
// FIX (11.09.2026, 22:58, KRITISCH): station_unlocks.unlocked_at hatte
// DEFAULT current_timestamp() im Schema -- dadurch wurde eine Station beim
// blossen "Entdecken" per Chat automatisch AUCH freigeschaltet, obwohl nur
// discovered_at gesetzt werden sollte. Voraussetzung: Migration 007 wurde
// eingespielt (unlocked_at DEFAULT entfernt). Jetzt wird unlocked_at beim
// Entdecken IMMER explizit auf NULL gesetzt -- ausser bei Stationen mit
// unlock_type = 'auto', die weiterhin sofort bei Entdeckung freigeschaltet
// werden sollen (z.B. die erste Station einer Rallye ohne echten Vor-Ort-Check).

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
    $puzzleSolvedStmt = $pdo->prepare(
        "SELECT 1 FROM team_attempts WHERE team_id = ? AND puzzle_id = ? AND is_correct = 1 LIMIT 1"
    );
    $puzzleSolvedStmt->execute([$team['id'], $log['puzzle_id']]);
    $isCorrect = (bool)$puzzleSolvedStmt->fetch();

    if ($isCorrect) {
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

$columnCheckStmt = $pdo->query("
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'station_unlocks' 
    AND COLUMN_NAME = 'discovered_at'
");
$hasDiscoveredColumn = ($columnCheckStmt->fetch()['cnt'] ?? 0) > 0;

// ---------------------------------------------------------------------
// Station als "entdeckt" markieren (unlocks_station_id) - jetzt auch bei puzzle_ref
// FIX (22:58): unlocked_at wird IMMER explizit gesetzt (NULL oder NOW()),
// niemals dem DB-Default ueberlassen. Nur unlock_type = 'auto' schaltet bei
// Entdeckung sofort frei.
// ---------------------------------------------------------------------
if ($matchedOption && !empty($matchedOption['unlocks_station_id'])) {
    $targetStationId = (int)$matchedOption['unlocks_station_id'];

    $stationTypeStmt = $pdo->prepare("SELECT unlock_type FROM stations WHERE id = ?");
    $stationTypeStmt->execute([$targetStationId]);
    $stationInfo = $stationTypeStmt->fetch();
    $isAutoUnlock = $stationInfo && $stationInfo['unlock_type'] === 'auto';

    $canDiscover = true;

    if ($log['type'] === 'accusation') {
        $accusationCheckStmt = $pdo->prepare("
            SELECT COUNT(DISTINCT sn.reveals_suspect_id) AS revealed_count
            FROM team_story_log tsl
            JOIN story_nodes sn ON sn.id = tsl.node_id
            WHERE tsl.team_id = ?
              AND tsl.is_completed = 1
              AND sn.reveals_suspect_id IS NOT NULL
        ");
        $accusationCheckStmt->execute([$team['id']]);
        $accusationCheck = $accusationCheckStmt->fetch();
        $allSuspectsVisited = $accusationCheck && (int)$accusationCheck['revealed_count'] >= 4;

        if (!$allSuspectsVisited) {
            $canDiscover = false;
            error_log(sprintf(
                '[ANKLAGE-SPERRE] Team %d: Anklage verweigert, nur %d/4 Verdaechtige enthuellt',
                $team['id'],
                (int)$accusationCheck['revealed_count']
            ));
        }
    }

    if ($canDiscover && $hasDiscoveredColumn) {
        if ($isAutoUnlock) {
            // Station wird sofort freigeschaltet UND als entdeckt markiert.
            $stationDiscoverStmt = $pdo->prepare("
                INSERT INTO station_unlocks (team_id, station_id, discovered_at, unlocked_at, unlock_source)
                VALUES (?, ?, NOW(), NOW(), 'auto')
                ON DUPLICATE KEY UPDATE
                    discovered_at = COALESCE(discovered_at, NOW()),
                    unlocked_at = COALESCE(unlocked_at, NOW()),
                    unlock_source = COALESCE(NULLIF(unlock_source, ''), 'auto')
            ");
        } else {
            // Nur "entdeckt" -- unlocked_at BLEIBT NULL, bis QR-Code oder
            // GPS-Geofence die Station tatsaechlich freischaltet.
            $stationDiscoverStmt = $pdo->prepare("
                INSERT INTO station_unlocks (team_id, station_id, discovered_at, unlocked_at, unlock_source)
                VALUES (?, ?, NOW(), NULL, NULL)
                ON DUPLICATE KEY UPDATE discovered_at = COALESCE(discovered_at, NOW())
            ");
        }
        $stationDiscoverStmt->execute([$team['id'], $targetStationId]);
        $discoveredStationId = $targetStationId;
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
