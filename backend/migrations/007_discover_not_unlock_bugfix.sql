-- Migration 007: Discover != Unlock Bugfix
--
-- KRITISCHER BUGFIX (11.09.2026, 22:58): station_unlocks.unlocked_at hatte
-- DEFAULT current_timestamp(). Wenn respond.php beim "Entdecken" einer
-- Station per Chat ein INSERT ohne unlocked_at-Spalte ausfuehrte, griff
-- MySQL automatisch auf den DEFAULT-Wert zurueck und setzte unlocked_at
-- trotzdem auf NOW() -- die Station wurde dadurch sofort als freigeschaltet
-- markiert, obwohl nur "discovered" gemeint war. Das ist der Grund fuer die
-- kaputten Datensaetze (unlock_source = '') vom Testlauf am 11.09.2026.
--
-- FIX: DEFAULT von unlocked_at entfernt (jetzt NULL, bis ein echter
-- QR-/GPS-/Auto-Unlock explizit stattfindet). unlock_source erlaubt jetzt
-- zusaetzlich NULL (waehrend nur "discovered", noch nicht unlocked) und den
-- neuen Wert 'auto' (fuer Stationen mit unlock_type = 'auto', die sofort
-- bei Entdeckung freigeschaltet werden sollen).

ALTER TABLE station_unlocks
  MODIFY COLUMN unlocked_at datetime DEFAULT NULL,
  MODIFY COLUMN unlock_source enum('qr','gps','manual','auto') DEFAULT NULL;
