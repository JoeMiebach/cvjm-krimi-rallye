<?php
// GET /api/admin/start-codes.php - siehe 04_API_Spezifikation_PHP_v3.md ("Admin-Endpunkte")
// NEU (09.09.2026): Listet alle Startcodes einer Rallye (benutzt und
// unbenutzt), inkl. Teamname bei benutzten Codes. Ersetzt den eigenstaendigen
// StartCodesScreen.jsx -- die Anzeige ist jetzt Teil von TeamsScreen.jsx.
// POST /admin/start-codes/generate.php (Erzeugen neuer Codes) bleibt
// unveraendert bestehen.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$stmt = $pdo->prepare(
    "SELECT sc.id, sc.code, sc.is_used, sc.used_by_team_id, sc.created_at, t.name AS team_name
     FROM start_codes sc
     LEFT JOIN teams t ON t.id = sc.used_by_team_id
     WHERE sc.rallye_id = ?
     ORDER BY sc.created_at DESC"
);
$stmt->execute([$rallyeId]);

jsonResponse(200, ['success' => true, 'start_codes' => $stmt->fetchAll()]);
