-- ============================================================================
-- Schnellenbach-Rallye: Komplettes Seed-Skript (11.09.2026)
-- Ziel: Komplette Datenbank leeren und Rallye neu aufsetzen
--
-- ACHTUNG: Dieses Skript loscht ALLE bestehenden Rallye-Daten!
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

-- Auto-Inkremente zuruecksetzen (optional, verhindert ID-Konflikte)
-- ALTER TABLE rallyes AUTO_INCREMENT = 1;
-- ALTER TABLE stations AUTO_INCREMENT = 1;
-- ALTER TABLE puzzles AUTO_INCREMENT = 1;
-- ALTER TABLE suspects AUTO_INCREMENT = 1;
-- ALTER TABLE teams AUTO_INCREMENT = 1;
-- ALTER TABLE start_codes AUTO_INCREMENT = 1;
-- ALTER TABLE story_nodes AUTO_INCREMENT = 1;
-- ALTER TABLE story_node_options AUTO_INCREMENT = 1;

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

INSERT INTO stations (
    id, rallye_id, title, description, story_text, qr_code, latitude, longitude,
    geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active, created_at
) VALUES
    -- Verdacht-Stationen 1-4
    (101, 1, 'Lars Jensen - Hafen', 'Treffpunkt mit Lars Jensen', 'Lars Jensen wirkt nervoes. Er hantiert mit einem Paket.', 'HAFEN1', 51.0350, 7.5200, 40, 'qr', 'leadonly', 1, 100, 1, NOW()),
    (102, 1, 'Maren Koch - Museum', 'Viking-Museum Schnellenbach', 'Maren Koch zeigt euch alte Karten und Dokumente.', 'MUSEUM1', 51.0360, 7.5210, 40, 'qr', 'leadonly', 2, 100, 1, NOW()),
    (103, 1, 'Nils Petersen - Werft', 'Alte Werft', 'Kapitaen Nils Petersen steht an der Werft.', 'WERFT1', 51.0370, 7.5220, 40, 'qr', 'leadonly', 3, 100, 1, NOW()),
    (104, 1, 'Olivia Strand - Leuchtturm', 'Leuchtturm Schnellenbach', 'Fotografin Olivia Strand wartet am Leuchtturm.', 'TURM1', 51.0380, 7.5230, 40, 'qr', 'leadonly', 4, 100, 1, NOW()),

    -- GPS-Stationen
    (151, 1, 'Friedhof Schnellenbach', 'Finde das Grabmal via GPS', 'Auf dem Grabmal steht eine wichtige Inschrift.', NULL, 51.0340, 7.5190, 50, 'gps', 'proximity', 5, 150, 1, NOW()),
    (152, 1, 'Sportplatz auf dem Hoechsten', 'Loese das Raetsel am Sportplatz', 'Die Antwort findest du am Spielfeldrand.', NULL, 51.0345, 7.5195, 50, 'gps', 'proximity', 6, 150, 1, NOW()),

    -- Finale Anklage-Station
    (199, 1, 'Geheimer Treff', 'Hier wird der Schatz versteckt', 'Der wahre Dieb hat den Schatz hier versteckt.', 'SCHATZ1', 51.0390, 7.5240, 40, 'qr', 'leadonly', 7, 500, 0, NOW());

-- ============================================================================
-- TEIL 7: PUZZLES ERSTELLEN
-- ============================================================================

INSERT INTO puzzles (
    id, station_id, type, question, hint, hint_penalty, story_clue_text, media_url, points, time_limit_seconds, max_attempts, order_index, is_active, created_at
) VALUES
    -- Lars Jensen - Hafen
    (1001, 101, 'text', 'Wie heisst der groesste Fisch auf dem Schild am Stand?', 'Achte auf die Farbe des Fisches.', 5, 'Lars war am Hafen...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Maren Koch - Museum
    (1002, 102, 'number', 'In welchem Raum steht das Viking-Schiff? (Raumnummer)', 'Die Nummer ist einstellig.', 5, 'Maren kennt das Museum...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Nils Petersen - Werft
    (1003, 103, 'word_scramble', 'Was hat Zahne, kann aber nicht beissen? (Loesungswort)', 'Es liegt im Badezimmer.', 5, 'Nils pfeift eine Melodie...', NULL, 50, NULL, 3, 1, 1, NOW()),
    -- Olivia Strand - Leuchtturm
    (1004, 104, 'treasure_hunt', 'Fotografiere das Wappen am Eingang', 'Das Wappen ist rund und golden.', 5, 'Olivia hat alles fotografiert...', NULL, 50, NULL, 3, 1, 1, NOW()),

    -- GPS-Friedhof
    (1005, 151, 'number', 'Wie viele Stufen hat das Grabmal?', 'Zaehle sorgfaeltig.', 5, 'Der Friedhof hat viele Stufen...', NULL, 75, NULL, 3, 1, 1, NOW()),
    -- GPS-Sportplatz
    (1006, 152, 'text', 'Welches Jahr steht am Sportplatz?', 'Es ist eine vierstellige Zahl.', 5, 'Der Sportplatz ist alt...', NULL, 75, NULL, 3, 1, 1, NOW()),

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

    -- Lars Jensen -> Hafen (reveals_suspect_id = 1, station_id = 101)
    (3, 1, 'info', 'Ihr trefft Lars Jensen am Hafen. Er wirkt nervoes.', NULL, NULL, 51.0350, 7.5200, 'none', 'none', 101, NULL, 1, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Maren Koch -> Museum (reveals_suspect_id = 2, station_id = 102)
    (4, 1, 'info', 'Maren Koch empfaengt euch im Museum. Sie zeigt euch alte Karten.', NULL, NULL, 51.0360, 7.5210, 'none', 'none', 102, NULL, 2, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nils Petersen -> Werft (reveals_suspect_id = 3, station_id = 103)
    (5, 1, 'info', 'Kapitaen Nils Petersen steht an der Werft. Er pfeift eine alte Melodie.', NULL, NULL, 51.0370, 7.5220, 'none', 'none', 103, NULL, 3, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Olivia Strand -> Leuchtturm (reveals_suspect_id = 4, station_id = 104)
    (6, 1, 'info', 'Fotografin Olivia Strand wartet am Leuchtturm. Ihre Kamera ist voll.', NULL, NULL, 51.0380, 7.5230, 'none', 'none', 104, NULL, 4, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Nach allen vier Besuchen: Hinweis auf finale Anklage
    (7, 1, 'info', 'Ihr habt alle vier Verdachtigen besucht. Jetzt koennt ihr den wahren Dieb anklagen!', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Button-Auswahl: Anklage
    (8, 1, 'accusation', 'Wen beschuldigt ihr, den Schatz gestohlen zu haben?', NULL, NULL, NULL, NULL, 'buttons', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Falsche Anklage
    (9, 1, 'answer', 'Diese Person war es nicht. Sucht weiter!', NULL, NULL, NULL, NULL, 'none', 'none', NULL, NULL, NULL, 0, 0, NULL, 'none', NULL, NULL, 1, NOW()),

    -- Richtige Anklage -> Geheimer Treff (reveals_suspect_id = 5, station_id = 199)
    (10, 1, 'twist', 'Richtig! Der wahre Dieb hat den Schatz am geheimen Treff versteckt. Geht dorthin!', NULL, NULL, 51.0390, 7.5240, 'none', 'none', 199, NULL, 5, 0, 0, NULL, 'none', NULL, NULL, 1, NOW());

-- ============================================================================
-- TEIL 9: STORY-NODE-OPTIONEN (BUTTONS) ERSTELLEN
-- ============================================================================

INSERT INTO story_node_options (id, node_id, label, correct_value, leads_to_node_id, unlocks_station_id, blocks_alternate_node_id, unlocks_suspect_id)
VALUES
    -- Optionen fuer Knoten 2 (4 Verdachtige zur Auswahl)
    (1, 2, 'Lars Jensen (Hafen)', NULL, 3, 101, NULL, 1),
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

-- Zeige alle Stationen
SELECT id, title, unlock_type, geofence_radius_meters FROM stations WHERE rallye_id = 1 ORDER BY id;

-- Zeige alle Verdachtigen
SELECT id, name, is_guilty FROM suspects WHERE rallye_id = 1 ORDER BY id;

-- Zeige alle Story-Knoten
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
-- 1. In /team/chat/respond.php die 4-Verdachtige-Sperre einbauen
-- 2. GPS-Koordinaten an reale Standorte anpassen
-- 3. QR-Codes fuer Stationen 101-104 und 199 generieren
