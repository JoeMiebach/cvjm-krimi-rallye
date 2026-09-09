<?php
// backend/api/lib/story.php
// NEU (Phase A, Ermittler-Chat-System): Kernlogik fuer die Knoten-Kaskade.
// Siehe docs/05_Technische_Spezifikation_Ermittler_Chat_v1.md.
//
// Zentrales Prinzip: story_node_options wird fuer ZWEI Zwecke genutzt --
// bei response_type='none' (Info-/Verzweigungsknoten) sind die Optionen KEINE
// sichtbaren Buttons, sondern werden automatisch/sofort kaskadierend an das
// Team ausgeliefert (deliverNode() ruft sich fuer jede Option rekursiv selbst
// auf). Bei allen anderen response_type-Werten sind die Optionen echte,
// sichtbare Buttons, auf die das Team aktiv reagieren muss.

declare(strict_types=1);

function deliverNode(PDO $pdo, int $teamId, int $nodeId): void
{
    $check = $pdo->prepare("SELECT id FROM team_story_log WHERE team_id = ? AND node_id = ?");
    $check->execute([$teamId, $nodeId]);
    if ($check->fetch()) {
        return; // Bereits zugestellt -- keine erneute Kaskade, verhindert Endlosschleifen.
    }

    $nodeStmt = $pdo->prepare("SELECT * FROM story_nodes WHERE id = ? AND is_active = 1");
    $nodeStmt->execute([$nodeId]);
    $node = $nodeStmt->fetch();
    if (!$node) {
        return;
    }

    $isInfoNode = $node['response_type'] === 'none';

    $insert = $pdo->prepare(
        "INSERT INTO team_story_log (team_id, node_id, is_completed) VALUES (?, ?, ?)"
    );
    $insert->execute([$teamId, $nodeId, $isInfoNode ? 1 : 0]);

    if ($isInfoNode) {
        if ((int)$node['points'] > 0) {
            awardStoryPoints($pdo, $teamId, (int)$node['points']);
        }

        // Info-Knoten schalten ALLE ihre Optionen sofort und automatisch frei --
        // das ist der Mechanismus fuer "mehrere parallele Leads ohne Auswahl-Zwang".
        $optionsStmt = $pdo->prepare(
            "SELECT leads_to_node_id FROM story_node_options
             WHERE node_id = ? AND leads_to_node_id IS NOT NULL"
        );
        $optionsStmt->execute([$nodeId]);
        foreach ($optionsStmt->fetchAll() as $option) {
            deliverNode($pdo, $teamId, (int)$option['leads_to_node_id']);
        }
    }
}

function awardStoryPoints(PDO $pdo, int $teamId, int $points): void
{
    $stmt = $pdo->prepare("UPDATE team_progress SET total_points = total_points + ? WHERE team_id = ?");
    $stmt->execute([$points, $teamId]);
}

function deliverRootNodesIfNeeded(PDO $pdo, int $teamId, int $rallyeId): void
{
    $hasLog = $pdo->prepare("SELECT 1 FROM team_story_log WHERE team_id = ? LIMIT 1");
    $hasLog->execute([$teamId]);
    if ($hasLog->fetch()) {
        return;
    }

    $roots = $pdo->prepare(
        "SELECT id FROM story_nodes WHERE rallye_id = ? AND is_root = 1 AND is_active = 1"
    );
    $roots->execute([$rallyeId]);
    foreach ($roots->fetchAll() as $root) {
        deliverNode($pdo, $teamId, (int)$root['id']);
    }
}

// Proaktive Knoten: werden automatisch zugestellt, sobald ihre Bedingung erfuellt ist,
// OHNE dass das Team etwas tun muss. Wird bei jedem GET /team/chat.php-Poll geprueft
// (Lazy Evaluation, konsistent mit cleanupExpiredPositions() -- kein Cronjob noetig).
function evaluateProactiveNodes(PDO $pdo, int $teamId, int $rallyeId): void
{
    $inactivity = $pdo->prepare(
        "SELECT sn.id FROM story_nodes sn
         WHERE sn.rallye_id = ? AND sn.is_active = 1 AND sn.proactive_trigger = 'inactivity'
           AND sn.proactive_after_minutes IS NOT NULL
           AND sn.id NOT IN (SELECT node_id FROM team_story_log WHERE team_id = ?)
           AND EXISTS (
               SELECT 1 FROM team_progress tp
               WHERE tp.team_id = ? AND tp.last_activity IS NOT NULL
                 AND tp.last_activity < (NOW() - INTERVAL sn.proactive_after_minutes MINUTE)
           )"
    );
    $inactivity->execute([$rallyeId, $teamId, $teamId]);
    foreach ($inactivity->fetchAll() as $row) {
        deliverNode($pdo, $teamId, (int)$row['id']);
    }

    $wrongAttempts = $pdo->prepare(
        "SELECT sn.id FROM story_nodes sn
         JOIN team_story_log tsl ON tsl.node_id = sn.related_node_id AND tsl.team_id = ?
         WHERE sn.rallye_id = ? AND sn.is_active = 1 AND sn.proactive_trigger = 'wrong_attempts'
           AND sn.related_node_id IS NOT NULL
           AND sn.proactive_after_attempts IS NOT NULL
           AND tsl.attempts >= sn.proactive_after_attempts
           AND tsl.is_completed = 0
           AND sn.id NOT IN (SELECT node_id FROM team_story_log WHERE team_id = ?)"
    );
    $wrongAttempts->execute([$teamId, $rallyeId, $teamId]);
    foreach ($wrongAttempts->fetchAll() as $row) {
        deliverNode($pdo, $teamId, (int)$row['id']);
    }
}
