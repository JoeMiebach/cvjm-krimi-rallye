<?php
// GET /api/team/completed-tasks.php
// NEU (11.09.2026): Liefert alle bereits beantworteten Chat-Aufgaben des Teams
// für die "Erledigte Aufgaben"-Sektion in OpenTasksScreen.jsx.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();


$stmt = $pdo->prepare(
    "SELECT tsl.node_id, tsl.delivered_at, tsl.responded_at, sn.type, sn.message_text
     FROM team_story_log tsl
     JOIN story_nodes sn ON sn.id = tsl.node_id
     WHERE tsl.team_id = ? AND tsl.is_completed = 1
     ORDER BY tsl.responded_at DESC"
);
$stmt->execute([$team['id']]);


jsonResponse(200, ['success' => true, 'completed_tasks' => $stmt->fetchAll()]);
