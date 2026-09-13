# Admin-Features (Erweiterungen)

## 1. CSV-Export für Teams + Ergebnisse

**Zweck:** Auswertung nach der Rallye, Urkunden, Eltern-Info.

**Endpoint:**
```
GET /api/admin/export/teams.csv
```

**Response (CSV):**
```csv
team_id,name,points,solved_stations,finished_at
1,"Team Viking",45,"A1,B2,C3",2026-09-13 15:30:00
2,"Team Adler",38,"A1,B2",2026-09-13 15:45:00
```

**Umsetzung (PHP):**
```php
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="teams.csv"');

$fp = fopen('php://output', 'w');
fputcsv($fp, ['team_id', 'name', 'points', 'solved_stations', 'finished_at']);

foreach ($teams as $team) {
    fputcsv($fp, $team);
}
```

**UI:**
- Button "CSV exportieren" im Admin-Dashboard -> Teams-Tab

---

## 2. Bulk-Import für Teams (CSV-Upload)

**Zweck:** Schnelles Anlegen von 10-20 Teams vor der Rallye.

**Format:**
```csv
name
Team Viking
Team Adler
Team Löwe
```

**Endpoint:**
```
POST /api/admin/import/teams
Content-Type: multipart/form-data
```

**Validierung:**
- Max. 50 Teams pro Import
- Name: 3-30 Zeichen, keine Sonderzeichen
- Duplikate überspringen + Log

**UI:**
- Datei-Upload-Feld + Vorschau
- "Importieren" -> zeigt Erfolgs-/Fehlerliste

---

## 3. Live-Leaderboard im Admin-Dashboard

**Zweck:** Echtzeit-Ü¹11bersicht wä¹¹hrend der Rallye.

**Features:**
- Auto-Refresh alle 10 Sekunden (WebSocket oder Polling)
- Sortierung nach Punkten -> Zeit
- Filter: "nur aktive Teams", "nur finished"

**Endpoint:**
```
GET /api/admin/leaderboard
```

**Response:**
```json
[
  {"rank": 1, "team_id": 3, "name": "Team Viking", "points": 45, "solved": 5, "last_active": "2026-09-13T15:28:00Z"},
  {"rank": 2, "team_id": 1, "name": "Team Adler", "points": 38, "solved": 4, "last_active": "2026-09-13T15:30:00Z"}
]
```

**UI:**
- Tabelle mit Live-Updates
- Farbcodierung: grün = aktiv, grau = inaktiv >15 min

---

## 4. Rallye pausieren / fortsetzen

**Zweck:** Bei Unwetter, Pause, Notfall.

**Endpoint:**
```
PUT /api/admin/game/{id}/pause
{"paused": true, "reason": "Unwetter"}
```

**Verhalten:**
- Team-App zeigt Banner: "Rallye pausiert - Grund: Unwetter"
- Timer für Stationen stoppen
- Admin kann Grund editieren

**DB:**
```sql
ALTER TABLE game_sessions ADD COLUMN paused TINYINT(1) DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN pause_reason VARCHAR(255) NULL;
```

---

## 5. Cleanup manuell triggern (Fallback ohne Cron)

**Zweck:** Falls Cronjob auf Strato nicht verfügbar ist.

**UI:**
- Button "Veraltete Codes lö11schen" im Admin -> Settings
- Zeigt: "X Codes gelö11scht (letzte Ausführung: vor 5 Min)"

**Endpoint:**
```
POST /api/admin/cleanup-secrets
```

---

## Nä11chste Schritte

1. CSV-Export (einfach, hoher Nutzen)
2. Live-Leaderboard (Polling zuerst, WebSocket optional)
3. Bulk-Import (spart Zeit bei 20+ Teams)
4. Pause-Feature + manueller Cleanup
