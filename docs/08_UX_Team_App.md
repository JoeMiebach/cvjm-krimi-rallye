# UX-Verbesserungen: Team-App

## Zielgruppe

Jugendliche 14-17 Jahre, mobile Nutzung im Freien, teilweise schlechtes Netz.

## Priorisierte Maßnahmen

### 1. Offline-Fallback (Service Worker)

**Problem:** Netzabrisse wä¹¹hrend der Rallye.

**Lö¹¹¹sung:**
- Service Worker cached HTML, CSS, JS
- API-Calls werden in Queue gelegt, bei Netz wieder automatisch gesendet
- Fallback-Seite: "Kein Netz - letzte Station war X"

**Umsetzung:**
```js
// sw.js
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // Netzwerk zuerst, bei Fallback in IndexedDB speichern
    event.respondWith(networkFirstStrategy(event.request));
  } else {
    // Statische Assets aus Cache
    event.respondWith(cacheFirstStrategy(event.request));
  }
});
```

**Dateien:**
- `/public/sw.js`
- `/team/register-sw.js` (lä¹¹dt Service Worker)

---

### 2. Barrierefreiheit (Accessibility)

**Kontrast:**
- Mindestens 4.5:1 für Text (WCAG AA)
- Buttons: deutliche Hover-/Focus-States

**Screenreader:**
- Alle Icons mit `aria-label`
- Form-Fehler mit `aria-describedby`
- Live-Region für Status-Updates (z. B. "Code gültig!")

**Tastatur:**
- Vollstä¹¹ndige Navigation ohne Maus
- Focus-Indikator sichtbar (z. B. `outline: 2px solid`)

**Checkliste:**
- [ ] Farbkontrast prüfen (Tools: axe, Lighthouse)
- [ ] Screenreader-Test (NVDA / VoiceOver)
- [ ] Tastatur-Only-Test

---

### 3. QR-Code-Scanner (Alternative zum manuellen Input)

**Problem:** Codes abtippen ist fehleranfa11lig.

**Lö¹¹¹sung:**
- Button "Code scannen" -> ö11ffnet Kamera
- Erkennt QR-Code -> fä¹¹llt Input-Feld automatisch
- Fallback: manueller Input weiterhin mö11glich

**Bibliothek:**
- `html5-qrcode` (leicht, kein Build nötig)

**Umsetzung:**
```html
<div id="qr-reader"></div>
<button id="scan-btn">Code scannen</button>
<input type="text" id="station-code" placeholder="Code eingeben">
```

```js
const qr = new Html5Qrcode("qr-reader");
qr.start({ facingMode: "environment" }, {
  fps: 10,
  qrbox: { width: 250, height: 250 }
}).then(decodedText => {
  document.getElementById('station-code').value = decodedText;
  qr.stop();
});
```

---

### 4. Visuelles Feedback

**Ladezustä¹¹nde:**
- Spinner bei API-Calls
- Deaktivierte Buttons wä¹¹hrend Submit

**Fehlermeldungen:**
- Klare Sprache: "Code ungä¹¹ltig - bitte prüfe die Buchstaben"
- Keine technischen Errors (kein "500 Internal Server Error")

**Erfolg:**
- Grü11ner Haken + Animation bei korrektem Code
- Kurzer Toast: "Station gelä¹¹st! +10 Punkte"

---

### 5. Dark Mode (optional)

**Vorteil:** Batteriesparen, bessere Lesbarkeit bei Sonne.

**Umsetzung:**
- CSS-Variable für Farben
- Toggle im Footer (lokal gespeichert)

```css
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
}
[data-theme="dark"] {
  --bg: #1a1a1a;
  --text: #ffffff;
}
```

---

## Nä11chste Schritte

1. Service Worker + Offline-Queue (hö¹¹¹chste Prio)
2. QR-Scanner integrieren
3. Accessibility-Check vor erstem Release
