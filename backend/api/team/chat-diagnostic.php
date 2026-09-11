<?php
// TEMPORARY: authenticated health check for the team chat API.
// Remove this file after production verification.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

jsonResponse(200, array(
    'success' => true,
    'temporary' => true,
    'stage' => 'authenticated',
    'team_id' => (int)$team['id'],
    'rallye_id' => (int)$team['rallye_id']
));
