<!-- 
  God Mode View: /admin/team/{id}/view
  Zeigt Team-UI + Admin-Overlay
-->
<!DOCTYPE html>
<html>
<head>
  <title>God Mode: Team <?= htmlspecialchars($team['name']) ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Admin-Overlay Styles */
    .admin-overlay {
      position: fixed;
      top: 0; right: 0;
      width: 350px;
      height: 100vh;
      background: #2c3e50;
      color: white;
      padding: 20px;
      overflow-y: auto;
      z-index: 2000;
      box-shadow: -2px 0 10px rgba(0,0,0,0.3);
    }
    
    .admin-overlay h4 {
      margin-top: 0;
      border-bottom: 2px solid #e74c3c;
      padding-bottom: 10px;
    }
    
    .admin-section {
      margin-bottom: 25px;
    }
    
    .admin-section label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .admin-section select,
    .admin-section input,
    .admin-section textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: none;
      border-radius: 4px;
    }
    
    .admin-section button {
      width: 100%;
      padding: 10px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .admin-section button:hover {
      background: #c0392b;
    }
    
    .admin-log {
      background: #34495e;
      padding: 10px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 12px;
      font-family: monospace;
    }
    
    .admin-log p {
      margin: 5px 0;
      border-bottom: 1px solid #4a6278;
      padding-bottom: 5px;
    }
    
    /* Team-UI (wird aus team_view.php inkludiert) */
    .team-content {
      margin-right: 350px; /* Platz für Overlay */
      padding: 20px;
    }
  </style>
</head>
<body>
  <!-- Team-UI (Chat, Stationen, etc.) -->
  <div class="team-content">
    <!-- Hier wird team_view.php inkludiert -->
    <?php include __DIR__ . '/../team/view.php'; ?>
  </div>
  
  <!-- Admin-Overlay -->
  <div class="admin-overlay">
    <h4>God Mode: <?= htmlspecialchars($team['name']) ?></h4>
    
    <!-- Node senden -->
    <div class="admin-section">
      <label>Node senden:</label>
      <select id="node-select">
        <?php foreach ($chatNodes as $node): ?>
        <option value="<?= $node['id'] ?>">
          Node <?= $node['id'] ?>: <?= htmlspecialchars($node['title']) ?>
        </option>
        <?php endforeach; ?>
      </select>
      <button onclick="sendNode()">Node senden</button>
    </div>
    
    <!-- Station freischalten -->
    <div class="admin-section">
      <label>Station freischalten:</label>
      <select id="station-select">
        <?php foreach ($stations as $station): ?>
        <option value="<?= $station['id'] ?>">
          <?= htmlspecialchars($station['id']) ?>: <?= htmlspecialchars($station['title']) ?>
        </option>
        <?php endforeach; ?>
      </select>
      <button onclick="unlockStation()">Freischalten</button>
    </div>
    
    <!-- Hinweis senden -->
    <div class="admin-section">
      <label>Hinweis senden:</label>
      <textarea id="hint-message" rows="3" placeholder="Tipp für das Team..."></textarea>
      <button onclick="sendHint()">Hinweis senden</button>
    </div>
    
    <!-- Aktionen -->
    <div class="admin-section">
      <button onclick="resetTeam()" style="background: #dc3545;">
        Team zurä¹¹cksetzen
      </button>
    </div>
    
    <!-- Admin-Log -->
    <div class="admin-section">
      <label>Aktuelle Session:</label>
      <div id="admin-log" class="admin-log">
        <p><em>Warte auf Aktionen...</em></p>
      </div>
    </div>
    
    <!-- Zurück zur Übersicht -->
    <div class="admin-section">
      <a href="/admin/teams.php" style="color: #3498db;">&larr; Zurück zur Teams-Ü¹11bersicht</a>
    </div>
  </div>
  
  <script>
  const teamId = <?= json_encode($team['id']) ?>;
  
  async function sendNode() {
    const nodeId = document.getElementById('node-select').value;
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/send-node`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({node_id: parseInt(nodeId)})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction(`Node ${nodeId} gesendet: ${result.message}`);
        // Team-UI aktualisieren (Polling oder WebSocket)
        location.reload(); // Einfach: Seite neu laden
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  async function unlockStation() {
    const stationId = document.getElementById('station-select').value;
    
    try {
      const response = await fetch(`/api/admin/team/${teamId}/unlock-station`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_id: stationId})
      });
      const result = await response.json();
      
      if (result.success) {
        logAction(`Station ${stationId} freigeschaltet: ${result.message}`);
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (e) {
      console.error(e);
      alert('Netzwerkfehler');
    }
  }
  
  async function sendHint() {
    const message = document.getElementById('hint-message').value;
    if (!message.trim()) {
      alert('Bitte Hinweis eingeben');
      return;
    }
    
    // TODO: Endpoint /api/admin/team/{id}/send-hint implementieren
    alert('Hinweis gesendet (Endpoint fehlt noch)');
    logAction(`Hinweis gesendet: "${message}"`);
  }
  
  async function resetTeam() {
    if (!confirm('Team wirklich zurä¹¹cksetzen?')) return;
    
    // TODO: Endpoint /api/admin/team/{id}/reset implementieren
    alert('Reset (Endpoint fehlt noch)');
  }
  
  function logAction(message) {
    const logDiv = document.getElementById('admin-log');
    const p = document.createElement('p');
    const time = new Date().toLocaleTimeString();
    p.textContent = `[${time}] ${message}`;
    logDiv.insertBefore(p, logDiv.firstChild);
  }
  
  // Beim Laden: Letztes Admin-Log laden
  async function loadAdminLog() {
    // TODO: Endpoint /api/admin/team/{id}/actions implementieren
  }
  </script>
</body>
</html>
