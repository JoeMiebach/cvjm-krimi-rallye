# Bugfix 2026-09-10 (Commit 2): Story-Node-Editor Upload + unlocks_station_id

**Kontext:** Nach Commit 1 folgt der zweite Teil: Story-Node-Editor um Bild-Upload (image_ref), unlocks_station_id-Dropdown und bedingte Feld-Anzeige erweitern.

## Aenderungen

1. `backend/migrations/005_story_image_ref.sql` (bereits in Commit 2a gepusht): media_library-Tabelle, image_ref-Spalte, media_type-Enum erweitert
2. `backend/api/admin/media/upload.php` (bereits in Commit 2a gepusht): Upload-Endpoint
3. `frontend/admin-app/src/api/client.js` (bereits in Commit 2a gepusht): uploadStoryMedia()
4. `backend/api/admin/story-nodes.php`: image_ref in INSERT/UPDATE, media_type-Validierung erweitert
5. `frontend/admin-app/src/screens/StoryNodesEditorScreen.jsx`: image_ref-Upload statt image_url, unlocks_station_id-Dropdown, bedingte Feld-Anzeige
6. `backend/api/admin/story-node-options.php`: unlocks_station_id in PUT-Feldliste nachgetragen

---
**Erstellt:** 10.09.2026
**Autor:** Joe Miebach (mit Unterstuetzung durch Perplexity-Assistent)
