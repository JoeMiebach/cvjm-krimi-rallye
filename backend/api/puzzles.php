<?php
// GET /api/puzzles.php?station_id= - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// HINWEIS: Die einleitenden Zeilen (require bootstrap.php, requireMethods,
// requireTeamAuth) sind hier so rekonstruiert, wie es dem Muster der anderen
// Team-Endpunkte entspricht. Bitte mit dem tatsaechlichen Datei-Anfang
// abgleichen und ggf. anpassen -- der eigentliche fachliche Fix ist der
// markierte Block weiter unten (Multiple-Choice-Optionen).
//
// FIX (11.09.2026, 23:21): Unlock-Pruefung beruecksichtigt jetzt Migration 007
// (unlocked_at kann NULL sein bei nur "entdeckten" Stationen). Ein Team kann
// jetzt nur dann Puzzles sehen, wenn die Station tatsaechlich freigeschaltet
// ist (unlocked_at IS NOT NULL) ODER unlock_type = 'auto' hat.
require_once __DIR__ . '/bootstrap.php';
requireMethods(['GET']);
$team = requireTeamAuth();

$stationId = (int)($_GET['station_id'] ?? 0);
if ($stationId === 0) {
    jsonError(400, 'station_id fehlt');
}

$stationStmt = $pdo->prepare("SELECT * FROM stations WHERE id = ? AND rallye_id = ?");
$stationStmt->execute([$stationId, $team['rallye_id']]);
if (!$stationStmt->fetch()) {
    jsonError(404, 'Station nicht gefunden');
}

// FIX (23:21): Pruefen, ob Station wirklich freigeschaltet ist (nicht nur
// entdeckt). Ein Eintrag in station_unlocks kann existieren, aber unlocked_at
// kann noch NULL sein (nur "entdeckt" via Chat). 'auto'-Stationen sind eine
// Ausnahme -- sie gelten beim Entdecken sofort als freigeschaltet.
$unlockStmt = $pdo->prepare("
    SELECT 1 FROM station_unlocks su
    JOIN stations s ON s.id = su.station_id
    WHERE su.team_id = ? AND su.station_id = ?
      AND (su.unlocked_at IS NOT NULL OR s.unlock_type = 'auto')
");
$unlockStmt->execute([$team['id'], $stationId]);
if (!$unlockStmt->fetch()) {
    jsonError(403, 'Station noch nicht freigeschaltet');
}

$stmt = $pdo->prepare("SELECT * FROM puzzles WHERE station_id = ? AND is_active = 1 ORDER BY order_index");
$stmt->execute([$stationId]);
$puzzles = $stmt->fetchAll();

$result = [];
foreach ($puzzles as $p) {
    $attemptsStmt = $pdo->prepare(
        "SELECT COUNT(*) AS cnt, MAX(is_correct) AS solved FROM team_attempts WHERE team_id = ? AND puzzle_id = ?"
    );
    $attemptsStmt->execute([$team['id'], $p['id']]);
    $agg = $attemptsStmt->fetch();

    $entry = [
        'id' => (int)$p['id'],
        'type' => $p['type'],
        'question' => $p['question'],
        'media_url' => $p['media_url'],
        'points' => (int)$p['points'],
        'time_limit_seconds' => $p['time_limit_seconds'] !== null ? (int)$p['time_limit_seconds'] : null,
        'max_attempts' => (int)$p['max_attempts'],
        'attempts_used' => (int)$agg['cnt'],
        'is_solved' => (bool)$agg['solved'],
    ];

    // NEU: Bei Multiple Choice die Antwortoptionen mitschicken -- OHNE
    // is_correct! Sonst koennte die richtige Antwort im Network-Tab
    // ausgelesen werden. Die eigentliche Pruefung bleibt serverseitig in
    // submit.php. Reihenfolge wird gemischt, damit die richtige Antwort
    // nicht immer an derselben Position steht.
    if ($p['type'] === 'multiple_choice') {
        $optStmt = $pdo->prepare("SELECT answer_text FROM answers WHERE puzzle_id = ? ORDER BY id");
        $optStmt->execute([$p['id']]);
        $options = array_column($optStmt->fetchAll(), 'answer_text');
        shuffle($options);
        $entry['options'] = $options;
    }

    $result[] = $entry;
}

jsonResponse(200, ['success' => true, 'puzzles' => $result]);
