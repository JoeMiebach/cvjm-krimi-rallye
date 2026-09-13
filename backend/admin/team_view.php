<?php
/**
 * God Mode View: /admin/team_view.php?id={teamId}
 */

require_once __DIR__ . '/../api/bootstrap.php';
requireLogin();

$pdo = getDbConnection();
$teamId = (int)($_GET['id'] ?? 0);
$rallyeId = (int)($_GET['rallye'] ?? 1);

$stmt = $pdo->prepare("
    SELECT t.id, t.name, t.rallye_id, tp.stations_completed, tp.total_points
    FROM teams t
    JOIN team_progress tp ON t.id = tp.team_id
    WHERE t.id = ?
");
$stmt->execute([$teamId]);
$team = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$team) {
    die('Team nicht gefunden');
}

$stmt = $pdo->prepare("
    SELECT id, type, message_text 
    FROM story_nodes 
    WHERE rallye_id = ? AND is_active = 1
    ORDER BY id ASC
");
$stmt->execute([$rallyeId]);
$storyNodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->prepare("
    SELECT id, title 
    FROM stations 
    WHERE rallye_id = ? AND is_active = 1
    ORDER BY id ASC
");
$stmt->execute([$rallyeId]);
$stations = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>God Mode: <?= htmlspecialchars($team['name']) ?></title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background: #f5f6fa; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .overlay { position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: #2c3e50; color: white; padding: 20px; overflow-y: auto; }
        .section { margin-bottom: 20px; }
        select, textarea, button { width: 100%; padding: 10px; margin: 5px 0; border-radius: 5px; border: none; }
        button { background: #e74c3c; color: white; cursor: pointer; }
        button:hover { background: #c0392b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🦾 God Mode: <?= htmlspecialchars($team['name']) ?></h1>
        <p>Stationen: <?= $team['stations_completed'] ?> | Punkte: <?= $team['total_points'] ?></p>
    </div>
    
    <div class="overlay">
        <h2>🦾 Controls</h2>
        
        <div class="section">
            <h3>📤 Node senden</h3>
            <select id="node-select">
                <?php foreach ($storyNodes as $node): ?>
                <option value="<?= $node['id'] ?>">#<?= $node['id'] ?>: <?= htmlspecialchars($node['type']) ?></option>
                <?php endforeach; ?>
            </select>
            <button onclick="sendNode()">Senden</button>
        </div>
        
        <div class="section">
            <h3>🔓 Station freischalten</h3>
            <select id="station-select">
                <?php foreach ($stations as $station): ?>
                <option value="<?= $station['id'] ?>">#<?= $station['id'] ?>: <?= htmlspecialchars($station['title']) ?></option>
                <?php endforeach; ?>
            </select>
            <button onclick="unlockStation()">Freischalten</button>
        </div>
        
        <div class="section">
            <h3>💡 Hinweis</h3>
            <textarea id="hint-message" rows="3" placeholder="Tipp..."></textarea>
            <button onclick="sendHint()">Senden</button>
        </div>
        
        <div class="section">
            <button onclick="resetTeam()" style="background:#dc3545;">⚠️ Reset</button>
        </div>
        
        <a href="/admin/" style="color:#3498db;">← Zurück</a>
    </div>
    
    <script>
    const teamId = <?= json_encode($team['id']) ?>;
    
    async function sendNode() {
        const nodeId = document.getElementById('node-select').value;
        const res = await fetch(`/api/admin/team/${teamId}/send-node`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({node_id: parseInt(nodeId)})
        });
        const result = await res.json();
        alert(result.success ? 'Gesendet!' : result.error);
    }
    
    async function unlockStation() {
        const stationId = document.getElementById('station-select').value;
        const res = await fetch(`/api/admin/team/${teamId}/unlock-station`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({station_id: parseInt(stationId)})
        });
        const result = await res.json();
        alert(result.success ? 'Freigeschaltet!' : result.error);
    }
    
    async function sendHint() {
        const message = document.getElementById('hint-message').value;
        const res = await fetch(`/api/admin/team/${teamId}/send-hint`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message})
        });
        const result = await res.json();
        alert(result.success ? 'Gesendet!' : result.error);
    }
    
    async function resetTeam() {
        if (!confirm('Wirklich resetten?')) return;
        const res = await fetch(`/api/admin/team/${teamId}/reset`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({keep_stations: true})
        });
        const result = await res.json();
        alert(result.success ? 'Reset!' : result.error);
    }
    </script>
</body>
</html>
