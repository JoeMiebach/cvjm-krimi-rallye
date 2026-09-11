-- ============================================================================
-- Test-Rallye-Seed: "Der verschwundene Viking-Schatz"
-- Ziel: Eine vollstaendige, spielbare Test-Rallye mit Story-Chat, Suspects,
--       Stationen, Puzzles, Fotos, Avataren und Anklage-Gate.
--
-- Voraussetzungen:
-- - Datenbank-Schema: Live-Schema (phpMyAdmin Export vom 11.09.2026, 02:29 AM)
-- - Base-URL: https://deine-domain.de/api
--
-- Stand: 11.09.2026, 04:31 Uhr (mit start_codes fuer teams)
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ----------------------------------------------------------------------------
-- 1. Basisdaten: Rallye
-- ----------------------------------------------------------------------------

-- Live-Schema: rallyes(id, name, city, country, description, story_intro, max_teams, time_limit_minutes, game_start_time, game_end_time, paused_at, is_game_running, is_archived, created_at, updated_at)

INSERT INTO rallyes (id, name, city, country, description, story_intro, max_teams, time_limit_minutes, is_game_running, is_archived, created_at)
VALUES (
    1,
    'Der verschwundene Viking-Schatz (Test)',
    'Schnellenbach',
    'Schweden',
    'Test-Rallye fuer das Viking-Schatz-Spiel',
    'Ein Viking-Schatz ist verschwunden. Findet ihn!',
    10,
    120,
    0,
    0,
    NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Start-Codes (benoetigt vor teams wegen FK teams.start_code -> start_codes.code)
-- ----------------------------------------------------------------------------

-- Live-Schema: start_codes(id, rallye_id, code, is_used, used_by_team_id, created_at)

INSERT INTO start_codes (id, rallye_id, code, is_used, used_by_team_id, created_at)
VALUES
    (1, 1, 'ALPHA1', 0, NULL, NOW()),
    (2, 1, 'BETA1',  0, NULL, NOW()),
    (3, 1, 'GAMMA1', 0, NULL, NOW());

-- ----------------------------------------------------------------------------
-- 3. Teams (Live-Schema hat kein password_hash, kein is_admin)
-- ----------------------------------------------------------------------------

-- Live-Schema: teams(id, rallye_id, start_code, name, avatar_url, current_latitude, current_longitude, last_position_update, is_active, registered_at)

INSERT INTO teams (id, rallye_id, start_code, name, avatar_url, is_active, registered_at)
VALUES
    (1, 1, 'ALPHA1', 'Team Alpha', NULL, 1, NOW()),
    (2, 1, 'BETA1',  'Team Beta',  NULL, 1, NOW()),
    (3, 1, 'GAMMA1', 'Team Gamma', NULL, 1, NOW());

-- team_progress initialisieren
INSERT INTO team_progress (team_id, stations_completed, total_points, total_hints_used, last_activity, started_at)
SELECT id AS team_id, 0, 0, 0, NOW(), NOW()
FROM teams
WHERE rallye_id = 1;

-- ----------------------------------------------------------------------------
-- 4. Suspects (Live-Schema: kein role, kein clue, kein station_id)
-- ----------------------------------------------------------------------------

-- Live-Schema: suspects(id, rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text, created_at)

INSERT INTO suspects (id, rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text, created_at)
VALUES
    (1, 1, 'Lars Jensen', NULL, 0, 'Das war ich nicht!', NOW()),
    (2, 1, 'Maren Koch', NULL, 0, 'Ich habe nichts getan!', NOW()),
    (3, 1, 'Nils Petersen', NULL, 0, 'Falscher Verdacht!', NOW()),
    (4, 1, 'Olivia Strand', NULL, 0, 'Ich bin unschuldig!', NOW()),
    (5, 1, 'Der wahre Dieb', NULL, 1, 'Ihr habt mich erwischt!', NOW());

-- ----------------------------------------------------------------------------
-- 5. Stationen (Live-Schema: title, qr_code, unlock_type, order_index, is_active, story_text)
-- ----------------------------------------------------------------------------

-- Live-Schema: stations(id, rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active, created_at)

INSERT INTO stations (
    id, rallye_id, title, description, story_text, qr_code, latitude, longitude,
    geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active, created_at
) VALUES
    -- Verdacht-Stationen 1–4
    (101, 1, 'Hafenmarkt', 'Treffpunkt der Haendler', 'Ihr trefft Lars Jensen am Hafenmarkt. Er wirkt nervoes.', 'HAFEN1', 51.3350, 7.8200, 40, 'qr', 'leadonly', 1, 100, 1, NOW()),
    (102, 1, 'Viking-Museum', 'Ausstellung zur Wikingerzeit', 'Maren Koch empfaengt euch im Museum. Sie zeigt euch alte Karten.', 'MUSEUM1', 51.3360, 7.8210, 40, 'qr', 'leadonly', 2, 100, 1, NOW()),
    (103, 1, 'Alte Werft', 'Historischer Schiffbau', 'Kapitaen Nils Petersen steht an der Werft. Er pfeift eine alte Melodie.', 'WERFT1', 51.3370, 7.8220, 40, 'qr', 'leadonly', 3, 100, 1, NOW()),
    (104, 1, 'Leuchtturm', 'Aussichtspunkt', 'Fotografin Olivia Strand wartet am Leuchtturm. Ihre Kamera ist voll.', 'TURM1', 51.3380, 7.8230, 40, 'qr', 'leadonly', 4, 100, 1, NOW()),

    -- GPS-Stationen (Beispiel)
    (151, 1, 'GPS-Raetselbrunnen', 'Finde den Brunnen via GPS', 'Loese das Raetsel am Brunnen.', NULL, 51.3340, 7.8190, 25, 'gps', 'proximity', 5, 150, 1, NOW()),
    (152, 1, 'GPS-Alte Bruecke', 'Loese das Raetsel auf der Bruecke', 'Suche die Inschrift im Gelaelnder.', NULL, 51.3345, 7.8195, 25, 'gps', 'proximity', 6, 150, 1, NOW()),

    -- Finale Anklage-Station
    (199, 1, 'Geheimer Treff', 'Hier wird der Schatz versteckt', 'Der wahre Dieb hat den Schatz hier versteckt.', 'SCHATZ1', 51.3390, 7.8240, 40, 'qr', 'leadonly', 7, 500, 0, NOW());

-- ----------------------------------------------------------------------------
-- 6. Puzzles zu den Stationen (Live-Schema: order_index, is_active, hint_penalty, story_clue_text)
-- ----------------------------------------------------------------------------

-- Live-Schema: puzzles(id, station_id, type, question, hint, hint_penalty, story_clue_text, media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at)

INSERT INTO puzzles (
    id, station_id, type, question, hint, hint_penalty, story_clue_text, media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at
) VALUES
    -- Hafenmarkt
    (1001, 101, 'text', 'Wie heisst der groesste Fisch auf dem Schild am Stand?', 'Achte auf die Farbe des Fisches.', 5, 'Lars war am Hafen...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Viking-Museum
    (1002, 102, 'number', 'In welchem Raum steht das Viking-Schiff? (Raumnummer)', 'Die Nummer ist einstellig.', 5, 'Maren kennt das Museum...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Alte Werft
    (1003, 103, 'word_scramble', 'Was hat Zahne, kann aber nicht beissen? (Loesungswort)', 'Es liegt im Badezimmer.', 5, 'Nils pfeift eine Melodie...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Leuchtturm
    (1004, 104, 'treasure_hunt', 'Fotografiere das Wappen am Eingang', 'Das Wappen ist rund und golden.', 5, 'Olivia hat alles fotografiert...', NULL, 50, NULL, 3, 1, 1, NOW()),

    -- GPS-Raetselbrunnen
    (1005, 151, 'number', 'Wie viele Stufen hat der Brunnen?', 'Zaehle sorgfaeltig.', 5, 'Der Brunnen hat viele Stufen...', NULL, 75, NULL, 3, 1, 1, NOW()),
    -- GPS-Alte Bruecke
    (1006, 152, 'text', 'Welches Jahr steht im Gelaelnder eingraviert?', 'Es ist eine vierstellige Zahl.', 5, 'Die Bruecke ist alt...', NULL, 75, NULL, 3, 1, 1, NOW()),

    -- Geheimer Treff (Finale)
    (1007, 199, 'text', 'Wer hat den Schatz gestohlen? (Vorname Nachname)', 'Nur wer alle Spuren verfolgt hat, kennt die Antwort.', 5, 'Der wahre Dieb...', NULL, 200, NULL, 3, 1, 1, NOW());

-- ----------------------------------------------------------------------------
-- 7. Story-Chat-Knoten (Live-Schema: type = info/answer/twist/accusation)
-- ----------------------------------------------------------------------------

-- Live-Schema: story_nodes(id, rallye_id, type, message_text, image_url, media_url, map_latitude, map_longitude, response_type, media_type, station_id, puzzle_id, reveals_suspect_id, points, is_root, related_node_id, proactive_trigger, proactive_after_minutes, proactive_after_attempts, is_active, created_at)

INSERT INTO story_nodes (
    id, rallye_id, type, message_text, image_url, media_url, map_latitude, map_longitude, response_type, media_type, station_id, puzzle_id, reveals_suspect_id, points, is_root, related_node_id, proactive_trigger, proactive_after_minutes, proactive_after_attempts, is_active, created_at
) VALUES
    -- Einstieg (is_root = 1)
    (1, 1, 'info', 'Willkommen zur Viking-Schatz-Rallye! Eure Mission: Findet den verschwundenen Schatz.', NULL, NULL, NULL, NULL, 'none', 'none', NULL, NULL, NULL, 0, 1, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Info-Knoten, der auf die Verdacht-Stationen verweist
    (2, 1, 'info', 'Hier sind die ersten vier Verdaechtigen. Besucht ihre Stationen!', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Lars Jensen -> Hafenmarkt
    (3, 1, 'info', 'Ihr trefft Lars Jensen am Hafenmarkt. Er wirkt nervoes.', NULL, NULL, 51.3350, 7.8200, 'none', 'none', 101, NULL, 1, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Maren Koch -> Museum
    (4, 1, 'info', 'Maren Koch empfaengt euch im Museum. Sie zeigt euch alte Karten.', NULL, NULL, 51.3360, 7.8210, 'none', 'none', 102, NULL, 2, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nils Petersen -> Werft
    (5, 1, 'info', 'Kapitaen Nils Petersen steht an der Werft. Er pfeift eine alte Melodie.', NULL, NULL, 51.3370, 7.8220, 'none', 'none', 103, NULL, 3, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Olivia Strand -> Leuchtturm
    (6, 1, 'info', 'Fotografin Olivia Strand wartet am Leuchtturm. Ihre Kamera ist voll.', NULL, NULL, 51.3380, 7.8230, 'none', 'none', 104, NULL, 4, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nach allen vier Besuchen: Hinweis auf finale Anklage
    (7, 1, 'info', 'Ihr habt alle vier Verdaechtigen besucht. Jetzt koennt ihr den wahren Dieb anklagen!', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Button-Auswahl: Anklage
    (8, 1, 'accusation', 'Wen beschuldigt ihr, den Schatz gestohlen zu haben?', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Falsche Anklage
    (9, 1, 'answer', 'Diese Person war es nicht. Sucht weiter!', NULL, NULL, NULL, NULL, 'none', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Richtige Anklage -> Geheimer Treff
    (10, 1, 'twist', 'Richtig! Der wahre Dieb hat den Schatz am geheimen Treff versteckt. Geht dorthin!', NULL, NULL, 51.3390, 7.8240, 'none', 'none', 199, NULL, 5, 0, 0, NULL, 'none', NULL, NULL, 1, NOW());

-- ----------------------------------------------------------------------------
-- 8. Story-Node-Optionen (Buttons) (Live-Schema: kein created_at)
-- ----------------------------------------------------------------------------

-- Live-Schema: story_node_options(id, node_id, label, correct_value, leads_to_node_id, unlocks_station_id, blocks_alternate_node_id, unlocks_suspect_id)

INSERT INTO story_node_options (id, node_id, label, correct_value, leads_to_node_id, unlocks_station_id, blocks_alternate_node_id, unlocks_suspect_id)
VALUES
    -- Optionen fuer Knoten 2 (erster Verdachtiger)
    (1, 2, 'Lars Jensen (Hafenmarkt)', NULL, 3, 101, NULL, 1),
    (2, 2, 'Maren Koch (Museum)', NULL, 4, 102, NULL, 2),
    (3, 2, 'Nils Petersen (Werft)', NULL, 5, 103, NULL, 3),
    (4, 2, 'Olivia Strand (Leuchtturm)', NULL, 6, 104, NULL, 4),

    -- Optionen fuer Knoten 7 (Anklage moeglich)
    (5, 7, 'Jetzt anklagen!', NULL, 8, NULL, NULL, NULL),

    -- Optionen fuer Knoten 8 (Anklage-Auswahl)
    (6, 8, 'Lars Jensen', 'Lars Jensen', 9, NULL, NULL, NULL),
    (7, 8, 'Maren Koch', 'Maren Koch', 9, NULL, NULL, NULL),
    (8, 8, 'Nils Petersen', 'Nils Petersen', 9, NULL, NULL, NULL),
    (9, 8, 'Olivia Strand', 'Olivia Strand', 9, NULL, NULL, NULL),
    (10, 8, 'Der wahre Dieb', 'Der wahre Dieb', 10, NULL, NULL, NULL);

-- ----------------------------------------------------------------------------
-- 9. Initiale Chat-Zustellung an alle Teams
-- ----------------------------------------------------------------------------

-- Einstiegsknoten 1 (is_root) an alle Teams zustellen
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 1 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Info-Knoten 2 (kaskadiert automatisch zu den Verdachtigen)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 2 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- ----------------------------------------------------------------------------
-- 10. Optional: Broadcast-Vorlagen (Live-Schema: title, message_text, created_by_admin_id)
-- ----------------------------------------------------------------------------

-- Live-Schema: broadcast_templates(id, rallye_id, title, message_text, created_by_admin_id, created_at)

INSERT INTO broadcast_templates (id, rallye_id, title, message_text, created_by_admin_id, created_at)
VALUES
    (1, 1, 'Start in 10 Minuten', 'Achtung! Die Rallye startet in 10 Minuten!', 1, NOW()),
    (2, 1, 'Hinweis', 'Achtet auf die gelben Schilder an den Stationen.', 1, NOW()),
    (3, 1, 'Letzte 30 Minuten', 'Letzte 30 Minuten! Gebt alles!', 1, NOW());

COMMIT;

-- ----------------------------------------------------------------------------
-- 11. Hinweise
-- ----------------------------------------------------------------------------

-- Dieses Seed-Skript erstellt eine vollstaendige Test-Rallye.
-- - Die Chat-Knoten 1–2 werden automatisch an alle Teams ausgeliefert.
-- - Nach dem Besuch aller vier Verdachtigen-Stationen (101–104) wird Knoten 7 freigeschaltet.
-- - Die Anklage (Knoten 8) fuehrt nur bei korrekter Antwort zur finalen Station 199.
--
-- Zum Zuruecksetzen:
-- DELETE FROM broadcast_templates WHERE rallye_id = 1;
-- DELETE FROM team_story_log WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
-- DELETE FROM story_node_options WHERE node_id IN (SELECT id FROM story_nodes WHERE rallye_id = 1);
-- DELETE FROM story_nodes WHERE rallye_id = 1;
-- DELETE FROM puzzles WHERE station_id IN (SELECT id FROM stations WHERE rallye_id = 1);
-- DELETE FROM stations WHERE rallye_id = 1;
-- DELETE FROM suspects WHERE rallye_id = 1;
-- DELETE FROM team_progress WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
-- DELETE FROM teams WHERE rallye_id = 1;
-- DELETE FROM start_codes WHERE rallye_id = 1;
-- DELETE FROM rallyes WHERE id = 1;
