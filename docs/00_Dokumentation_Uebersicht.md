# Dokumentations-Ü°bersicht — Viking-Schatz Rallye

**Stand:** 12.09.2026
**Autor:** Joe Miebach / Perplexity (konsolidiert)
**Geltungsbereich:** Vollstã°¤ndige technische und konzeptionelle Dokumentation der Krimi-Stadtrallye-Webapp „Der verschwundene Viking-Schatz" für den CVJM Ründeroths.

---

## Dateien und Inhalt

| Datei | Umfang | Hauptinhalt |
|---|---|---|
| **01_Konzept.md** | ~6,4 KB | Story-Rahmen, Ermittler-Chat, Knotentypen, Antworttypen, Discovery-Modi, Twist-Mechanik, Verdä°¤chtige, Foto-Einreichung, Rollen, Wiederverwendbarkeit |
| **02_Technische_Spezifikation.md** | ~11,4 KB | Systemarchitektur, Auth, Polling, Geofencing, Spielsteuerung, Lazy Cleanup, Sicherheitskonzept, Deployment, bekannte Prüfpunkte |
| **03_Datenbank.md** | ~16,0 KB | Vollstä°¤ndiges MySQL-Schema (20 Tabellen + 1 VIEW), rekonstruiert aus Live-Datenbank-Export, inkl. Trigger, Foreign Keys, Indizes |
| **04_Team_App.md** | ~12,0 KB | Vollstä°¤ndige Team-App-Referenz: Routing, API-Client, Contexts, Components, Screens, Offline-Queue |
| **05_Admin_App.md** | ~12,5 KB | Vollstä°¤ndige Admin-App-Referenz: Routing, API-Client, Contexts, alle 12 Screens inkl. CRUD-Editoren |
| **06_Backend.md** | ~20,6 KB | Backend-Ordnerstruktur, alle Lib-Funktionen mit Signaturen, alle Endpunkte mit Request/Response-Beispielen |
| **06_Backend_Ergaenzung.md** | ~6,1 KB | Vollstä°¤ndig verifizierte Endpunkte (Avatar-Upload, Foto-Upload, System-Cleanup) und Admin-Screens (Teams, Suspects) |
| **00_Dokumentation_Uebersicht.md** | ~3,5 KB | Diese Datei — Navigation und Status-Ü°bersicht |

**Gesamtumfang:** ~88 KB reine Dokumentation (ohne Code-Exporte).

---

## Entstehung und Quellen

Diese Dokumentation wurde erstellt durch:

1. **Abgleich der ursprünglichen Projektdokumente** (`00_Project_Brief_Entscheidungslog_v3.md` bis `05_Technische_Spezifikation_Ermittler_Chat_v1.md`)
2. **Vollstä°¤ndige Code-Exports** (`code_backend.txt`, `code_teamapp_clean-2.txt`, `code_adminapp_clean.txt`)
3. **Gezielter Nach-Export** (`code_missing_files.txt`) für 5 zuvor fehlende Dateien
4. **GitHub-Abgleich** (`JoeMiebach/cvjm-krimi-rallye`) zur Verifikation von Pfaden und Existenz aller Dateien

**Ersetzt:** Die ursprünglichen sechs Projektdokumente (`00_...` bis `05_...`) können durch diese konsolidierte Fassung ersetzt werden.

---

## Bekannte, bewusst dokumentierte Punkte

Diese Punkte sind **keine Fehler**, sondern bewusst so implementiert und dokumentiert:

| Thema | Status | Dokumentation |
|---|---|---|
| Zwei parallele Ermittlungsakte-Systeme (`team_story_clues` + `team_story_log`) | Gewollt, Migration noch nicht abgeschlossen | 02_Technische_Spezifikation.md, Abschnitt 10 |
| `archiveRallye()` sendet `{ id }`, Backend erwartet `{ rallye_id }` | Prüfhinweis, vor Produktivnutzung testen | 05_Admin_App.md, Abschnitt 3; 02_Technische_Spezifikation.md, Abschnitt 10 |
| `PuzzlesScreen.jsx` verlinkt auf `/ermittlungsakte` (existiert nicht mehr) | Bekannter UX-Fehler, sollte auf `/chat` umgestellt werden | 04_Team_App.md, Abschnitt 8 |
| Offline-Queue deckt nur Chat/Foto, nicht klassische Rätsel | Bekannte Lã°¼cke, Erweiterung möglich | 04_Team_App.md, Abschnitt 8 |
| `media_library`-Tabelle im DB-Export nicht gefunden, aber von Backend referenziert | Prüfhinweis, vor Produktivnutzung verifizieren | 03_Datenbank.md, Abschnitt 3 |

---

## Deployment-Checkliste (Auszug)

Vor dem ersten echten Einsatz mit Jugendlichen:

- [ ] `.env`-Dateien für beide Frontends prüfen (`VITE_API_BASE_URL`)
- [ ] `backend/api/config.local.php` mit korrekten DB-Zugangsdaten anlegen
- [ ] `cleanup_secret` in `config.local.php` setzen und im Team bekannt geben
- [ ] `.htaccess`-Rewrite-Regeln für beide Frontends prüfen (SPA-Routing)
- [ ] `media_library`-Tabelle in der Datenbank anlegen (falls nicht vorhanden)
- [ ] `archiveRallye()`-Feldnamen-Mismatch testen (Client vs. Backend)
- [ ] Datenschutzerklä°¤rung und Einwilligungen mit dem CVJM Ründeroths abstimmen
- [ ] Testlauf mit 2–3 Teams in der Zielstadt durchführen

---

## Wiederverwendung für kã°¼nftige Rallyes

Um eine neue Rallye (neue Stadt, neues Thema) anzulegen:

1. **Admin-Bereich:** Neue Rallye anlegen (Name, Stadt, Zeitlimit)
2. **Stationen:** Mindestens 6–10 Stationen mit GPS/QR/manueller Freischaltung anlegen
3. **Rä°¤tsel:** Pro Station 2–4 Rätsel anlegen (Typ, Frage, Antworten, Punkte)
4. **Story:** Chat-Knoten (Intro, Fragen, Twists, Verdä°¤chtige, Finale) anlegen
5. **Verdä°¤chtige:** 3–5 Verdä°¤chtige anlegen, einen als `is_guilty = 1` markieren
6. **Startcodes:** Ausreichend Startcodes generieren (1 pro Team + Reserve)
7. **Test:** Mindestens einen kompletten Durchlauf im Admin- und Team-Modus testen

**Keine Code-Ä°nderungen nötig** — alles läuft über die bestehenden Admin-Editoren.

---

## Kontakt und Wartung

**Entwickler:** Joe Miebach  
**Repository:** https://github.com/JoeMiebach/cvjm-krimi-rallye  
**Hosting:** STRATO Hosting Basic (PHP 8.3, MySQL/MariaDB)  
**Letzte Aktualisierung:** 12.09.2026

Bei Fragen oder Erweiterungen: Diese Dokumentation ist als lebendes Dokument gedacht — bei neuen Features oder Bugfixes entsprechend aktualisieren.