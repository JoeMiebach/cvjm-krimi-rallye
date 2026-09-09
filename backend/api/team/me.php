<?php
// GET /api/team/me.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

jsonResponse(200, [
    'success' => true,
    'team' => [
        'id'         => (int)$team['id'],
        'name'       => $team['name'],
        'rallye_id'  => (int)$team['rallye_id'],
        'avatar_url' => $team['avatar_url'],
        'is_active'  => (bool)$team['is_active'],
    ],
]);
