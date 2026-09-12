-- =====================================================================
-- CVJM Krimi-Stadtrallye: Alle Testdaten loeschen, admins behalten
-- =====================================================================
-- WICHTIG: Dieses Skript loescht ALLE Rallyes und alle damit
-- verknupften Daten (stations, puzzles, teams, suspects, story_nodes,
-- team_story_log, etc.) via ON DELETE CASCADE. Die admins-Tabelle
-- bleibt erhalten -- deine Login-Zugaenge gehen NICHT verloren.
--
-- VORHER UNBEDINGT BACKUP MACHEN (phpMyAdmin -> Exportieren)!
-- =====================================================================

-- Fremdschluessel-Checks temporar deaktivieren (verhindert Probleme
-- bei der Loeschreihenfolge, obwohl CASCADE ohnehin alles regeln sollte)
SET FOREIGN_KEY_CHECKS = 0;

-- Zuerst alle abhaengigen Tabellen manuell leeren, die NICHT direkt an
-- rallyes haengen (z.B. broadcasts, admin_log, photo_submissions), um
-- sicherzugehen, dass keine verwaisten Eintraege uebrig bleiben.
DELETE FROM broadcasts;
DELETE FROM admin_log;
DELETE FROM photo_submissions;
DELETE FROM team_story_clues;
DELETE FROM team_story_log;
DELETE FROM team_attempts;
DELETE FROM station_unlocks;
DELETE FROM start_codes;
DELETE FROM teams;
DELETE FROM puzzles;
DELETE FROM answers;
DELETE FROM stations;
DELETE FROM story_node_options;
DELETE FROM story_nodes;
DELETE FROM suspects;
DELETE FROM team_progress;

-- JETZT alle Rallyes loeschen (cascadiert automatisch zu allen noch
-- verbleibenden abhaengigen Tabellen, falls welche uebersehen wurden)
DELETE FROM rallyes;

-- Fremdschluessel-Checks wieder aktivieren
SET FOREIGN_KEY_CHECKS = 1;

-- Kontrolle: Was ist noch uebrig?
SELECT 'rallyes' AS tabelle, COUNT(*) AS eintraege FROM rallyes
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'stations', COUNT(*) FROM stations
UNION ALL
SELECT 'story_nodes', COUNT(*) FROM story_nodes
UNION ALL
SELECT 'suspects', COUNT(*) FROM suspects
UNION ALL
SELECT 'teams', COUNT(*) FROM teams;

-- =====================================================================
-- NACH DEM CLEAR:
-- 1. QR-Codes pruefen: SELECT qr_code FROM stations; (sollte leer sein)
-- 2. Seed-Skript einspielen: docs/seeds/schnellenbach_testszenario.sql
-- 3. Kontroll-SELECTs am Ende des Seeds ausfuehren
-- =====================================================================