# Schulolympiade Dashboard

Ein vollständiges Dashboard- und Verwaltungssystem für eine Schulolympiade mit Docker-basierter Deployment-Architektur.

## 🚀 Quick Start

```bash
# 1. Konfiguration erstellen
cp .env.example .env

# 2. .env bearbeiten und Werte anpassen (IP, Passwörter, etc.)
nano .env

# 3. Deployment starten
./scripts/deploy.sh --build
```

## 📁 Projektstruktur

```
schulolympiade/
├── docker-compose.yaml      # Haupt-Compose-Datei für alle Services
├── .env.example             # Vorlage für Umgebungsvariablen
├── .env                     # Deine Konfiguration (nicht im Git!)
│
├── services/                # Alle Node.js Microservices
│   ├── dashboard/           # Haupt-Dashboard (Port 3000)
│   ├── edit-data/           # Admin: Ergebnisse bearbeiten (Port 3003)
│   ├── edit-emoji/          # Admin: Emojis bearbeiten (Port 3004)
│   ├── success-event/       # Erfolgsseite nach Event-Eintrag (Port 3001)
│   ├── success-emoji/       # Erfolgsseite nach Emoji-Eintrag (Port 3002)
│   ├── ip-logging/          # IP-Logging + Redirect zu n8n (Port 3005)
│   └── shared/              # Gemeinsame Module (DB-Verbindung)
│
├── nginx/conf.d/            # Nginx Reverse Proxy Konfiguration
├── mysql-init/              # SQL-Init-Skripte für MySQL
├── n8n-workflows/           # Backup der n8n Workflows
├── scripts/                 # Deployment- und Build-Skripte
└── data/backups/            # MySQL Backups
```

## ⚙️ Konfiguration (.env)

Alle konfigurierbaren Werte befinden sich in einer `.env` Datei:

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| `SERVER_HOST` | IP/Hostname des Servers | `192.168.100.73` |
| `MYSQL_ROOT_PASSWORD` | MySQL Root Passwort | - |
| `MYSQL_USER` | MySQL User | `olympiade_user` |
| `MYSQL_PASSWORD` | MySQL User Passwort | - |
| `ADMIN_USER` | Admin Dashboard User | `DauView25` |
| `ADMIN_PASSWORD` | Admin Dashboard Passwort | - |
| `N8N_BASIC_AUTH_USER` | n8n Admin User | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | n8n Admin Passwort | - |
| `DASHBOARD_PORT` | Dashboard Port | `3000` |
| `N8N_PORT` | n8n Port | `5678` |
| `NGINX_PORT` | Nginx Port | `80` |

Vollständige Liste siehe `.env.example`.

## 🐳 Services

| Service | Port | Beschreibung |
|---------|------|--------------|
| Dashboard | 3000 | Live-Ranglisten und Statistiken |
| Success Event | 3001 | Bestätigungsseite nach Event-Eintrag |
| Success Emoji | 3002 | Bestätigungsseite nach Emoji-Eintrag |
| Edit Data | 3003 | Admin-Panel für Ergebnisse |
| Edit Emoji | 3004 | Admin-Panel für Emoji-Mappings |
| IP Logging | 3005 | IP-Logging + Redirect zu n8n Formular |
| n8n | 5678 | Workflow-Automatisierung |
| phpMyAdmin | 8080 | Datenbank-Verwaltung |
| CloudBeaver | 8081 | Alternative DB-Verwaltung |
| Nginx | 80 | Reverse Proxy |
| MySQL | 3308 | Datenbank (extern) |

## 🔗 URLs (via Nginx)

| Pfad | Ziel |
|------|------|
| `/dashboard` | Dashboard |
| `/ergebnis` | IP-Logging → n8n Event-Formular |
| `/emoji` | n8n Emoji-Formular |
| `/edit-ergebnis` | Admin: Ergebnisse bearbeiten |
| `/edit-emoji` | Admin: Emojis bearbeiten |

## 📜 Scripts

```bash
# Deployment
./scripts/deploy.sh --build    # Build & Start
./scripts/deploy.sh --down     # Stop all
./scripts/deploy.sh --logs     # View logs
./scripts/deploy.sh --status   # Container status

# Build Images
./scripts/build.sh             # Build lokal
./scripts/build.sh --push --registry myregistry.com  # Push zu Registry

# Export für anderen Server
./scripts/export.sh            # Erstellt .tar.gz Paket

# Manual Backup
./scripts/backup.sh            # MySQL Backup erstellen
```

## 🚚 Deployment auf neuem Server

```bash
# 1. Export erstellen (auf altem Server)
./scripts/export.sh

# 2. Archiv auf neuen Server kopieren
scp schulolympiade-deploy-*.tar.gz user@newserver:~/

# 3. Auf neuem Server
tar -xzf schulolympiade-deploy-*.tar.gz
cd schulolympiade
cp .env.example .env
# .env bearbeiten mit neuer IP, Passwörtern, etc.
./scripts/deploy.sh --build
```

## 🔄 n8n Workflows

Die n8n Workflows müssen nach dem ersten Start manuell importiert werden:

1. n8n öffnen: `http://<SERVER_HOST>:5678`
2. Login mit n8n Credentials aus `.env`
3. Workflows importieren aus `n8n-workflows/`
4. MySQL Credentials in n8n konfigurieren:
   - Host: `mysql` (Docker-interner Name)
   - Port: `3306`
   - User/Password: aus `.env`
5. Workflows aktivieren

## 💾 Backups

- **Automatisch**: MySQL Backup alle 10 Minuten (konfigurierbar via `BACKUP_CRON`)
- **Speicherort**: `data/backups/`
- **Aufbewahrung**: Letzte 10 Backups (konfigurierbar via `MAX_BACKUPS`)

## 🛠️ Entwicklung

Für lokale Entwicklung ohne Docker:

```bash
# In jedem Service-Ordner
cd services/dashboard
npm install
npm start

# Shared DB-Modul installieren
cd services/shared
npm install
```

Umgebungsvariablen müssen dann manuell gesetzt werden:
```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3308
export MYSQL_USER=olympiade_user
export MYSQL_PASSWORD=...
```

## 📝 Lizenz

Copyright (c) 2025 BEGA Team (Otto-Nagel-Gymnasium)

Diese Software darf ohne ausdrückliche, schriftliche Genehmigung des Autors nicht verwendet, kopiert, verändert, verbreitet oder weitergegeben werden.
