<?php
// GET /api/team/open-tasks.php - siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md
// NEU (Phase A): Liefert alle unbeantworteten Chat-Aufgaben des Teams --
// gefilterte Ansicht auf team_story_log fuer parallele Leads (siehe
// Konzeptpapier v3, Punkt 9 "Offene Aufgaben").
// GEFIXT (12.09.2026, 01:12): WHERE-Klausel vereinfacht, nur HAVING filtert buttons mit <=1 Option
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();


$stmt = $pdo->prepare(
    "SELECT tsl.node_id, tsl.delivered_at, sn.type, sn.message_text, sn.image_url,
            sn.map_latitude, sn.map_longitude, sn.response_type, sn.station_id, sn.puzzle_id
     FROM team_story_log tsl
     JOIN story_nodes sn ON sn.id = tsl.node_id
     LEFT JOIN story_node_options sno ON sno.node_id = tsl.node_id
     WHERE tsl.team_id = ? AND tsl.is_completed = 0
       AND sn.response_type != 'none'
     GROUP BY tsl.node_id, tsl.delivered_at, sn.type, sn.message_text, sn.image_url,
              sn.map_latitude, sn.map_longitude, sn.response_type, sn.station_id, sn.puzzle_id
     HAVING NOT (sn.response_type = 'buttons' AND COUNT(sno.id) <= 1)
     ORDER BY tsl.delivered_at ASC"
);
$stmt->execute([$team['id']]);


jsonResponse(200, ['success' => true, 'open_tasks' => $stmt->fetchAll()]);
