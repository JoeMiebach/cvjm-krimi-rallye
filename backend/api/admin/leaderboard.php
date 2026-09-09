<?php
// GET /api/admin/leaderboard.php?rallye_id= - siehe 04_API_Spezifikation_PHP.md ("Beobachter-Endpunkte")
// GEAENDERT (09.09.2026, 23:05 Uhr): Explizite ORDER BY ergaenzt -- MySQL
// garantiert die ORDER BY einer VIEW nicht zuverlaessig, wenn eine aeussere
// WHERE-Klausel hinzukommt (bekannte Falle). Die leaderboard-VIEW selbst
// sortiert bereits nach total_points DESC, started_at ASC, aber das ist ohne
// eigene ORDER BY hier nicht garantiert.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();


$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}


$stmt = $pdo->prepare(
    "SELECT * FROM leaderboard WHERE rallye_id = ? ORDER BY total_points DESC, started_at ASC"
);
$stmt->execute([$rallyeId]);
jsonResponse(200, ['success' => true, 'leaderboard' => $stmt->fetchAll()]);
