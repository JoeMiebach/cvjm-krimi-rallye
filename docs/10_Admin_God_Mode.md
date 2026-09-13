# Admin-Features: Team-Einblick & God Mode

## 1. Team-Fortschritt im Detail

**Zweck:** Admin sieht exakt, wo jedes Team steht – welche Story-Nodes empfangen, welche Antworten gegeben, welche Stationen gelÃ¶st.

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
  "story_log": [
    {"node_id": 1, "delivered_at": "2026-09-13T14:05:00Z", "team_response": "Wikinger", "responded_at": "2026-09-13T14:06:30Z", "is_completed": true},
    {"node_id": 3, "delivered_at": "2026-09-13T14:10:00Z", "team_response": "Marktplatz", "responded_at": "2026-09-13T14:12:00Z", "is_completed": true},
    {"node_id": 5, "delivered_at": "2026-09-13T14:15:00Z", "team_response": null, "responded_at": null, "is_completed": false}
  ],
  "station_unlocks": [
    {"station_id": "A1", "unlocked_at": "2026-09-13T14:07:00Z", "unlocked_by_admin_id": null, "manually_unlocked": 0},
    {"station_id": "B2", "unlocked_at": "2026-09-13T14:13:00Z", "unlocked_by_admin_id": 2, "manually_unlocked": 1}
  ],
  "hints_used": 2,
  "last_active": "2026-09-13T14:16:00Z"
}
```

**UI:**
- Im Admin-Dashboard -> Teams-Tab: Button "Details" pro Team
- Ãffnet Modal/Seite mit:
  - Timeline der Story-Nodes (empfangen -> beantwortet)
  - Liste der freigeschalteten Stationen mit Zeitstempel
  - Heatmap: Wo war das Team unterwegs? (falls GPS getrackt wird)

---

## 2. God Mode: Team-Ansicht simulieren

**Zweck:** Admin sieht exakt die Team-UI (Story-Chat, Stationen-Liste, Buttons) â aber mit zusÃ¤tzlichen Admin-Controls.

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
- Schreibt Eintrag in `team_story_log` (`delivered_at`, `responded_at` = NULL)
- Team-App empfÃ¤ngt Node via Polling/WebSocket

---

## 4. Station manuell freischalten

**Endpoint:**
```
POST /api/admin/team/{id}/unlock-station
{"station_id": "C3"}
```

**Logik:**
- UPSERT in `station_unlocks`:
  ```sql
  INSERT INTO station_unlocks (team_id, station_id, unlocked_at, unlock_source, manually_unlocked)
  VALUES (?, ?, NOW(), 'manual', 1)
  ON DUPLICATE KEY UPDATE unlocked_at = NOW(), unlock_source = 'manual', manually_unlocked = 1
  ```
- Kein GPS/QR-Check nÃ¶tig
- Team kann Station sofort als "gelÃ¶st" markieren

---

## 5. Team zurÃ¼cksetzen (auf Start)

**Endpoint:**
```
POST /api/admin/team/{id}/reset
```

**Logik:**
- `team_story_log`: EintrÃ¤ge lÃ¶schen (oder als archiviert markieren)
- `station_unlocks`: `manually_unlocked = 0` setzen (optional: alle EintrÃ¤ge lÃ¶schen)
- `teams`: `current_latitude`, `current_longitude` = NULL (optional)

---

## 6. Hinweis senden (Push-Nachricht)

**Endpoint:**
```
POST /api/admin/team/{id}/send-hint
{"message": "Tipp: Schau dir die Inschrift genauer an!"}
```

**Verhalten:**
- Team-App zeigt Toast/Banner: "Hinweis vom Admin: ..."
- Eintrag in `team_hints`-Tabelle

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

## Datenbank-ErgÃ¤nzungen (Migration)

```sql
-- 1. Chat-Historie pro Team (ergÃ¤nzend zu team_story_log)
CREATE TABLE IF NOT EXISTS team_chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  node_id INT NOT NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answer TEXT NULL,
  answered_at DATETIME NULL,
  is_correct TINYINT(1) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id),
  INDEX idx_node (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Admin-Aktionen loggen (ergÃ¤nzend zu admin_log)
CREATE TABLE IF NOT EXISTS admin_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  team_id INT NOT NULL,
  action_type ENUM('send_node', 'unlock_station', 'reset_team', 'send_hint', 'unlock_station_no_check') NOT NULL,
  action_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_user_id),
  INDEX idx_team (team_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Team-Hinweise
CREATE TABLE IF NOT EXISTS team_hints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Spalte fÃ¼r manuell freigeschaltete Stationen
ALTER TABLE station_unlocks 
ADD COLUMN IF NOT EXISTS manually_unlocked TINYINT(1) DEFAULT 0 AFTER unlocked_at;

-- 5. God Mode-Flag fÃ¼r Teams (optional)
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_god_mode TINYINT(1) DEFAULT 0 AFTER is_active;
```

---

## SicherheitsÃ¼berlegungen

- God Mode nur fÃ¼r Admin-Rolle (nicht fÃ¼r Viewer)
- Alle Admin-Aktionen loggen (`admin_log` + `admin_actions`)
- Team-App muss Admin-Overlay erkennen und nur im God Mode anzeigen

---

## NÃ¤chste Schritte

1. Migration `04_migration_god_mode.sql` ausfÃ¼hren
2. Endpoint `GET /api/admin/team/{id}/progress` implementieren
3. God Mode-UI als separates Template (`/admin/team/{id}/view`)
4. Admin-Aktionen loggen (`admin_actions`-Tabelle + `admin_log`)
