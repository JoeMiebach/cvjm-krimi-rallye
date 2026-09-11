# Technische Spezifikation: Ermittler-Chat-System (Version 1)

**Ergaenzt:** 02_Technische_Spezifikation_PHP_v3.md, 03_Datenbank_Schema_MySQL_MultiRallye_v4.sql, 04_API_Spezifikation_PHP_v3.md
**Stand:** 11.09.2026, 04:18 Uhr
**Status:** Implementiert in Phasen A-F; produktiver Chat nach dem verifizierten Include-Pfad-Fix wieder funktionsfaehig.

## Kernablauf

`story_nodes` beschreiben Chat-Knoten. `team_story_log` speichert die Zustellung und Antworten pro Team. `deliverNode()` legt einen Knoten nur einmal pro Team an; Info-Knoten mit `response_type='none'` kaskadieren automatisch auf ihre Zielknoten.

Antworten werden durch `POST /team/chat/respond.php` verarbeitet. Bei Button-Antworten wird die Options-ID verarbeitet, aber das lesbare Options-Label als `team_response` gespeichert.

## Chat-API und Frontend

`GET /team/chat.php` liefert die Knoten chronologisch. Die Optionsliste wird nur fuer `response_type='buttons'` benoetigt und geliefert. Text-, Zahlen-, Raetsel- und Foto-Knoten verwenden stattdessen ihre jeweilige eigene Eingabeform im `ChatScreen.jsx`.

Der Team-Client nutzt `ChatScreen.jsx` als zentralen Screen. Er stellt Buttons, Text-/Zahlenfelder, Raetsel-Verweise, Foto-Uploads sowie optionale Medien dar. `OpenTasksScreen.jsx` zeigt offene Knoten; `SuspectsScreen.jsx` zeigt den Ermittlungsfortschritt.

## Anklage-Gate

Die finale Anklage darf erst zur betreffenden Station fuehren, wenn ein Team alle vier Verdaechtigen besucht hat. Die Zaehlung basiert auf Verknuepfungen zwischen `suspects.station_id` und den Chat-basierten Eintraegen in `station_unlocks`.

- Unter vier besuchten Verdaechtigen bleibt `unlocked_station_id` leer.
- Ab vier besuchten Verdaechtigen wird die Zielstation wie gewohnt mit `unlock_source='chat'` freigeschaltet.
- `SuspectsScreen.jsx` zeigt den Fortschritt als X/4 an.

Die inhaltliche Story muss sicherstellen, dass alle vier Verdaechtigen im Graphen erreichbar bleiben; das Gate ersetzt keine fehlenden oder blockierten Pfade.

## Produktionshinweise

### Verifizierter 500er-Fix

`backend/api/team/chat.php` und jede weitere Datei direkt in `backend/api/team/` muessen Bootstrap exakt so laden:

```php
require_once __DIR__ . '/../bootstrap.php';
```

Nicht verwenden:

```php
require_once __DIR__ . '/../../bootstrap.php';
```

Der falsche Pfad sucht eine Ebene zu hoch nach `bootstrap.php` und erzeugt auf dem STRATO-Server einen leeren HTTP-500-Response. `backend/api/team/me.php` ist die Referenz fuer den richtigen Pfad.

### Temporare Diagnose

`backend/api/team/chat-diagnostic.php` ist ein voruebergehender, team-authentifizierter Health-Check. Nach erfolgreichem Produktions- und Regressionstest muss die Datei aus dem Repository und vom Hosting entfernt werden.

## Bugfix-Historie

| Datum | Befund | Verifizierte Loesung | Commit |
|---|---|---|---|
| 11.09.2026 | GPS-Diagnose und Karten-/Stationsnavigation | Geofence-Logs, Schnellenbach-Kartenzentrum, zentrale Navigation und Stationssichtbarkeit | `09e48a8` |
| 11.09.2026 | Anklage war nicht an den Ermittlungsfortschritt gebunden | Gate fuer vier besuchte Verdaechtige in `chat/respond.php` | `7e6e3fc` |
| 11.09.2026 | Chat antwortete mit leerem HTTP 500 | Bootstrap-Pfad in `backend/api/team/` von `../../bootstrap.php` auf `../bootstrap.php` korrigiert | `ddf283d` |

**Hinweis zum sichtbaren '00'-Artefakt:** Die genaue Ursache war im Produktionsdebug nicht abschliessend isolierbar. Die Chat-API liefert Optionen jetzt nur bei Button-Knoten; dieser Punkt muss bei einem frischen Teamdurchlauf regression-getestet werden.

---

**Aktualisiert:** 11.09.2026, 04:18 Uhr
**Autor:** Joe Miebach (gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 1.3
