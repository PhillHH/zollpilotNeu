# Operations Manual

Betriebsleitfaden für ZollPilot – enthält alle notwendigen Informationen für den täglichen Betrieb.

---

## 🚀 Start & Stop

### Docker Compose (Development/Single-Host)

```bash
# Starten (Vordergrund)
docker compose up

# Starten (Hintergrund)
docker compose up -d

# Stoppen
docker compose down

# Stoppen + Volumes löschen (ACHTUNG: Datenverlust!)
docker compose down -v

# Neu bauen nach Code-Änderungen
docker compose up --build

# Einzelnen Service neustarten
docker compose restart api
docker compose restart web
```

### Status prüfen

```bash
# Alle Container
docker compose ps

# Health Check
curl -H "X-Contract-Version: 1" http://localhost:8000/health

# Readiness Check (inkl. DB)
curl -H "X-Contract-Version: 1" http://localhost:8000/ready
```

**Erwartete Antworten:**

```json
// /health → 200 OK
{ "data": { "status": "ok" } }

// /ready → 200 OK (oder 503 bei DB-Problem)
{ "data": { "status": "ok", "database": "ok", "version": "1.0.0" } }
```

---

## 📋 Logs lesen

### Container Logs

```bash
# Alle Logs
docker compose logs -f

# Nur API
docker compose logs -f api

# Nur Web
docker compose logs -f web

# Letzte 100 Zeilen
docker compose logs --tail=100 api
```

### JSON Logs parsen

```bash
# Mit jq formatieren
docker compose logs api 2>&1 | jq

# Nach Request-ID suchen
docker compose logs api 2>&1 | grep "abc-123-xyz"

# Nur Errors
docker compose logs api 2>&1 | jq 'select(.level == "ERROR")'

# Bestimmten User
docker compose logs api 2>&1 | jq 'select(.user_id == "user-123")'
```

### Log-Felder

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `timestamp` | Zeitstempel UTC | `2026-01-26T10:30:00Z` |
| `level` | Log-Level | `INFO`, `WARNING`, `ERROR` |
| `request_id` | Eindeutige Request-ID | `abc-123-xyz` |
| `user_id` | Authentifizierter User | `user-456` |
| `tenant_id` | Tenant des Users | `tenant-789` |
| `path` | Request-Pfad | `/cases/123/validate` |
| `method` | HTTP-Methode | `POST` |
| `status_code` | Response-Status | `200`, `400`, `500` |
| `duration_ms` | Request-Dauer | `45.2` |
| `error_code` | Error-Code (bei Fehlern) | `CASE_INVALID` |

---

## ⚠️ Häufige Fehler & Reaktionen

### 1. Container startet nicht

**Symptom:** `docker compose up` zeigt Exit Code 255

**Ursache:** Meist CRLF-Line-Endings im entrypoint.sh

**Lösung:**
```bash
docker compose down
docker compose build --no-cache
docker compose up
```

### 2. DB Connection Refused

**Symptom:** `/ready` gibt `database: "error: Connection refused"`

**Ursachen:**
- PostgreSQL noch nicht bereit
- Falsche `DATABASE_URL`
- Port-Konflikt

**Lösung:**
```bash
# Prüfen ob DB läuft
docker compose ps postgres

# DB-Logs prüfen
docker compose logs postgres

# Manuell testen
docker exec -it zollpilot-postgres psql -U zollpilot -d zollpilot -c "SELECT 1"
```

### 3. CORS-Fehler im Browser

**Symptom:** `Access to fetch blocked by CORS policy`

**Ursache:** `WEB_ORIGIN` stimmt nicht mit Frontend-URL überein

**Lösung:**
```bash
# In .env prüfen (kein Trailing Slash!)
WEB_ORIGIN=http://localhost:3000

# Container neustarten
docker compose restart api
```

### 4. Session/Cookie nicht gesetzt

**Symptom:** Login erfolgreich, aber danach 401

**Ursachen:**
- `SESSION_COOKIE_SECURE=true` aber HTTP (nicht HTTPS)
- Cookie-Domain stimmt nicht

**Lösung:**
```bash
# Für Development
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_DOMAIN=localhost
```

### 5. Rate Limit erreicht

**Symptom:** `429 RATE_LIMITED`

**Reaktion:**
- Warten bis `Retry-After` Header abgelaufen
- Bei berechtigtem Bedarf: Limit erhöhen

**Limit erhöhen:**
```bash
# In .env
RATE_LIMIT_DEFAULT=120   # War: 60
RATE_LIMIT_PDF=20        # War: 10

# Neustart
docker compose restart api
```

### 6. PDF-Export schlägt fehl

**Symptom:** 500 bei `POST /cases/{id}/pdf`

**Prüfschritte:**
1. Case muss Status `SUBMITTED` haben
2. Snapshot muss existieren
3. Credits müssen >= 1 sein
4. WeasyPrint-Dependencies vorhanden

**Logs prüfen:**
```bash
docker compose logs api 2>&1 | grep "pdf" | tail -20
```

---

## ⚙️ Rate-Limit-Anpassung

### Aktuelle Limits

| Kategorie | Limit | Variable |
|-----------|-------|----------|
| Default | 60/min | `RATE_LIMIT_DEFAULT` |
| PDF Export | 10/min | `RATE_LIMIT_PDF` |
| Validation | 30/min | `RATE_LIMIT_VALIDATION` |
| Fields (Autosave) | 120/min | `RATE_LIMIT_FIELDS` |

### Anpassen

```bash
# In .env bearbeiten
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_PDF=20

# API neustarten
docker compose restart api
```

### Monitoring

```bash
# Rate-Limit-Events in Logs
docker compose logs api 2>&1 | jq 'select(.error_code == "RATE_LIMITED")'
```

---

## 💾 Backup & Restore

### Datenbank-Backup

```bash
# Backup erstellen
docker exec zollpilot-postgres pg_dump -U zollpilot -d zollpilot > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup komprimiert
docker exec zollpilot-postgres pg_dump -U zollpilot -d zollpilot | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Datenbank-Restore

```bash
# ACHTUNG: Überschreibt alle Daten!

# Container stoppen
docker compose stop api web

# Restore
cat backup.sql | docker exec -i zollpilot-postgres psql -U zollpilot -d zollpilot

# Container starten
docker compose start api web
```

### Automatisches Backup (Cron)

```bash
# Crontab bearbeiten
crontab -e

# Tägliches Backup um 3:00 Uhr
0 3 * * * docker exec zollpilot-postgres pg_dump -U zollpilot -d zollpilot | gzip > /backups/zollpilot_$(date +\%Y\%m\%d).sql.gz
```

---

## 🔒 Secrets-Management

### Secrets rotieren

**SESSION_SECRET:**
```bash
# Neuen Secret generieren
openssl rand -hex 32

# In .env aktualisieren
SESSION_SECRET=<neuer-secret>

# API neustarten (invalidiert alle aktiven Sessions!)
docker compose restart api
```

**DB-Passwort:**
```bash
# 1. Neues Passwort setzen
docker exec -it zollpilot-postgres psql -U postgres -c "ALTER USER zollpilot PASSWORD 'neues-passwort';"

# 2. DATABASE_URL in .env aktualisieren
DATABASE_URL=postgresql://zollpilot:neues-passwort@postgres:5432/zollpilot

# 3. Alle Services neustarten
docker compose restart
```

---

## 📊 Monitoring-Endpunkte

| Endpoint | Zweck | Intervall |
|----------|-------|-----------|
| `/health` | Liveness | 10s |
| `/ready` | Readiness | 30s |

### Beispiel: Uptime-Monitoring

```bash
# Health-Check Script
#!/bin/bash
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Contract-Version: 1" http://localhost:8000/health)

if [ "$HEALTH" != "200" ]; then
    echo "ALERT: Health check failed with status $HEALTH"
    # Hier: Alert senden (Slack, E-Mail, etc.)
fi
```

---

## 🆘 Notfall-Prozeduren

### 1. API antwortet nicht

```bash
# 1. Status prüfen
docker compose ps

# 2. Logs prüfen
docker compose logs --tail=50 api

# 3. Container neustarten
docker compose restart api

# 4. Falls weiterhin Probleme: Neu bauen
docker compose up --build api
```

### 2. Datenbank-Probleme

```bash
# 1. DB-Status
docker compose ps postgres

# 2. DB-Logs
docker compose logs postgres

# 3. Verbindung testen
docker exec -it zollpilot-postgres psql -U zollpilot -d zollpilot -c "SELECT 1"

# 4. DB neustarten
docker compose restart postgres
```

### 3. Speicherplatz voll

```bash
# Docker-System aufräumen
docker system prune -f

# Alte Images entfernen
docker image prune -a -f

# Logs begrenzen (docker-compose.yml)
logging:
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 📞 Eskalation

Bei kritischen Problemen:

1. **Logs sichern**: `docker compose logs > incident_$(date +%Y%m%d_%H%M%S).log`
2. **Request-IDs** sammeln von betroffenen Requests
3. **Screenshot** von Fehlermeldungen
4. **Zeitstempel** des ersten Auftretens notieren
5. Team benachrichtigen mit gesammelten Informationen

---

*Stand: Sprint 1 Abschluss*

