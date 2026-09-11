-- ============================================================================
-- Schnellenbach-Rallye: Komplettes Seed-Skript (11.09.2026)
-- Ziel: Komplette Datenbank leeren und Rallye neu aufsetzen
--
-- ACHTUNG: Dieses Skript loscht ALLE bestehenden Rallye-Daten!
--
-- Standorte (real):
-- - Kriegerdenkmal: 51.004009, 7.454024
-- - Kirche: 51.004454, 7.449127
-- - Friedhof: 51.009322, 7.452299
-- - Grundschule: 51.004944, 7.451247
-- - Sportplatz: 51.002658, 7.454649
-- - Dorfgemeinschaftsplatz: 51.010200, 7.455458
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- TEIL 1: ALTE DATEN LOSCHEN (Rallye + alle abhaengigen Tabellen)
-- ============================================================================

-- Hinweis: Fremdschluessel-Loeschreihenfolge beachten

DELETE FROM broadcast_templates WHERE rallye_id = 1;
DELETE FROM team_story_log WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
DELETE FROM story_node_options WHERE node_id IN (SELECT id FROM story_nodes WHERE rallye_id = 1);
DELETE FROM story_nodes WHERE rallye_id = 1;
DELETE FROM puzzles WHERE station_id IN (SELECT id FROM stations WHERE rallye_id = 1);
DELETE FROM station_unlocks WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
DELETE FROM teams WHERE rallye_id = 1;
DELETE FROM suspects WHERE rallye_id = 1;
DELETE FROM stations WHERE rallye_id = 1;
DELETE FROM start_codes WHERE rallye_id = 1;
DELETE FROM rallyes WHERE id = 1;

-- ============================================================================
-- TEIL 2: RALLYE ERSTELLEN
-- ============================================================================

INSERT INTO rallyes (id, name, city, country, description, story_intro, max_teams, time_limit_minutes, is_game_running, is_archived, created_at)
VALUES (
    1,
    'Schnellenbach',
    'Schnellenbach',
    'Deutschland',
    'Krimi-Stadtrallye in Schnellenbach',
    'Ein Schatz ist verschwunden. Findet ihn!',
    20,
    120,
    0,
    0,
    NOW()
);

-- ============================================================================
-- TEIL 3: START-CODES ERSTELLEN (benoetigt VOR teams wegen FK)
-- ============================================================================

INSERT INTO start_codes (id, rallye_id, code, is_used, used_by_team_id, created_at)
VALUES
    (1, 1, 'ALPHA1', 0, NULL, NOW()),
    (2, 1, 'BETA1',  0, NULL, NOW()),
    (3, 1, 'GAMMA1', 0, NULL, NOW()),
    (4, 1, 'DELTA1', 0, NULL, NOW()),
    (5, 1, 'EPSILON1', 0, NULL, NOW());

-- ============================================================================
-- TEIL 4: TEAMS ERSTELLEN
-- ============================================================================

INSERT INTO teams (id, rallye_id, start_code, name, avatar_url, is_active, registered_at)
VALUES
    (1, 1, 'ALPHA1', 'Team Alpha', NULL, 1, NOW()),
    (2, 1, 'BETA1',  'Team Beta',  NULL, 1, NOW()),
    (3, 1, 'GAMMA1', 'Team Gamma', NULL, 1, NOW()),
    (4, 1, 'DELTA1', 'Team Delta', NULL, 1, NOW()),
    (5, 1, 'EPSILON1', 'Team Epsilon', NULL, 1, NOW());

-- team_progress initialisieren
INSERT INTO team_progress (team_id, stations_completed, total_points, total_hints_used, last_activity, started_at)
SELECT id AS team_id, 0, 0, 0, NOW(), NOW()
FROM teams
WHERE rallye_id = 1;

-- ============================================================================
-- TEIL 5: SUSPECTS (VERDAECHTIGE) ERSTELLEN
-- ============================================================================

-- HINWEIS: suspects.station_id existiert im Live-Schema nicht.
-- Die Zuordnung erfolgt ueber story_nodes.reveals_suspect_id + station_id.

INSERT INTO suspects (id, rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text, created_at)
VALUES
    (1, 1, 'Lars Jensen', NULL, 0, 'Das war ich nicht!', NOW()),
    (2, 1, 'Maren Koch', NULL, 0, 'Ich habe nichts getan!', NOW()),
    (3, 1, 'Nils Petersen', NULL, 0, 'Falscher Verdacht!', NOW()),
    (4, 1, 'Olivia Strand', NULL, 0, 'Ich bin unschuldig!', NOW()),
    (5, 1, 'Der wahre Dieb', NULL, 1, 'Ihr habt mich erwischt!', NOW());

-- ============================================================================
-- TEIL 6: STATIONEN ERSTELLEN
-- ============================================================================

-- 4 Verdachtigen-Stationen + 2 GPS-Stationen + 1 finale Anklage-Station
-- Standorte:
-- - Kriegerdenkmal: 51.004009, 7.454024
-- - Kirche: 51.004454, 7.449127
-- - Friedhof: 51.009322, 7.452299
-- - Grundschule: 51.004944, 7.451247
-- - Sportplatz: 51.002658, 7.454649
-- - Dorfgemeinschaftsplatz: 51.010200, 7.455458

INSERT INTO stations (
    id, rallye_id, title, description, story_text, qr_code, latitude, longitude,
    geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active, created_at
) VALUES
    -- Verdacht-Stationen 1-4
    (101, 1, 'Kriegerdenkmal', 'Treffpunkt am Denkmal', 'Lars Jensen wirkt nervoes. Er hantiert mit einem Paket.', 'DENKMAL1', 51.004009, 7.454024, 40, 'qr', 'leadonly', 1, 100, 1, NOW()),
    (102, 1, 'Kirche', 'Kirche Schnellenbach', 'Maren Koch zeigt euch alte Karten und Dokumente.', 'KIRCHE1', 51.004454, 7.449127, 40, 'qr', 'leadonly', 2, 100, 1, NOW()),
    (103, 1, 'Grundschule', 'Grundschule Schnellenbach', 'Nils Petersen steht vor der Schule. Er pfeift eine Melodie.', 'SCHULE1', 51.004944, 7.451247, 40, 'qr', 'leadonly', 3, 100, 1, NOW()),
    (104, 1, 'Dorfgemeinschaftsplatz', 'Dorfgemeinschaftsplatz', 'Fotografin Olivia Strand wartet am Platz. Ihre Kamera ist voll.', 'DORF1', 51.010200, 7.455458, 40, 'qr', 'leadonly', 4, 100, 1, NOW()),

    -- GPS-Stationen
    (151, 1, 'Friedhof Schnellenbach', 'Finde das Grabmal via GPS', 'Auf dem Grabmal steht eine wichtige Inschrift.', NULL, 51.009322, 7.452299, 50, 'gps', 'proximity', 5, 150, 1, NOW()),
    (152, 1, 'Sportplatz auf dem Hoechsten', 'Loese das Raetsel am Sportplatz', 'Die Antwort findest du am Spielfeldrand.', NULL, 51.002658, 7.454649, 50, 'gps', 'proximity', 6, 150, 1, NOW()),

    -- Finale Anklage-Station (nutzt Dorfgemeinschaftsplatz als Treff)
    (199, 1, 'Geheimer Treff', 'Hier wird der Schatz versteckt', 'Der wahre Dieb hat den Schatz hier versteckt.', 'SCHATZ1', 51.010200, 7.455458, 40, 'qr', 'leadonly', 7, 500, 0, NOW());

-- ============================================================================
-- TEIL 7: PUZZLES ERSTELLEN
-- ============================================================================

INSERT INTO puzzles (
    id, station_id, type, question, hint, hint_penalty, story_clue_text, media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at
) VALUES
    -- Kriegerdenkmal (Lars Jensen)
    (1001, 101, 'text', 'Welches Jahr steht auf dem Denkmal?', 'Suche nach der Inschrift.', 5, 'Lars war am Denkmal...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Kirche (Maren Koch)
    (1002, 102, 'number', 'Wie viele Fenster hat die Kirche auf der Vorderseite?', 'Zaehle die Fenster ueber dem Eingang.', 5, 'Maren kennt die Kirche...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Grundschule (Nils Petersen)
    (1003, 103, 'word_scramble', 'Was hat Zahne, kann aber nicht beissen? (Loesungswort)', 'Es liegt im Badezimmer.', 5, 'Nils pfeift eine Melodie...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Dorfgemeinschaftsplatz (Olivia Strand)
    (1004, 104, 'treasure_hunt', 'Fotografiere das Schild am Eingang', 'Das Schild ist rund und blau.', 5, 'Olivia hat alles fotografiert...', NULL, 50, NULL, 3, 1, 1, NOW()),

    -- GPS-Friedhof
    (1005, 151, 'number', 'Wie viele Stufen hat das Grabmal?', 'Zaehle sorgfaeltig.', 5, 'Der Friedhof hat viele Stufen...', NULL, 75, NULL, 3, 1, 1, NOW()),
    -- GPS-Sportplatz
    (1006, 152, 'text', 'Welche Farbe haben die Tore?', 'Es gibt zwei moegliche Antworten.', 5, 'Der Sportplatz ist alt...', NULL, 75, NULL, 3, 1, 1, NOW()),

    -- Geheimer Treff (Finale)
    (1007, 199, 'text', 'Wer hat den Schatz gestohlen? (Vorname Nachname)', 'Nur wer alle Spuren verfolgt hat, kennt die Antwort.', 5, 'Der wahre Dieb...', NULL, 200, NULL, 3, 1, 1, NOW());

-- ============================================================================
-- TEIL 8: STORY-CHAT-KNOTEN ERSTELLEN
-- ============================================================================

-- WICHTIG: reveals_suspect_id + station_id verknuepfen Verdachtige mit Stationen

INSERT INTO story_nodes (
    id, rallye_id, type, message_text, image_url, media_url, map_latitude, map_longitude, response_type, media_type, station_id, puzzle_id, reveals_suspect_id, points, is_root, related_node_id, proactive_trigger, proactive_after_minutes, proactive_after_attempts, is_active, created_at
) VALUES
    -- Einstieg (is_root = 1)
    (1, 1, 'info', 'Willkommen zur Krimi-Rallye in Schnellenbach! Eure Mission: Findet den verschwundenen Schatz.', NULL, NULL, NULL, NULL, 'none', 'none', NULL, NULL, NULL, 0, 1, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Info-Knoten mit Button-Auswahl der 4 Verdachtigen
    (2, 1, 'info', 'Hier sind die vier Verdachtigen. Besucht ihre Stationen!', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Lars Jensen -> Kriegerdenkmal (reveals_suspect_id = 1, station_id = 101)
    (3, 1, 'info', 'Ihr trefft Lars Jensen am Kriegerdenkmal. Er wirkt nervoes.', NULL, NULL, 51.004009, 7.454024, 'none', 'none', 101, NULL, 1, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Maren Koch -> Kirche (reveals_suspect_id = 2, station_id = 102)
    (4, 1, 'info', 'Maren Koch empfaengt euch an der Kirche. Sie zeigt euch alte Karten.', NULL, NULL, 51.004454, 7.449127, 'none', 'none', 102, NULL, 2, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nils Petersen -> Grundschule (reveals_suspect_id = 3, station_id = 103)
    (5, 1, 'info', 'Nils Petersen steht vor der Grundschule. Er pfeift eine alte Melodie.', NULL, NULL, 51.004944, 7.451247, 'none', 'none', 103, NULL, 3, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Olivia Strand -> Dorfgemeinschaftsplatz (reveals_suspect_id = 4, station_id = 104)
    (6, 1, 'info', 'Fotografin Olivia Strand wartet am Dorfgemeinschaftsplatz. Ihre Kamera ist voll.', NULL, NULL, 51.010200, 7.455458, 'none', 'none', 104, NULL, 4, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nach allen vier Besuchen: Hinweis auf finale Anklage
    (7, 1, 'info', 'Ihr habt alle vier Verdachtigen besucht. Jetzt koennt ihr den wahren Dieb anklagen!', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Button-Auswahl: Anklage
    (8, 1, 'accusation', 'Wen beschuldigt ihr, den Schatz gestohlen zu haben?', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Falsche Anklage
    (9, 1, 'answer', 'Diese Person war es nicht. Sucht weiter!', NULL, NULL, NULL, NULL, 'none', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Richtige Anklage -> Geheimer Treff (reveals_suspect_id = 5, station_id = 199)
    (10, 1, 'twist', 'Richtig! Der wahre Dieb hat den Schatz am geheimen Treff versteckt. Geht dorthin!', NULL, NULL, 51.010200, 7.455458, 'none', 'none', 199, NULL, 5, 0, 0, NULL, 'none', NULL, NULL, 1, NOW());

-- ============================================================================
-- TEIL 9: STORY-NODE-OPTIONEN (BUTTONS) ERSTELLEN
-- ============================================================================

INSERT INTO story_node_options (id, node_id, label, correct_value, leads_to_node_id, unlocks_station_id, blocks_alternate_node_id, unlocks_suspect_id)
VALUES
    -- Optionen fuer Knoten 2 (4 Verdachtige zur Auswahl)
    (1, 2, 'Lars Jensen (Kriegerdenkmal)', NULL, 3, 101, NULL, 1),
    (2, 2, 'Maren Koch (Kirche)', NULL, 4, 102, NULL, 2),
    (3, 2, 'Nils Petersen (Grundschule)', NULL, 5, 103, NULL, 3),
    (4, 2, 'Olivia Strand (Dorfgemeinschaftsplatz)', NULL, 6, 104, NULL, 4),

    -- Optionen fuer Knoten 7 (Anklage moeglich)
    (5, 7, 'Jetzt anklagen!', NULL, 8, NULL, NULL, NULL),

    -- Optionen fuer Knoten 8 (Anklage-Auswahl)
    (6, 8, 'Lars Jensen', 'Lars Jensen', 9, NULL, NULL, NULL),
    (7, 8, 'Maren Koch', 'Maren Koch', 9, NULL, NULL, NULL),
    (8, 8, 'Nils Petersen', 'Nils Petersen', 9, NULL, NULL, NULL),
    (9, 8, 'Olivia Strand', 'Olivia Strand', 9, NULL, NULL, NULL),
    (10, 8, 'Der wahre Dieb', 'Der wahre Dieb', 10, NULL, NULL, NULL);

-- ============================================================================
-- TEIL 10: INITIALE CHAT-ZUSTELLUNG AN ALLE TEAMS
-- ============================================================================

-- Einstiegsknoten 1 (is_root) an alle Teams zustellen
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 1 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Info-Knoten 2 (Button-Auswahl der 4 Verdachtigen)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 2 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- ============================================================================
-- TEIL 11: OPTIONAL - BROADCAST-VORLAGEN
-- ============================================================================

INSERT INTO broadcast_templates (id, rallye_id, title, message_text, created_by_admin_id, created_at)
VALUES
    (1, 1, 'Start in 10 Minuten', 'Achtung! Die Rallye startet in 10 Minuten!', 1, NOW()),
    (2, 1, 'Hinweis', 'Achtet auf die gelben Schilder an den Stationen.', 1, NOW()),
    (3, 1, 'Letzte 30 Minuten', 'Letzte 30 Minuten! Gebt alles!', 1, NOW());

COMMIT;

-- ============================================================================
-- TEIL 12: KONTROLL-ABFRAGEN (optional, zum Testen)
-- ============================================================================

-- Zeige alle Stationen mit Koordinaten
SELECT id, title, latitude, longitude, unlock_type FROM stations WHERE rallye_id = 1 ORDER BY id;

-- Zeige alle Verdachtigen
SELECT id, name, is_guilty FROM suspects WHERE rallye_id = 1 ORDER BY id;

-- Zeige alle Story-Knoten mit Zuordnung
SELECT id, type, message_text, station_id, reveals_suspect_id FROM story_nodes WHERE rallye_id = 1 ORDER BY id;

-- Zeige Ermittlungsfortschritt aller Teams
SELECT
    t.id AS team_id,
    t.name AS team_name,
    COUNT(DISTINCT sn.station_id) AS visited_suspects_count,
    CASE
        WHEN COUNT(DISTINCT sn.station_id) >= 4 THEN 'Anklage freigeschaltet'
        ELSE CONCAT('Noch gesperrt (', COUNT(DISTINCT sn.station_id), '/4)')
    END AS accusation_status
FROM teams t
LEFT JOIN station_unlocks su ON su.team_id = t.id AND su.unlock_source = 'chat'
LEFT JOIN story_nodes sn ON sn.station_id = su.station_id AND sn.reveals_suspect_id IS NOT NULL
WHERE t.rallye_id = 1
GROUP BY t.id, t.name
ORDER BY t.id;

-- ============================================================================
-- ENDE DES SKRIPTS
-- ============================================================================

-- Naechste Schritte:
-- 1. QR-Codes fuer Stationen generieren (DENKMAL1, KIRCHE1, SCHULE1, DORF1, SCHATZ1)
-- 2. Anklage-Sperre in /team/chat/respond.php einbauen
-- 3. Testen mit Team Alpha (Startcode: ALPHA1)
