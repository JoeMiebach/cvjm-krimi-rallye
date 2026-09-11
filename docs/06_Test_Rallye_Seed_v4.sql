-- ============================================================================
-- Test-Rallye-Seed: "Der verschwundene Viking-Schatz"
-- Ziel: Eine vollstaendige, spielbare Test-Rallye mit Story-Chat, Suspects,
--       Stationen, Puzzles, Fotos, Avataren und Anklage-Gate.
--
-- Voraussetzungen:
-- - Datenbank-Schema: 03_Datenbank_Schema_MySQL_MultiRallye_v3.sql ist eingespielt
-- - Base-URL: https://deine-domain.de/api
--
-- Stand: 11.09.2026, 04:23 Uhr (angepasst an rallyes-Schema v3)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Basisdaten: Rallye und Teams
-- ----------------------------------------------------------------------------

-- Hinweis: Die Tabelle `rallyes` enthaelt laut Schema v3:
-- id, name, city, country, description, story_intro,
-- max_teams, time_limit_minutes, game_start_time, game_end_time, paused_at,
-- is_game_running, is_archived, created_at, updated_at
-- Es gibt KEINE Spalten: status, discovery_mode

INSERT INTO rallyes (
    id, name, city, country, description, story_intro,
    max_teams, time_limit_minutes,
    game_start_time, game_end_time,
    is_game_running, is_archived, created_at
)
VALUES (
    1,
    'Der verschwundene Viking-Schatz (Test)',
    'Schnellenbach',
    'Deutschland',
    'Test-Rallye fuer die Viking-Schatz-Story mit Chat, Suspects und Anklage-Gate.',
    'Ein vikingerzeitlicher Schatz ist verschwunden. Findet ihn!',
    10,
    120,
    '2026-09-20 14:00:00',
    '2026-09-20 18:00:00',
    0,
    0,
    NOW()
);

-- Test-Teams (Passwoerter im Klartext nur fuer Test; Produktion nutzt Hashes)
-- Hinweis: teams.start_code ist UNIQUE und wird per FK von teams.start_code referenziert.
-- Wir nutzen daher die start_codes-Tabelle nicht direkt, sondern setzen start_code direkt.
-- teams.is_active ersetzt ein fiktives "status"-Feld.

INSERT INTO teams (id, rallye_id, start_code, name, is_active, registered_at)
VALUES
    (1, 1, 'ALPHA1', 'Team Alpha', 1, NOW()),
    (2, 1, 'BETA1',  'Team Beta',  1, NOW()),
    (3, 1, 'GAMMA1', 'Team Gamma', 1, NOW());

-- ----------------------------------------------------------------------------
-- 2. Suspects (Verdaechtige) mit Stationen
-- ----------------------------------------------------------------------------

-- suspects.rallye_id, suspects.station_id sind vorhanden.
-- suspects.is_guilty markiert den Taeter.

INSERT INTO suspects (id, rallye_id, name, role, clue, is_guilty, station_id, created_at)
VALUES
    (1, 1, 'Lars Jensen', 'Fischhaendler', 'War zur Tatzeit am Hafen', 0, 101, NOW()),
    (2, 1, 'Maren Koch', 'Museumsleiterin', 'Kennt alle Geheimnisse des Museums', 0, 102, NOW()),
    (3, 1, 'Nils Petersen', 'Kapitaen', 'Hat nachts das Schiff bewegt', 0, 103, NOW()),
    (4, 1, 'Olivia Strand', 'Fotografin', 'Hat alles fotografiert – auch den Schatz?', 0, 104, NOW()),
    (5, 1, 'Der wahre Dieb', 'Unbekannt', 'Handelt im Verborgenen', 1, 199, NOW());

-- ----------------------------------------------------------------------------
-- 3. Stationen (inklusive GPS-Stationen und Anklage-Station)
-- ----------------------------------------------------------------------------

-- stations Spalten: id, rallye_id, title, description, story_text, qr_code,
-- latitude, longitude, geofence_radius_meters, unlock_type, order_index, points, is_active, created_at

INSERT INTO stations (
    id, rallye_id, title, description, story_text, qr_code,
    latitude, longitude, geofence_radius_meters, unlock_type, order_index, points, is_active, created_at
)
VALUES
    -- Verdacht-Stationen 1–4
    (101, 1, 'Hafenmarkt', 'Treffpunkt der Haendler', 'Hier trefft ihr Lars Jensen.', 'HAFEN1', 51.3350, 7.8200, 40, 'qr', 1, 100, 1, NOW()),
    (102, 1, 'Viking-Museum', 'Ausstellung zur Wikingerzeit', 'Maren Koch zeigt euch alte Karten.', 'MUSEUM1', 51.3360, 7.8210, 40, 'qr', 2, 100, 1, NOW()),
    (103, 1, 'Alte Werft', 'Historischer Schiffbau', 'Kapitaen Nils pfeift eine alte Melodie.', 'WERFT1', 51.3370, 7.8220, 40, 'qr', 3, 100, 1, NOW()),
    (104, 1, 'Leuchtturm', 'Aussichtspunkt', 'Olivia fotografiert alles.', 'TURM1', 51.3380, 7.8230, 40, 'qr', 4, 100, 1, NOW()),

    -- GPS-Stationen (Beispiel)
    (151, 1, 'GPS-Raetselbrunnen', 'Finde den Brunnen via GPS', 'Der Brunnen hat 12 Stufen.', NULL, 51.3340, 7.8190, 25, 'gps', 5, 150, 1, NOW()),
    (152, 1, 'GPS-Alte Bruecke', 'Loese das Raetsel auf der Bruecke', 'Das Jahr 1892 steht im Gelaelnder.', NULL, 51.3345, 7.8195, 25, 'gps', 6, 150, 1, NOW()),

    -- Finale Anklage-Station
    (199, 1, 'Geheimer Treff', 'Hier wird der Schatz versteckt', 'Nur wer alle Spuren verfolgt hat, findet ihn.', 'SCHATZ1', 51.3390, 7.8240, 40, 'qr', 7, 500, 1, NOW());

-- ----------------------------------------------------------------------------
-- 4. Puzzles zu den Stationen
-- ----------------------------------------------------------------------------

-- puzzles Spalten: id, station_id, type, question, hint, hint_penalty, story_clue_text,
-- media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at
-- type: 'multiple_choice','text','image','audio','video','number','sequence','memory','word_scramble','treasure_hunt'

INSERT INTO puzzles (
    id, station_id, type, question, hint, hint_penalty, story_clue_text,
    media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at
)
VALUES
    -- Hafenmarkt
    (1001, 101, 'text', 'Wie heisst der groesste Fisch auf dem Schild am Stand?', 'Achte auf die Farbe des Fisches.', 5, 'Lars war nicht allein am Hafen.', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Viking-Museum
    (1002, 102, 'number', 'In welchem Raum steht das Viking-Schiff? (Raumnummer)', 'Die Nummer ist einstellig.', 5, 'Das Schiff ist der Schluessel.', NULL, 50, NULL, 3, 2, 1, NOW()),
    -- Alte Werft
    (1003, 103, 'treasure_hunt', 'Was hat Zahne, kann aber nicht beissen? (Loesungswort)', 'Es liegt im Badezimmer.', 5, 'Nils hat etwas versteckt.', NULL, 50, NULL, 3, 3, 1, NOW()),
    -- Leuchtturm
    (1004, 104, 'treasure_hunt', 'Fotografiere das Wappen am Eingang', 'Das Wappen ist rund und golden.', 5, 'Olivia hat den Schatz gesehen.', NULL, 50, NULL, 3, 4, 1, NOW()),

    -- GPS-Raetselbrunnen
    (1005, 151, 'number', 'Wie viele Stufen hat der Brunnen?', 'Zaehle sorgfaeltig.', 5, 'Der Brunnen zeigt den Weg.', NULL, 75, NULL, 3, 5, 1, NOW()),
    -- GPS-Alte Bruecke
    (1006, 152, 'text', 'Welches Jahr steht im Gelaelnder eingraviert?', 'Es ist eine vierstellige Zahl.', 5, 'Die Bruecke verbindet Alt und Neu.', NULL, 75, NULL, 3, 6, 1, NOW()),

    -- Geheimer Treff (Finale)
    (1007, 199, 'text', 'Wer hat den Schatz gestohlen? (Vorname Nachname)', 'Nur wer alle Spuren verfolgt hat, kennt die Antwort.', 5, 'Der wahre Dieb handelt im Verborgenen.', NULL, 200, NULL, 3, 7, 1, NOW());

-- ----------------------------------------------------------------------------
-- 5. Story-Chat-Knoten (Ermittler-Chat mit Anklage-Gate)
-- ----------------------------------------------------------------------------

-- story_nodes Spalten: id, rallye_id, type, message_text, image_url, media_type, media_url,
-- map_latitude, map_longitude, response_type, station_id, puzzle_id, points, created_at

INSERT INTO story_nodes (
    id, rallye_id, type, message_text, image_url, media_type, media_url,
    map_latitude, map_longitude, response_type, station_id, puzzle_id, points, created_at
) VALUES
    -- Einstieg
    (1, 1, 'story', 'Willkommen zur Viking-Schatz-Rallye! Eure Mission: Findet den verschwundenen Schatz.', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Info-Knoten, der auf die Verdacht-Stationen verweist (kaskadiert automatisch)
    (2, 1, 'info', 'Hier sind die ersten vier Verdaechtigen. Besucht ihre Stationen!', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Button-Auswahl: Erster Verdachtiger
    (3, 1, 'story', 'Wen wollt ihr zuerst befragen?', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Optionen zu Knoten 3 werden separat eingefuegt (story_node_options)

    -- Lars Jensen -> Hafenmarkt
    (4, 1, 'story', 'Ihr trefft Lars Jensen am Hafenmarkt. Er wirkt nervoes.', NULL, 'none', NULL, 51.3350, 7.8200, 'none', 101, NULL, 0, NOW()),

    -- Maren Koch -> Museum
    (5, 1, 'story', 'Maren Koch empfaengt euch im Museum. Sie zeigt euch alte Karten.', NULL, 'none', NULL, 51.3360, 7.8210, 'none', 102, NULL, 0, NOW()),

    -- Nils Petersen -> Werft
    (6, 1, 'story', 'Kapitaen Nils Petersen steht an der Werft. Er pfeift eine alte Melodie.', NULL, 'none', NULL, 51.3370, 7.8220, 'none', 103, NULL, 0, NOW()),

    -- Olivia Strand -> Leuchtturm
    (7, 1, 'story', 'Fotografin Olivia Strand wartet am Leuchtturm. Ihre Kamera ist voll.', NULL, 'none', NULL, 51.3380, 7.8230, 'none', 104, NULL, 0, NOW()),

    -- Nach allen vier Besuchen: Hinweis auf finale Anklage
    (8, 1, 'story', 'Ihr habt alle vier Verdaechtigen besucht. Jetzt koennt ihr den wahren Dieb anklagen!', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Button-Auswahl: Anklage
    (9, 1, 'story', 'Wen beschuldigt ihr, den Schatz gestohlen zu haben?', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Optionen zu Knoten 9 werden separat eingefuegt

    -- Falsche Anklage
    (10, 1, 'story', 'Diese Person war es nicht. Sucht weiter!', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Richtige Anklage -> Geheimer Treff
    (11, 1, 'story', 'Richtig! Der wahre Dieb hat den Schatz am geheimen Treff versteckt. Geht dorthin!', NULL, 'none', NULL, 51.3390, 7.8240, 'none', 199, NULL, 0, NOW());

-- ----------------------------------------------------------------------------
-- 6. Story-Node-Optionen (Buttons)
-- ----------------------------------------------------------------------------

-- story_node_options Spalten: id, node_id, label, target_node_id, created_at

INSERT INTO story_node_options (id, node_id, label, target_node_id, created_at)
VALUES
    -- Optionen fuer Knoten 3 (erster Verdachtiger)
    (1, 3, 'Lars Jensen (Hafenmarkt)', 4, NOW()),
    (2, 3, 'Maren Koch (Museum)', 5, NOW()),
    (3, 3, 'Nils Petersen (Werft)', 6, NOW()),
    (4, 3, 'Olivia Strand (Leuchtturm)', 7, NOW()),

    -- Optionen fuer Knoten 8 (Anklage moeglich)
    (5, 8, 'Jetzt anklagen!', 9, NOW()),

    -- Optionen fuer Knoten 9 (Anklage-Auswahl)
    (6, 9, 'Lars Jensen', 10, NOW()),
    (7, 9, 'Maren Koch', 10, NOW()),
    (8, 9, 'Nils Petersen', 10, NOW()),
    (9, 9, 'Olivia Strand', 10, NOW()),
    (10, 9, 'Der wahre Dieb', 11, NOW());

-- ----------------------------------------------------------------------------
-- 7. Initiale Chat-Zustellung an alle Teams
-- ----------------------------------------------------------------------------

-- Einstiegsknoten 1 an alle Teams zustellen
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 1 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Info-Knoten 2 (kaskadiert automatisch zu Knoten 3)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 2 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Button-Knoten 3 (Auswahl erster Verdachtiger)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 3 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- ----------------------------------------------------------------------------
-- 8. Optional: Broadcast-Vorlagen
-- ----------------------------------------------------------------------------

-- broadcasts Spalten: id, rallye_id, message_text, sent_by_admin_id, target_team_ids, sent_at, is_active

INSERT INTO broadcasts (id, rallye_id, message_text, sent_by_admin_id, target_team_ids, sent_at, is_active)
VALUES
    (1, 1, 'Achtung! Die Rallye startet in 10 Minuten!', NULL, NULL, NOW(), 1),
    (2, 1, 'Hinweis: Achtet auf die gelben Schilder an den Stationen.', NULL, NULL, NOW(), 1),
    (3, 1, 'Letzte 30 Minuten! Gebt alles!', NULL, NULL, NOW(), 1);

-- ----------------------------------------------------------------------------
-- 9. Hinweise
-- ----------------------------------------------------------------------------

-- Dieses Seed-Skript erstellt eine vollstaendige Test-Rallye.
-- - Die Chat-Knoten 1–3 werden automatisch an alle Teams ausgeliefert.
-- - Nach dem Besuch aller vier Verdachtigen-Stationen (101–104) wird Knoten 8 freigeschaltet.
-- - Die Anklage (Knoten 9) fuehrt nur bei korrekter Antwort zur finalen Station 199.
-- - Die Pruefung "4 Verdachtige besucht" erfolgt in /team/chat/respond.php.
--
-- Zum Zuruecksetzen:
-- DELETE FROM broadcasts WHERE rallye_id = 1;
-- DELETE FROM team_story_log WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
-- DELETE FROM story_node_options WHERE node_id IN (SELECT id FROM story_nodes WHERE rallye_id = 1);
-- DELETE FROM story_nodes WHERE rallye_id = 1;
-- DELETE FROM puzzles WHERE station_id IN (SELECT id FROM stations WHERE rallye_id = 1);
-- DELETE FROM stations WHERE rallye_id = 1;
-- DELETE FROM suspects WHERE rallye_id = 1;
-- DELETE FROM teams WHERE rallye_id = 1;
-- DELETE FROM rallyes WHERE id = 1;

SET FOREIGN_KEY_CHECKS = 1;
