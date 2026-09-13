# Admin-Features: Team-Einblick & God Mode

## 1. Team-Fortschritt im Detail

**Zweck:** Admin sieht exakt, wo jedes Team steht – welche Chat-Nodes empfangen, welche Antworten gegeben, welche Stationen gelÃ¶st.

**Endpoint:**
```
GET /api/admin/team/{id}/progress
```

**Response:**
```json
{
  "team_id": 3,
  "name": "Team Viking",
  "current_node_id": 5,
  "game_session_id": 12,
  "chat_history": [
    {"node_id": 1, "received_at": "2026-09-13T14:05:00Z", "answer": "Wikinger", "answered_at": "2026-09-13T14:06:30Z", "correct": true},
    {"node_id": 3, "received_at": "2026-09-13T14:10:00Z", "answer": "Marktplatz", "answered_at": "2026-09-13T14:12:00Z", "correct": true},
    {"node_id": 5, "received_at": "2026-09-13T14:15:00Z", "answer": null, "answered_at": null, "correct": null}
  ],
  "solved_stations": [
    {"station_id": "A1", "solved_at": "2026-09-13T14:07:00Z", "code": "VIKING123"},
    {"station_id": "B2", "solved_at": "2026-09-13T14:13:00Z", "code": "MARKT456"}
  ],
  "hints_used": 2,
  "last_active": "2026-09-13T14:16:00Z"
}
```

**UI:**
- Im Admin-Dashboard -> Teams-Tab: Button "Details" pro Team
- Ãffnet Modal/Seite mit:
  - Timeline der Chat-Nodes (empfangen -> beantwortet)
  - Liste der gelÃ¶sten Stationen mit Zeitstempel
  - Heatmap: Wo war das Team unterwegs? (falls GPS getrackt wird)

---

## 2. God Mode: Team-Ansicht simulieren

**Zweck:** Admin sieht exakt die Team-UI (Chat, Stationen-Liste, Buttons) â aber mit zusÃ¤tzlichen Admin-Controls.

**Endpoint:**
```
GET /api/admin/team/{id}/view
```

**Verhalten:**
- Rendert dieselbe HTML/JS wie `/team/{session_id}`
- ZusÃ¤tzliche Admin-Overlay:
  - "Node senden"-Button (wÃ¤hle Node aus Dropdown)
  - "Station freischalten"-Button (ohne GPS/QR-Check)
  - "Hinweis senden"-Button
  - "Team zurÃ¼cksetzen"-Button (auf Node 1)

**UI-Beispiel (Overlay):**
```html
<div class="admin-overlay">
  <h4>God Mode: Team Viking</h4>
  <select id="node-select">
    <option value="2">Node 2: "Der alte Hafen"</option>
    <option value="4">Node 4: "Die verschlÃ¼sselte Karte"</option>
  </select>
  <button onclick="sendNode(2)">Node senden</button>
  
  <select id="station-select">
    <option value="A1">Station A1: Marktplatz</option>
    <option value="C3">Station C3: Friedhof</option>
  </select>
  <button onclick="unlockStation('A1')">Station freischalten</button>
  
  <button onclick="resetTeam()">Team zurÃ¼cksetzen</button>
</div>
```

---

## 3. Node manuell senden

**Endpoint:**
```
POST /api/admin/team/{id}/send-node
{"node_id": 5}
```

**Logik:**
- Ãberspringt alle Checks (kein GPS, kein QR, keine Reihenfolge)
- Schreibt Eintrag in `chat_history`
- Team-App empfÃ¤ngt Node via Polling/WebSocket

---

## 4. Station manuell freischalten

**Endpoint:**
```
POST /api/admin/team/{id}/unlock-station
{"station_id": "C3"}
```

**Logik:**
- Setzt `is_unlocked = 1` in `team_stations`
- Kein GPS/QR-Check nÃ¶tig
- Team kann Station sofort als "gelÃ¶st" markieren

---

## 5. Team zurÃ¼cksetzen (auf Start)

**Endpoint:**
```
POST /api/admin/team/{id}/reset
```

**Logik:**
- Setzt `current_node_id = 1`
- LÃ¶scht `chat_history` (oder markiert als archiviert)
- BehÃ¤lt `solved_stations` (optional: auch lÃ¶schbar)

---

## 6. Hinweis senden (Push-Nachricht)

**Endpoint:**
```
POST /api/admin/team/{id}/send-hint
{"message": "Tipp: Schau dir die Inschrift genauer an!"}
```

**Verhalten:**
- Team-App zeigt Toast/Banner: "Hinweis vom Admin: ..."
- Optional: Als nÃ¤chster Chat-Node einfÃ¼gen (Typ `hint`)

---

## 7. Live-Tracking (optional, GPS)

**Voraussetzung:** Team-App sendet alle 30s GPS-Position (nur wÃ¤hrend aktiver Session).

**Endpoint:**
```
GET /api/admin/team/{id}/location
```

**Response:**
```json
{
  "lat": 51.1234,
  "lng": 7.5678,
  "timestamp": "2026-09-13T14:20:00Z",
  "accuracy": 10
}
```

**UI:**
- Karte im Admin-Dashboard (Leaflet.js oder Google Maps)
- Zeigt:
  - Aktuelle Position aller Teams (farbcodiert)
  - Verlaufslinie (letzten 15 Min)

**Datenschutz:**
- GPS nur wÃ¤hrend Rallye
- Nach Rallye automatisch lÃ¶schen (Cleanup-Job)

---

## Datenbank-ErgÃ¤nzungen

```sql
-- Chat-Historie pro Team
CREATE TABLE team_chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  node_id INT NOT NULL,
  received_at DATETIME NOT NULL,
  answer TEXT NULL,
  answered_at DATETIME NULL,
  is_correct TINYINT(1) NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (node_id) REFERENCES chat_nodes(id)
);

-- Admin-Aktionen loggen (wer hat was gemacht?)
CREATE TABLE admin_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  team_id INT NOT NULL,
  action_type ENUM('send_node', 'unlock_station', 'reset_team', 'send_hint') NOT NULL,
  action_data JSON NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

---

## SicherheitsÃ¼berlegungen

- God Mode nur fÃ¼r Admin-Rolle (nicht fÃ¼r Moderator)
- Alle Admin-Aktionen loggen (`admin_actions`-Tabelle)
- Team-App muss Admin-Overlay erkennen und nur im God Mode anzeigen

---

## NÃ¤chste Schritte

1. `team_chat_history`-Tabelle anlegen (Migration)
2. Endpoint `GET /api/admin/team/{id}/progress` implementieren
3. God Mode-UI als separates Template (`/admin/team/{id}/view`)
4. Admin-Aktionen loggen (`admin_actions`-Tabelle)
