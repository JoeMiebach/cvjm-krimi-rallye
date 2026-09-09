<?php
// GET /api/team/clues.php - NEU (Ermittlungsakte)
// Liefert alle bisher freigeschalteten Story-Hinweise des eingeloggten Teams,
// sortiert nach Freischalt-Zeitpunkt. Ergänzt 04_API_Spezifikation_PHP.md.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();


$stmt = $pdo->prepare(
    "SELECT tsc.story_clue_text, tsc.unlocked_at, p.question AS puzzle_question,
            s.id AS station_id, s.title AS station_title
     FROM team_story_clues tsc
     JOIN puzzles p ON tsc.puzzle_id = p.id
     JOIN stations s ON p.station_id = s.id
     WHERE tsc.team_id = ?
     ORDER BY tsc.unlocked_at ASC"
);
$stmt->execute([$team['id']]);
$rows = $stmt->fetchAll();


$clues = array_map(static function ($row) {
    return [
        'story_clue_text' => $row['story_clue_text'],
        'unlocked_at'     => $row['unlocked_at'],
        'puzzle_question' => $row['puzzle_question'],
        'station_id'      => (int)$row['station_id'],
        'station_title'   => $row['station_title'],
    ];
}, $rows);


jsonResponse(200, ['success' => true, 'clues' => $clues]);
