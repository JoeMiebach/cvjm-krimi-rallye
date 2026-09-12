# KI-Arbeitsanweisungen — CVJM Krimi-Stadtrallye

**Zweck:** Ergnzt die bestehenden Projekteinstellungen um konkrete, operationale Regeln fr die KI-gesttzte Weiterentwicklung. Diese Anweisungen gelten zustzlich zu und in bereinstimmung mit den Projekteinstellungen (Rolle, Projektziel, Arbeitsweise, Bestatigungen minimieren).

---

## 1. Vollstandigen Ist-Zustand kennen, bevor Code generiert wird

**Regel:** Die KI generiert niemals Anderungen an einer Datei, deren aktuellen vollstandigen Inhalt sie nicht tatsachlich gelesen hat.

- Vor jeder Bearbeitung wird der **aktuelle Stand direkt aus GitHub** geladen (`get_file_contents`), nicht aus dem Konversationsverlauf, alten Code-Exporten oder der Erinnerung an frhere Antworten rekonstruiert.
- Bei Anderungen, die mehrere Dateien betreffen (z. B. neuer Endpunkt → betrifft Backend-Route, `api/client.js` im jeweiligen Frontend, DB-Schema, Dokumentation), mssen **alle** betroffenen Dateien vollstandig gelesen werden, nicht nur die offensichtlichste.
- Wenn eine Datei zu groß ist, um sie in einem Tool-Aufruf vollstandig zu erfassen: gezielt nachfordern (z. B. abschnittsweise ber `get_file_contents` mit `ref`/Pfad), **nicht spekulieren oder aus Teilausschnitten extrapolieren**.
- SHA-Werte fr `create_or_update_file`/`push_files` werden unmittelbar vor dem Schreibvorgang erneut abgerufen, wenn zwischen Lesen und Schreiben Unsicherheit ber zwischenzeitliche Anderungen besteht (z. B. Joe hat parallel manuell im Repo gearbeitet).
- Erst wenn der vollstandige Kontext vorliegt, wird der neue Dateiinhalt generiert und eine Bestatigung angefragt.

---

## 2. Direkter GitHub-Push-Workflow

- Alle Code-Anderungen werden **direkt als Commit ins GitHub-Repository** (`JoeMiebach/cvjm-krimi-rallye`) geschrieben — nicht als lokale Downloaddatei zum manuellen Hochladen, außer Joe bittet explizit darum.
- Mehrere Datei-Anderungen einer Aufgabe werden wo immer mglich in **einem** `push_files`-Commit gebndelt (siehe Projekteinstellungen, "Bestatigungen minimieren").
- Commit-Messages folgen dem im Code bereits etablierten Stil und sind aussagekraftig:
  ```
  <Kurzbeschreibung>

  - NEU/GEANDERT/GEFIXT (TT.MM.JJJJ): <was und warum>
  - Betroffene Doku: <Dateiname(n) im docs/-Ordner>
  ```
- Die bestehenden Inline-Kommentar-Konventionen im Code (`// NEU (Datum): ...`, `// GEANDERT (Datum): ...`, `// GEFIXT (Datum): ...`) werden fr neue Anderungen fortgefhrt, damit der Code selbst nachvollziehbar bleibt.

---

## 3. Dokumentationspflicht bei jedem Commit

**Regel:** Kein Code-Commit ohne zugehrigen Doku-Update im selben Commit.

### 3.1 Mapping: Anderung → zustandige Doku-Datei

| Anderung betrifft ... | Zu aktualisierende Datei |
|---|---|
| Spielkonzept, Story, Chat-Mechanik, Knotentypen, Twist-Logik, Verdachtige | `docs/01_Konzept.md` |
| Architektur, Auth, Polling, Sicherheitskonzept, Deployment, Hosting | `docs/02_Technische_Spezifikation.md` |
| Datenbankschema (neue Tabelle, neue Spalte, geanderter ENUM, Trigger) | `docs/03_Datenbank.md` |
| Team-App (Screens, Components, Contexts, API-Client, Routing) | `docs/04_Team_App.md` |
| Admin-App (Screens, Contexts, API-Client, Routing) | `docs/05_Admin_App.md` |
| Backend/API (neuer Endpunkt, geanderte Lib-Funktion, geanderte Response) | `docs/06_Backend.md` |
| Projektstatus, Deployment-Checkliste, bekannte Prfpunkte bergreifend | `docs/00_Dokumentation_Uebersicht.md` |

### 3.2 Wie dokumentiert wird

- **Keine neuen Dateien im `docs/`-Ordner anlegen.** Jede Anderung wird in die inhaltlich passende, bestehende Datei aus der Tabelle oben eingearbeitet.
- **Keine "Erganzungs"- oder "Addendum"-Dateien/-Abschnitte.** Neue Informationen werden direkt in den entsprechenden bestehenden Abschnitt integriert (z. B. eine neue Endpunkt-Beschreibung kommt in `06_Backend.md` unter "Admin-Endpunkte" oder "Team-Endpunkte", nicht als neuer Anhang ans Dateiende).
- Wird ein zuvor dokumentierter **Prfpunkt/Bug behoben**, wird der entsprechende Eintrag in den "Bekannte Detailpunkte"/"Bekannte Prfpunkte"-Abschnitten **entfernt oder explizit als gelst markiert** — nicht stehen gelassen.
- Die Kopfzeile "**Stand:** TT.MM.JJJJ" jeder geanderten Doku-Datei wird auf das aktuelle Datum aktualisiert.
- Bei Widersprchen zwischen Konzept, Technischer Spezifikation und Datenbankschema, die durch die Anderung entstehen oder sichtbar werden: alle betroffenen Dokumente im selben Commit konsistent nachziehen (siehe Projekteinstellungen: "Halte Konzept, technische Spezifikation und Datenbankschema konsistent").

---

## 4. Bestatigungsanfragen: Doku gehrt mit rein

Erganzend zu den bestehenden Regeln zur Bestatigungsminimierung:

- Die gebndelte Bestatigungsanfrage listet **immer sowohl Code- als auch Doku-Dateien** auf, die im selben Commit geandert werden.
- Der vollstandige Anderungsumfang (Code **und** Dokumentation) wird **vor** der ersten Bestatigungsanfrage durchgeplant — kein nachtragliches "und jetzt update ich noch die Doku" als zweiter Schritt/zweite Bestatigung.

---

## 5. Sicherheit und Datenschutz

- Niemals Secrets (`config.local.php`, DB-Zugangsdaten, `cleanup_secret`, API-Keys) in einen Commit aufnehmen. `.gitignore` vor jedem Commit mit neuen Konfigurationsdateien prfen.
- Wird versehentlich ein Secret committet: sofort melden, vollstandigen Git-History-Rewrite **und** Rotation der betroffenen Zugangsdaten vorschlagen (siehe `02_Technische_Spezifikation.md`, Sicherheitskonzept).
- Da Teilnehmende Jugendliche 14–17 Jahre sind: keine echten Namen, Fotos oder Standortdaten realer Personen in Beispieldaten, Testdaten oder Dokumentation verwenden. Ausschließ¬lich fiktive Platzhalter (wie "Team Wolf", "Erik Halvorsen").

---

## 6. Hosting-Realitat beachten (STRATO Hosting Basic)

- Alle Vorschlage mssen auf **Shared Hosting ohne Dauerprozesse, ohne WebSockets, ohne Cronjob-Garantie** lauffahig sein (siehe Lazy-Cleanup-Pattern, Polling statt Push).
- Kein Vorschlag von Technologien, die einen Build-Server, Docker, oder einen dauerhaft laufenden Node-Prozess voraussetzen.
- Bei destruktiven Datenbankanderungen (z. B. Spalte umbenennen, NOT NULL nachtraglich erzwingen) grundsatzlich ein **Migrationsvorgehen** vorschlagen, das bestehende Produktivdaten nicht verletzt, statt direktem `DROP`/`ALTER` ohne Rcksicht auf Bestandsdaten.

---

## 7. Multi-Rallye-Architektur nicht brechen

- Jedes neue Feature, jede neue Tabelle wird konsequent ber `rallye_id` skopiert (`requireRallyeAccess()` im Backend nutzen).
- Keine hartkodierten Werte fr die aktuelle Testrallye (z. B. feste Rallye-IDs, feste Stadtnamen) in produktivem Code — das wrde die geforderte Wiederverwendbarkeit fr knftige Einsatzorte brechen.

---

## 8. Umgang mit Unsicherheit

- Wenn nach vollstandigem Lesen der relevanten Dateien weiterhin eine fachliche oder technische Entscheidung fehlt (z. B. "Soll die Rate-Limit-Grenze pro IP oder pro Team gelten?"): **nachfragen**, bevor Code generiert wird (siehe Projekteinstellungen, "Frage nach fehlenden fachlichen und technischen Entscheidungen").
- Nie eine Annahme als Fakt in die Dokumentation schreiben. Wenn etwas nicht verifiziert werden konnte, wird das explizit benannt — aber das Ziel ist, durch vollstandiges Lesen (Punkt 1) genau das zu vermeiden.

---

## 9. Codequalitat und Vollstandigkeit

- Bei Anderung einer bestehenden Datei wird die **gesamte aktualisierte Datei** geliefert bzw. committet, nicht nur ein Diff-Ausschnitt — außer Joe bittet explizit um eine Diff-Ansicht zur Prfung vor dem Commit.
- Jede geanderte/neue Datei ist sofort lauffahig bzw. syntaktisch korrekt (kein Pseudocode, keine Platzhalter-Kommentare wie `// TODO: hier fehlt noch was` in produktivem Code).
- Da kein automatisiertes Test-Setup existiert: bei jeder funktionalen Anderung eine kurze **manuelle Prf-Checkliste** (welche Screens/Endpunkte sind betroffen und sollten nach dem Deployment kurz angetestet werden) in der Bestatigungsanfrage oder im Commit-Beschreibungstext mitliefern.

---

## Bezug zu bestehenden Projekteinstellungen

Diese Anweisungen stehen nicht im Widerspruch zu den bestehenden Projekteinstellungen, sondern konkretisieren sie:

- "Denke als erfahrener Fullstack-Senior-Developer" → operationalisiert in Punkt 1 (nie ohne vollstandigen Kontext arbeiten) und Punkt 9 (Codequalitat).
- "Halte Konzept, technische Spezifikation und Datenbankschema konsistent" → operationalisiert in Punkt 3 (Dokumentationspflicht, Mapping-Tabelle).
- "Bndle Schreibvorgange in einen Commit, plane vollstandig vor der ersten Bestatigung" → erweitert in Punkt 4 um die Pflicht, Doku-Dateien in dieselbe Bestatigung/denselben Commit einzubeziehen.

**Stand:** 12.09.2026
