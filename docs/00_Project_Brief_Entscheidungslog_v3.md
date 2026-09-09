# Project Brief und Entscheidungslog (Version 3 – GitHub-Migration & Code-Abgleich)

**Arbeitstitel:** Der verschwundene Viking-Schatz
**Produkt:** Wiederverwendbare mobile Webapp fuer Krimi-Stadtrallyes auf Jugendfreizeiten
**Projektstatus:** Implementierung laeuft (Frontend + Backend bereits groesstenteils umgesetzt,
CI/CD-Deploy-Pipeline fuer Backend und beide Frontends live)
**Stand:** 09.09.2026
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v2.md (bitte archivieren, z. B. als `ARCHIV_00_..._v2.md`)

---

## Wichtigste Aenderungen gegenueber v2

1. **Quellcode-Verwaltung:** Der Code liegt jetzt versioniert in einem privaten GitHub-Repository
   (`JoeMiebach/cvjm-krimi-rallye`), nicht mehr nur als loser Datei-Upload. Diese Projektdokumente
   werden zusaetzlich unter `docs/` im selben Repo gespiegelt.
2. **Frontend-Realitaet:** Es sind zwei getrennte React/Vite-Anwendungen (`team-app/`,
   `admin-app/`), nicht ein einzelnes Frontend, wie v2 vereinfachend beschrieb.
3. **Neues Feature "Ermittlungsakte":** Ein bisher undokumentiertes Story-Feature, das Team-App
   von einer reinen Raetsel-Abhakliste zu einer digitalen Ermittlungszentrale macht.
4. **Zwei getrennte Kartenfunktionen:** Stationskarte (ohne andere Teams, aus Datenschutz- und
   Fairnessgruenden) und eigene Live-Positionsanzeige (`StationsMapScreen.jsx`, implementiert).
5. **Sicherheitsvorfall behoben:** Eine Konfigurationsdatei mit echten Zugangsdaten wurde
   versehentlich committet, per Git-History-Rewrite entfernt, alle betroffenen Secrets rotiert.
6. **Cleanup-Bug behoben:** Positionsdaten wurden faelschlich sofort nach Rallye-Ende geloescht,
   unabhaengig vom tatsaechlichen Alter der Daten -- jetzt altersbasiert (Standard: 4 Stunden).
7. **Automatisierte CI/CD-Pipeline:** Zwei GitHub-Actions-Workflows deployen Backend und beide
   Frontends automatisch per SFTP bei Push auf `main` (siehe Architekturentscheidung und
   technische Spezifikation v3 fuer Details, inkl. der Erkenntnis, dass `/stadtrallye` auf
   STRATO das Document-Root ist und nicht Teil der URL-Pfade).

---

## Zielgruppe und Rahmen (unveraendert)

| Aspekt | Festlegung |
|---|---|
| Teilnehmende | Etwa 40 Jugendliche |
| Alter | 14 bis 17 Jahre |
| Teams | Variabel konfigurierbar; typischerweise 8 bis 10 Teams mit 4 bis 5 Personen |
| Spielzeit | 120 Minuten Gesamtzeitlimit |
| Geraete | Mindestens ein Smartphone mit Internet pro Team |
| Spielmodus | Teams treten gegeneinander an |
| Stationsreihenfolge | Frei waehlbar |
| Hosting | STRATO Hosting Basic (Shared Webhosting, PHP 8.3, MySQL) |
| Design | Helles, einfaches, mobile-first Design |

---

## Architekturentscheidung (aktualisiert)

| Schicht | Technologie | Zweck |
|---|---|---|
| Client (Team) | React, Vite, Tailwind CSS, `react-router-dom`, `react-leaflet` | `team-app/` -- mobile Team-App |
| Client (Admin) | React, Vite, Tailwind CSS, `react-router-dom` | `admin-app/` -- Spielleiter-/Beobachter-Frontend |
| PWA | Service Worker, lokaler Cache | Robuster Betrieb bei instabiler Verbindung |
| Karte | Leaflet + OpenStreetMap, ueber `react-leaflet` | Live-Karte (Admin) und Stationskarte (Team, ohne andere Teams) |
| Kamera | QR-Scanner-Bibliothek (client-seitig) | QR-Freischaltung von Stationen |
| GPS | Browser Geolocation API | Geofencing und eigene Standortanzeige (implementiert) |
| Echtzeit-Ersatz | Polling (Fetch alle 10 Sekunden) | Leaderboard, Broadcasts, Admin-/Beobachter-Live-Ansicht |
| Backend | PHP 8.3, REST-API ueber einfache Endpoint-Dateien | Spiellogik, Authentifizierung |
| Datenbank | MySQL/MariaDB (SSD-DB von STRATO) | Rallyes, Teams, Stationen, Raetsel, Fortschritt |
| Betrieb | STRATO Hosting Basic, HTTPS via STRATO-SSL | Hosting; Uploads per SFTP, automatisiert ueber GitHub Actions |
| Cleanup-Job | Altersbasierte Lazy Cleanup bei jedem Request + externer Cron-Trigger | Ersatz fuer fehlende serverseitige Cronjobs |
| Quellcode | Privates GitHub-Repository `JoeMiebach/cvjm-krimi-rallye` | Versionierung, Code-Review, Single Source of Truth zusammen mit `docs/` |
| CI/CD | GitHub Actions (`deploy-backend.yml`, `deploy-frontend.yml`) | Automatisches Build + SFTP-Deploy bei Push auf `main`, manuell ausloesbar per `workflow_dispatch` |

---

## Entschiedene Punkte (kumulativ aus v1/v2, weiterhin gueltig)

1. **Rallye-Modell:** Multi-Rallye von Anfang an. Alle Inhalte (Stationen, Raetsel, Teams,
   Startcodes, Broadcasts) sind einer `rallye_id` zugeordnet.
2. **Team-Registrierung:** Admin generiert pro Rallye eine Menge an Startcodes. Teams geben nur
   den Startcode ein und waehlen danach frei einen Teamnamen.
3. **Raetselversuche:** `max_attempts` ist pro Raetsel individuell im Adminbereich einstellbar.
4. **Hinweise:** Punktabzug pro Raetsel individuell konfigurierbar ueber `hint_penalty`.
5. **Rollen:** Admin/Spielleiter (Vollzugriff) und Beobachter (nur Lesezugriff). Admin-Zugang
   ausschliesslich fuer Joe Miebach, Beobachter-Zugaenge fuer Mitarbeiter des CVJM Ründeroths.
6. **Karte:** Leaflet + OpenStreetMap, konkret ueber `react-leaflet`.
7. **Standortdaten-Cleanup:** Kombination aus altersbasierter Lazy Cleanup und externem
   Cron-Trigger als Sicherheitsnetz.
8. **Polling-Intervall:** 10 Sekunden fuer Leaderboard, Broadcasts und Admin-/Beobachter-Live-Karte;
   20-30 Sekunden fuer GPS-Geofence-Checks.
9. **PHP-Version:** 8.3.

## Neu entschiedene/praezisierte Punkte (v3)

10. **Frontend-Aufteilung:** Zwei getrennte Vite-Anwendungen (`team-app/`, `admin-app/`) statt
    eines einzelnen Frontends. Begruendung: unterschiedliche Nutzergruppen, unterschiedliche
    Berechtigungsmodelle, getrennte Deploy-Artefakte reduzieren Bundle-Groesse pro Zielgruppe.
11. **Datenschutz bei Kartenfunktionen:** Kein Team sieht jemals die Live-Position eines anderen
    Teams. Die Stationskarte (`StationsMapScreen.jsx`) zeigt ausschliesslich Stationspositionen.
    Die eigene Live-Position wird zusaetzlich ausschliesslich fuer das eigene Team angezeigt,
    niemals andere Teams. Grund: Wettbewerbsfairness und Minderjaehrigenschutz.
12. **"Ermittlungsakte" als Story-Mechanik:** Zusaetzlich zum reinen Punktesystem sammelt jedes
    Team ueber `CaseFileScreen.jsx` freigeschaltete Story-Hinweise ("Beweisstuecke") an einem
    zentralen Ort. Macht die Story praesenter als nur einzelne Stationstexte.
13. **Quellcode-Governance:** GitHub statt reiner Datei-Uploads. `.gitignore` schliesst
    `config.php`, `config.local.php`, `node_modules/`, `dist/`, `logs/` konsequent aus. Bei
    versehentlichem Secret-Commit: vollstaendiger History-Rewrite PLUS Rotation aller
    betroffenen Zugangsdaten ist Pflicht, nicht optional.
14. **CI/CD-Automatisierung (09.09.2026):** Zwei getrennte GitHub-Actions-Workflows fuer Backend
    und Frontend statt manueller SFTP-Uploads. Zusaetzlich manueller `workflow_dispatch`-Trigger
    fuer Tests ohne Code-Aenderung. Wichtige Rahmenbedingung: `/stadtrallye` ist auf STRATO das
    Document-Root der Domain, Dateisystem-Pfad und URL-Pfad unterscheiden sich daher um dieses
    Praefix (siehe technische Spezifikation v3, Abschnitt Deployment).

## Weiterhin offen

1. Welche schwedische Stadt wird tatsaechlich besucht? (Platzhalter: Stockholm)
2. Wie viele Stationen fuer die erste Rallye? (Empfehlung weiterhin: 8-10)
3. Wie viele Raetsel pro Station? (Empfehlung weiterhin: 1 Haupt-Raetsel, optional 1 Bonus-Raetsel)
4. Konkrete Domain fuer das Hosting-Paket (aktuell Platzhalter, siehe technische Spezifikation)
5. Soll `POST /puzzles/submit.php` bei richtiger Antwort direkt den zugehoerigen
   `story_clue`-Text zurueckliefern (fuer ein sofortiges Popup), oder erscheint das Beweisstueck
   bewusst erst verzoegert in der Ermittlungsakte? Falls sofort: fehlt vermutlich eine Spalte
   `puzzles.story_clue_text` im Schema -- muss gegen den echten Datenbankstand geprueft werden.
6. **NEU:** Rallye-Auswahl im Admin-UI: `admin-app` nutzt aktuell die Build-Zeit-Konstante
   `VITE_DEFAULT_RALLYE_ID` (Platzhalter `1`) statt eines echten Auswahl-Dropdowns. Zu klaeren:
   neuer API-Endpunkt zum Auflisten verfuegbarer Rallyes, und ob die Auswahl in LocalStorage
   oder serverseitig pro Admin-Session gespeichert wird.
7. Frontend-Build/Deploy fuer `team-app` und `admin-app` laeuft aktuell in zwei separaten
   GitHub-Actions-Jobs im selben Workflow; bei wachsender Anzahl an Frontend-Apps ggf.
   Build-Matrix statt Duplizierung pruefen (aktuell bei zwei Apps nicht dringend).

## Datenschutz-Hinweis (unveraendert aus v1/v2)

Vor einer echten Freizeit muessen eine transparente Datenschutzerklaerung sowie die
erforderlichen Einwilligungen der Jugendlichen und ggf. der Erziehungsberechtigten verbindlich
mit dem CVJM Ründeroths abgestimmt werden. Das vorhandene Datenschutz-Konzept ist
Arbeitsgrundlage und ersetzt keine Rechtsberatung.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3, CI/CD-Ergaenzung am 09.09.2026)
**Autor:** Joe Miebach (v3 mit Unterstuetzung durch Perplexity-Assistent, Code-Abgleich gegen
JoeMiebach/cvjm-krimi-rallye)
**Version:** 3.0
