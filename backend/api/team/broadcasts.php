<?php
// GET /api/team/broadcasts.php?since=<timestamp> - siehe 04_API_Spezifikation_PHP.md ("Polling")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$since = $_GET['since'] ?? null;
$sql = "SELECT id, message_text, sent_at FROM broadcasts
        WHERE rallye_id = ? AND is_active = 1
          AND (target_team_ids IS NULL OR FIND_IN_SET(?, target_team_ids))";
$params = [$team['rallye_id'], $team['id']];

if ($since) {
    $sql .= " AND sent_at > ?";
    $params[] = $since;
}
$sql .= " ORDER BY sent_at ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

jsonResponse(200, ['success' => true, 'broadcasts' => $stmt->fetchAll()]);
