# Konzept: „Der verschwundene Viking-Schatz"

**Krimi-Stadtrallye-Webapp für Jugendfreizeiten des CVJM Ründeroths**
**Stand dieser Zusammenfassung:** 12.09.2026
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v3.md, 01_Konzeptpapier_Viking_Schatz_v3.md

---

## 1. Projektrahmen

| Parameter | Festlegung |
|---|---|
| Zielgruppe | 14–17 Jahre |
| Teilnehmende | ca. 40 Jugendliche, 8–10 Teams à 4–5 Personen |
| Dauer | 120 Minuten (konfigurierbar über `time_limit_minutes`) |
| Spielmodus | Teams treten gegeneinander an, individueller Spielablauf pro Team |
| Einsatzort | Flexibel konfigurierbar pro Rallye (aktuell z. B. Testlauf in Schnellenbach/Engelskirchen) |
| Geräte | Mindestens 1 Smartphone pro Team mit Internetzugang |
| Hosting | STRATO Hosting Basic (Shared Webhosting, PHP 8.3, MySQL/MariaDB) |
| Design | Hell, mobile-first, PWA-fähig |

Das Konzept ist als **wiederverwendbares Framework** angelegt: Eine neue Rallye (neue Stadt, neue Story-Variante) lässt sich vollständig über den Admin-Bereich anlegen, ohne Code zu ändern.

---

## 2. Story-Rahmen

**Jahr 873 n. Chr.:** Der Wikinger-Häuptling Björn „Eisenhand" versteckte einen Schatz in einer Küstenstadt, bevor er ermordet wurde. **Heute:** Die Archäologin **Freya Lindqvist** hat Björns Tagebuch-Fragment gefunden und führt die Teams als Ermittler durch die Stadt.

Es gibt nicht nur einen Fund: Ein **Twist** lässt Teams zwischen einem schnellen, kleineren Fund und einem größeren, aufwändigeren Schatz wählen. Am Ende steht eine **Anklage** — die Teams müssen unter mehreren Verdächtigen den Dieb des Tagebuchs identifizieren.

---

## 3. Spielmechanik: Der Ermittler-Chat

Das Kernspielprinzip ist ein **Chat mit Freya Lindqvist** (nicht eine starre Stationsliste). Jedes Team erlebt eine sich organisch erschließende Ermittlung.

### 3.1 Knotentypen (`story_nodes.type`)

| Typ | Bedeutung |
|---|---|
| `info` | Reine Information/Verzweigung, keine Antwort nötig, kaskadiert automatisch zu Folgeknoten |
| `answer` | Erwartet eine Antwort (Buttons, Text, Zahl, Rätsel-Verweis, Foto) |
| `twist` | Echte, folgenreiche Entscheidung mit zwei Optionen |
| `accusation` | Finale Anklage gegen einen Verdächtigen |

### 3.2 Antworttypen (`story_nodes.response_type`)

| Wert | Bedeutung |
|---|---|
| `none` | Keine Nutzerantwort — Info-Knoten kaskadieren automatisch an alle Optionen |
| `buttons` | Team wählt aus vorgegebenen Antwortoptionen |
| `text` / `number` | Freitext- bzw. Zahleneingabe |
| `puzzle_ref` | Verweis auf ein klassisches Rätsel (öffnet `PuzzlesScreen`) |
| `photo_ref` | Foto-Einreichung, Bonuspunkte vergibt ein Admin nachträglich |

### 3.3 Discovery-Modell für Stationen (`stations.discovery_mode`)

| Wert | Bedeutung |
|---|---|
| `lead_only` | Station erscheint erst auf der Karte, wenn der Chat sie freischaltet (Fog of War) |
| `proximity` | Station erscheint bereits durch GPS-Nähe, unabhängig vom Chat |
| `both` | Beides gilt: Lead ODER Nähe schaltet frei |

**Content-Regel:** Abschluss-relevante Knoten (v. a. Verdächtige) dürfen nie ausschließlich `proximity`-only sein — sonst wäre die Anklage für manche Teams strukturell unerreichbar.

### 3.4 Twist- und Nebenpfad-Mechanik

Die Twist-Entscheidung („Kleiner, schneller Fund" vs. „Größerer Schatz") ist eine echte Weichenstellung: Die gewählte Spur wird sofort aktiv, die andere blockiert (`blocks_alternate_node_id`). Als **Nebenpfad** kann ein Team nach Abschluss seines gewählten Pfads einen zusätzlichen Hinweis erhalten, der den zunächst verpassten Pfad nachträglich freischaltet (`unlocks_station_id` auf einer Option) — symmetrisch in beide Richtungen. Kosten-Modell: keine Punktstrafe, nur investierte Zeit.

### 3.5 Proaktive Nachrichten

Freya kann sich unaufgefordert melden:
- `proactive_trigger = 'inactivity'`: nach X Minuten ohne Teamaktivität
- `proactive_trigger = 'wrong_attempts'`: nach X Fehlversuchen an einem verknüpften Knoten

Diese werden per Lazy Evaluation bei jedem `GET /team/chat.php`-Poll geprüft (kein Cronjob nötig).

### 3.6 Verdächtige und finale Anklage

Vier (konfigurierbare) Verdächtige werden über `reveals_suspect_id` an Chat-Knoten schrittweise „entdeckt". Die finale Anklage (`type = 'accusation'`) prüft die Wahl gegen `suspects.is_guilty`; nur der **erste Versuch** zählt für den Bonus. Bei falscher Wahl liefert `wrong_pick_reaction_text` eine erklärende Rückmeldung.

### 3.7 Foto-Einreichung

Bei `response_type = 'photo_ref'` lädt das Team ein Foto hoch (clientseitig komprimiert auf Web bevor Upload, siehe Team-App-Dokumentation). Der Upload schließt die Aufgabe sofort ab; ein Admin vergibt die Bonus-Punkte nachträglich über den Foto-Review-Bereich.

---

## 4. Rollen und Zugriff

| Rolle | Zugriff |
|---|---|
| **Admin** | Vollzugriff (Spielsteuerung, alle CRUD-Editoren) — ausschließlich Joe Miebach |
| **Viewer/Beobachter** | Nur Lesezugriff (Dashboard, Karte, Ranglisten) — für Mitarbeitende des CVJM Ründeroths |
| **Team** | Zugriff nur auf eigene Daten über Startcode-Login |

---

## 5. Wiederverwendbarkeit für künftige Rallyes

Alles ist an eine `rallye_id` gebunden: Stationen, Rätsel, Story-Knoten, Verdächtige, Teams, Startcodes, Broadcasts. Eine neue Rallye lässt sich vollständig im Admin-Bereich anlegen:

1. Rallye anlegen (Name, Stadt, Zeitlimit, Story-Intro)
2. Stationen mit GPS/QR/manueller Freischaltung anlegen
3. Rätsel pro Station anlegen
4. Story-Knoten (Chat-Dialog) und Verdächtige anlegen
5. Startcodes generieren und an Teams ausgeben

Ein bestehender Testlauf (Schnellenbach, Bergisches Land) demonstriert dieses Muster bereits als Vorlage für künftige Einsätze in anderen Städten.

---

## 6. Datenschutz-Hinweis

Vor einem echten Einsatz mit Jugendlichen müssen eine transparente Datenschutzerklärung sowie die Einwilligungen der Teilnehmenden bzw. Erziehungsberechtigten mit dem CVJM Ründeroths abgestimmt werden. Insbesondere gilt: **Kein Team sieht jemals die Live-Position eines anderen Teams** — die einzige Ansicht mit Positionsdaten mehrerer Teams ist `GET /admin/positions.php`, ausschließlich für Admin/Viewer.

---

**Konsolidiert aus:** 00_Project_Brief_Entscheidungslog_v3.md, 01_Konzeptpapier_Viking_Schatz_v3.md, 05_Technische_Spezifikation_Ermittler_Chat_v1.md, sowie Abgleich gegen den produktiven Codestand (Backend/Team-App/Admin-App, Stand 12.09.2026).
