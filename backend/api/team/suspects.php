<?php
// GET /api/team/suspects.php - siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md
// NEU (Phase C, Ermittler-Chat-System): Liefert alle Verdaechtigen, die dem Team
// bereits bekannt sind -- entweder weil ein Story-Knoten sie direkt offenbart hat
// (sn.reveals_suspect_id, z.B. ein Info-Knoten "Du erfaehrst von Verdaechtigem X")
// oder weil das Team eine Antwortoption gewaehlt hat, die sie freischaltet
// (sno.unlocks_suspect_id, z.B. ein Verzweigungspfad). is_guilty und
// wrong_pick_reaction_text werden bewusst NICHT zurueckgegeben -- das waere ein
// Spoiler fuer die finale Anklage.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$stmt = $pdo->prepare(
    "SELECT DISTINCT s.id, s.name, s.portrait_icon
     FROM suspects s
     WHERE s.rallye_id = ?
       AND (
         s.id IN (
           SELECT sn.reveals_suspect_id FROM story_nodes sn
           JOIN team_story_log tsl ON tsl.node_id = sn.id
           WHERE tsl.team_id = ? AND sn.reveals_suspect_id IS NOT NULL
         )
         OR s.id IN (
           SELECT sno.unlocks_suspect_id FROM story_node_options sno
           JOIN team_story_log tsl ON tsl.node_id = sno.node_id
           WHERE tsl.team_id = ? AND sno.unlocks_suspect_id IS NOT NULL
             AND tsl.team_response = sno.id
         )
       )
     ORDER BY s.id"
);
$stmt->execute([(int)$team['rallye_id'], (int)$team['id'], (int)$team['id']]);

jsonResponse(200, ['success' => true, 'suspects' => $stmt->fetchAll()]);
