# Bugfix 2026-09-10: Backend-Feld-Whitelists & discovery_mode-Editor

**Kontext:** Bei der Umsetzung von "discovery_mode im Admin editierbar machen" und
"Story-Node-Antwort schaltet Station frei" wurde festgestellt, dass mehrere
Backend-Endpunkte seit ihrer Einführung in Phase A nie an spätere Schema-Erweiterungen
angepasst wurden. Die betroffenen DB-Spalten und die Team-seitige Logik existierten
bereits korrekt -- nur die Admin-CRUD-Endpunkte kannten die neuen Felder nicht und
haben sie beim Speichern stillschweigend verworfen (kein Fehler, aber auch kein
gespeicherter Wert).

## Gefundene und behobene Lücken

1. **`backend/api/admin/stations.php`**: Feld-Whitelist (POST/PUT) kannte
   `discovery_mode` nicht, obwohl die Spalte seit Migration
   `001_ermittler_chat_phase_a.sql` existiert und `StationsMapScreen.jsx`
   (Team-App) danach filtert. Zusätzlich: `unlock_type`-Validierung akzeptierte
   nur `qr`/`gps`/`manual`, obwohl das Schema seit Phase A auch `auto` erlaubt.
   Beides ergänzt, inkl. Validierung gegen die erlaubten ENUM-Werte.

2. **`backend/api/admin/story-node-options.php`**: Feld-Whitelist (POST/PUT) kannte
   `unlocks_station_id` nicht, obwohl die Spalte seit Migration
   `004_lead_only_station_unlock.sql` existiert und `team/chat/respond.php` sie
   bereits aktiv auswertet (schaltet bei korrekter Chat-Antwort eine
   `discovery_mode='lead_only'`-Station frei). Ergänzt.

3. **`backend/api/admin/story-nodes.php`**: Feld-Whitelist (PUT) und INSERT-Statement
   (POST) kannten `media_type`/`media_url` nicht, obwohl `StoryNodesEditorScreen.jsx`
   diese Felder seit dem 09.09.2026-Bugfix bereits im Payload sendet und die Spalten
   seit Migration `003_ermittler_chat_phase_f.sql` existieren. Ergänzt, inkl.
   Validierung gegen die erlaubten `media_type`-Werte (`none`/`audio_ref`/`video_ref`;
   `image_ref` folgt mit dem separaten Story-Node-Editor-Umbau, siehe offene Punkte in
   `00_Project_Brief_Entscheidungslog_v3.md`).

4. **`frontend/admin-app/src/screens/StationsEditorScreen.jsx`**: Hatte bisher gar
   kein `discovery_mode`-Dropdown (unabhängig vom separaten Naming-Bug
   `'leadonly'`/`'lead_only'`, der bereits zuvor in `StationsMapScreen.jsx` behoben
   wurde). Ergänzt:
   - Dropdown `discovery_mode` mit den drei Schema-Werten (`lead_only`/`proximity`/`both`)
     inkl. Klartext-Erklärung je Option.
   - `unlock_type`-Dropdown um `manual` und `auto` erweitert (bisher nur `qr`/`gps`).
   - Kartenfelder (Breitengrad/Längengrad/Radius) werden jetzt angezeigt, wenn sie
     fachlich gebraucht werden: bei `unlock_type='gps'` (Geofence-Prüfung) ODER
     `discovery_mode` = `proximity`/`both` (Kartenanzeige vor Freischaltung) --
     erster Schritt der von Joe gewünschten bedingten Feld-Anzeige, wird im
     Story-Node-Editor (separater Commit) konsequent fortgeführt.

## Nicht Teil dieses Commits

- Story-Node-Editor: `unlocks_station_id`-Dropdown im Options-Formular,
  Medientyp-Konsolidierung (`image_ref` statt `image_url`), Datei-Upload,
  weitere bedingte Feld-Anzeige. Folgt als separater, in sich abgeschlossener
  Commit (eigenständiges Thema, eigene DB-Migration für `image_ref`).

---

**Erstellt:** 10.09.2026
**Autor:** Joe Miebach (mit Unterstützung durch Perplexity-Assistent)
