# Deployment (Strato)

## Voraussetzungen

- STRATO Hosting Basic (PHP 8.2+ empfohlen)
- MySQL-Datenbank (mind. 50 MB)
- FTP/SFTP-Zugang oder SSH

## Schrittfolge

### 1. Datenbank anlegen

1. Im Strato Control Panel -> "Datenbanken" -> "Neue Datenbank"
2. Notiere:
   - Host (meist `localhost` oder `rdbms.strato-hosting.eu`)
   - Datenbankname (z. B. `H2ABCDE123456`)
   - Benutzer (meist identisch mit Datenbankname)
   - Passwort (selbst vergeben)

### 2. Code hochladen

**Option A: FTP**
- Alle Projektdateien in `/httpdocs/` oder einen Subordner (z. B. `/httpdocs/rallye/`)

**Option B: Git (falls SSH verfügbar)**
```bash
cd /httpdocs
git clone https://github.com/JoeMiebach/cvjm-krimi-rallye.git rallye
cd rallye
composer install --no-dev --optimize-autoloader
```

### 3. `.env` konfigurieren

Erstelle `.env` im Projekt-Root:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://deine-domain.de/rallye

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=H2ABCDE123456
DB_USERNAME=H2ABCDE12346
DB_PASSWORD=dein_passwort

SESSION_LIFETIME=120

# Admin-User (nach erstem Login änderbar)
ADMIN_EMAIL=admin@cvjm-ruenderoths.de
ADMIN_PASSWORD=TempPass123!
```

### 4. Datenbank migrieren

**Manuell (phpMyAdmin):**
- `docs/seeds/01_schema.sql` importieren
- `docs/seeds/02_admin_user.sql` importieren
- `docs/seeds/03_demo_data.sql` importieren (optional)

**Oder per CLI (falls verfügbar):**
```bash
php migrate.php
php seed.php
```

### 5. Cronjob einrichten (optional, für Cleanup)

Im Strato Panel -> "Cronjobs" -> neuer Job:

```bash
# Alle 5 Minuten
*/5 * * * * cd /httpdocs/rallye && php cleanup_secrets.php
```

Falls kein Cron verfügbar: Cleanup manuell im Admin-Bereich triggern (siehe `09_Admin_Features.md`, Abschnitt 5).

### 6. HTTPS erzwingen

In `.htaccess` (Apache):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 7. Testen

- `/admin` -> Login mit Admin-Credentials
- `/team` -> Test-Team anlegen, Code eingeben
- `/api/health` -> sollte `{"status":"ok"}` zurückgeben

## Backup-Strategie

### Datenbank
- Wö¹¹¹entlich: Export via phpMyAdmin -> lokal speichern
- Vor jeder Rallye: manuelles Backup

### Code
- Git-Repository ist bereits Backup
- `.env` separat sichern (enthä¹¹t Passwö¹¹¹ter)

## Troubleshooting

| Problem | Lösung |
|---|---|
| 500 Fehler | `.env` prüfen, `APP_DEBUG=true` temporä¹¹r aktivieren |
| DB-Connection failed | Host/Port bei Strato ist oft `rdbms.strato-hosting.eu:3306` |
| Session lä11uft zu früh ab | `SESSION_LIFETIME` in `.env` erhöhen |
| HTTPS-Umlenkung fehlschlä¹¹gt | `.htaccess` auf Schreibrechte prüfen |

## Nächste Schritte

- Nach Deployment: `09_Admin_Features.md` -> CSV-Export für Teams nutzen
- Für nä11chste Rallye: Admin-Bereich -> Rallye-Konfiguration anpassen
