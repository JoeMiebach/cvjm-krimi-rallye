-- Migration 009: Legacy-Ermittlungsakte entfernen (Option A, 13.09.2026)
--
-- Entfernt das alte, parallele Ermittlungsakte-System (team_story_clues +
-- puzzles.story_clue_text), nachdem das Ermittler-Chat-System
-- (story_nodes/team_story_log) als alleiniges Story-System bestaetigt wurde.
--
-- WICHTIG: Vor Ausfuehrung ein Backup der Datenbank anlegen. Bereits
-- gespeicherte Ermittlungshinweise in team_story_clues und
-- puzzles.story_clue_text gehen dabei unwiderruflich verloren.
--
-- Manuell auf STRATO ausfuehren (z.B. via phpMyAdmin oder mysql-CLI),
-- kein automatisierter Migrationsmechanismus vorhanden (Shared Hosting).

DROP TABLE IF EXISTS team_story_clues;

ALTER TABLE puzzles DROP COLUMN story_clue_text;
