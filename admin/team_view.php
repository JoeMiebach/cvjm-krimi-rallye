<?php
/**
 * God Mode View: /admin/team_view.php?id={teamId}
 * Zeigt Team-Story-Chat + Admin-Overlay für Eingriffe
 */

require_once __DIR__ . '/../config/bootstrap.php';
requireLogin();

$pdo = getDbConnection();
$teamId = (int)($_GET['id'] ?? 0);
$rallyeId = (int)($_GET['rallye'] ?? 1); // Standard: erste Rallye

// Team-Infos laden
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

// Story-Nodes für Dropdown laden
$stmt = $pdo->prepare("
    SELECT id, type, message_text 
    FROM story_nodes 
    WHERE rallye_id = ? AND is_active = 1
    ORDER BY id ASC
");
$stmt->execute([$rallyeId]);
$storyNodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Stationen für Dropdown laden
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
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f6fa;
      display: flex;
      min-height: 100vh;
    }
    
    /* Team Content (links) */
    .team-content {
      flex: 1;
      padding: 30px;
      margin-right: 400px; /* Platz für Overlay */
    }
    
    .team-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      margin-bottom: 25px;
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    
    .team-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .team-stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
    }
    
    .team-stats div {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 6px;
    }
    
    /* Story Chat Display */
    .story-chat {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .story-chat h2 {
      margin-bottom: 20px;
      color: #333;
    }
    
    .chat-message {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 0 6px 6px 0;
    }
    
    .chat-message strong {
      color: #667eea;
      display: block;
      margin-bottom: 8px;
    }
    
    /* Admin Overlay (rechts) */
    .admin-overlay {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
      color: white;
      padding: 25px;
      overflow-y: auto;
      box-shadow: -5px 0 20px rgba(0,0,0,0.3);
    }
    
    .admin-overlay h2 {
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e74c3c;
      font-size: 22px;
    }
    
    .admin-section {
      margin-bottom: 30px;
    }
    
    .admin-section h3 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #bdc3c7;
    }
    
    .admin-section label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      color: #ecf0f1;
    }
    
    .admin-section select,
    .admin-section input,
    .admin-section textarea {
      width: 100%;
      padding: 10px;
      margin-bottom: 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      background: #34495e;
      color: white;
    }
    
    .admin-section select:focus,
    .admin-section input:focus,
    .admin-section textarea:focus {
      outline: 2px solid #e74c3c;
    }
    
    .admin-section button {
      width: 100%;
      padding: 12px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .admin-section button:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }
    
    .admin-log {
      background: #34495e;
      padding: 12px;
      border-radius: 6px;
      max-height: 250px;
      overflow-y: auto;
      font-size: 12px;
      font-family: 'Courier New', monospace;
    }
    
    .admin-log p {
      margin: 6px 0;
      padding: 6px;
      border-bottom: 1px solid #4a6278;
    }
    
    .admin-log p:first-child {
      color: #f39c12;
      font-weight: bold;
    }
    
    .back-link {
      display: block;
      margin-top: 20px;
      color: #3498db;
      text-decoration: none;
      font-size: 14px;
    }
    
    .back-link:hover {
      text-decoration: underline;
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
      body {
        flex-direction: column;
      }
      
      .team-content {
        margin-right: 0;
        margin-bottom: 400px;
      }
      
      .admin-overlay {
        width: 100%;
        height: auto;
        position: fixed;
        bottom: 0;
        top: auto;
        max-height: 400px;
      }
    }
  </style>
</head>
<body>
  <!-- Team Content (Story Chat) -->
  <div class="team-content">
    <div class="team-header">
      <h1>🦾 God Mode: <?= htmlspecialchars($team['name']) ?></h1>
      <div class="team-stats">
        <div><strong>Stationen:</strong> <?= $team['stations_completed'] ?></div>
        <div><strong>Punkte:</strong> <?= $team['total_points'] ?></div>
        <div><strong>Team ID:</strong> <?= $team['id'] ?></div>
      </div>
    </div>
    
    <div class="story-chat">
      <h2>📖 Story-Chat Verlauf</h2>
      <div id="chat-display">
        <!-- Wird per JS geladen -->
        <p style="color: #999;">Lade Chat-Verlauf...</p>
      </div>
    </div>
  </div>
  
  <!-- Admin Overlay -->
  <div class="admin-overlay">
    <h2>🦾 God Mode Controls</h2>
    
    <!-- Node senden -->
    <div class="admin-section">
      <h3>📤 Story-Node senden</h3>
      <label for="node-select">Node auswählen:</label>
      <select id="node-select">
        <?php foreach ($storyNodes as $node): ?>
        <option value="<?= $node['id'] ?>">
          #<?= $node['id'] ?>: <?= htmlspecialchars($node['type']) ?> - <?= htmlspecialchars(substr($node['message_text'], 0, 50)) ?>...
        </option>
        <?php endforeach; ?>
      </select>
      <button onclick="sendNode()">Node an Team senden</button>
    </div>
    
    <!-- Station freischalten -->
    <div class="admin-section">
      <h3>🔓 Station freischalten</h3>
      <label for="station-select">Station auswählen:</label>
      <select id="station-select">
        <?php foreach ($stations as $station): ?>
        <option value="<?= $station['id'] ?>">
          #<?= $station['id'] ?>: <?= htmlspecialchars($station['title']) ?>
        </option>
        <?php endforeach; ?>
      </select>
      <button onclick="unlockStation()">Station freischalten</button>
    </div>
    
    <!-- Hinweis senden -->
    <div class="admin-section">
      <h3>💡 Hinweis senden</h3>
      <label for="hint-message">Nachricht:</label>
      <textarea id="hint-message" rows="3" placeholder="Tipp für das Team..."></textarea>
      <button onclick="sendHint()">Hinweis senden</button>
    </div>
    
    <!-- Reset -->
    <div class="admin-section">
      <h3>⚠️ Team zurücksetzen</h3>
      <button onclick="resetTeam()" style="background: #e74c3c;">Team auf Start zurücksetzen</button>
    </div>
    
    <!-- Admin Log -->
    <div class="admin-section">
      <h3>📋 Aktionen in dieser Session</h3>
      <div id="admin-log" class="admin-log">
        <p>⏳ Warte auf Aktionen...</p>
      </div>
    </div>
    
    <!-- Zurück -->
    <a href="/admin/teams.php" class="back-link">← Zurück zur Teams-Ü¹11bersicht</a>
  </div>
  
  <script>
  const teamId = <?= json_encode($team['id']) ?>;
  
  // Chat-Verlauf laden
  async function loadChatHistory() {
    try {
      const response = await fetch(`/api/admin/team/${teamId}/progress`);
      const data = await response.json();
      
      const chatDisplay = document.getElementById('chat-display');
      
      if (data.story_log.length === 0) {
        chatDisplay.innerHTML = '<p style="color: #999;">Noch keine Story-Nodes empfangen.</p>';
        return;
      }
      
      chatDisplay.innerHTML = '';
      data.story_log.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'chat-message';
        div.innerHTML = `
          <strong>Node #${entry.node_id} - ${new Date(entry.delivered_at).toLocaleString('de-DE')}</strong>
          <p>${entry.team_response ? 'Antwort: ' + entry.team_response : '⏳ Keine Antwort'}</p>
          <p style="font-size: 12px; color: #666; margin-top: 8px;">
            Status: ${entry.is_completed ? '✅ Abgeschlossen' : '⏳ Offen'} | Versuche: ${entry.attempts || 0}
          </p>
        `;
        chatDisplay.appendChild(div);
      });
      
    } catch (e) {
      console.error(e);
      document.getElementById('chat-display').innerHTML = '<p style="color: #e74c3c;">Fehler beim Laden des Chat-Verlaufs</p>';
    }
  }
  
  // Node senden
  async function sendNode() {
    const nodeId = parseInt(document.getElementById('node-select').value);
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/send-node`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({node_id: nodeId})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction(`Node #${nodeId} gesendet: ${result.message}`);
        location.reload(); // Seite neu laden für Update
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  // Station freischalten
  async function unlockStation() {
    const stationId = parseInt(document.getElementById('station-select').value);
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/unlock-station`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_id: stationId})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction(`Station #${stationId} freigeschaltet: ${result.message}`);
        alert('Station freigeschaltet!');
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  // Hinweis senden
  async function sendHint() {
    const message = document.getElementById('hint-message').value.trim();
    if (!message) {
      alert('Bitte Hinweis eingeben');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/send-hint`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction(`Hinweis gesendet: "${message}"`);
        document.getElementById('hint-message').value = '';
        alert('Hinweis gesendet!');
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  // Team zurücksetzen
  async function resetTeam() {
    if (!confirm('Team wirklich auf Start zurücksetzen?\n\n- Story-Chat wird geleert\n- Stationen bleiben freigeschaltet')) return;
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/reset`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({keep_stations: true, archive_history: false})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction('Team zurückgesetzt');
        alert('Team zurückgesetzt!');
        location.reload();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  // Aktion loggen (lokal)
  function logAction(message) {
    const logDiv = document.getElementById('admin-log');
    const p = document.createElement('p');
    const time = new Date().toLocaleTimeString('de-DE');
    p.textContent = `[${time}] ${message}`;
    logDiv.insertBefore(p, logDiv.firstChild);
  }
  
  // Beim Laden: Chat-Verlauf anzeigen
  loadChatHistory();
  </script>
</body>
</html>
