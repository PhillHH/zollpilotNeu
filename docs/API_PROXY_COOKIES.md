# API Proxy Cookie Handling

> **Status**: Fix implementiert Januar 2026
> **Betrifft**: `apps/web/src/app/api/backend/[...path]/route.ts`

---

## Problem-Zusammenfassung

Bei der Weiterleitung von API-Responses durch den Next.js Proxy gehen `Set-Cookie` Header verloren. Das führt dazu, dass Session-Cookies nach Login nicht im Browser gespeichert werden.

**Symptome:**
- Login gibt HTTP 200 zurück
- Nachfolgende Requests schlagen mit 401 fehl
- Im Browser (DevTools → Application → Cookies) ist kein `zollpilot_session` Cookie vorhanden

---

## Root Cause

Die Web Fetch API behandelt `Set-Cookie` als **"forbidden response-header name"**. Das bedeutet:

### Das Problem mit `Headers.forEach()`

```typescript
// FALSCH - Set-Cookie wird übersprungen oder falsch verarbeitet!
upstreamResponse.headers.forEach((value, key) => {
  response.headers.set(key, value);
});
```

**Warum das nicht funktioniert:**

1. `Headers.forEach()` **überspringt den Set-Cookie Header** in manchen Node.js Versionen komplett
2. Wenn mehrere Set-Cookie Header existieren, werden sie zu einem **einzelnen String kombiniert** (ungültig laut HTTP-Spec)
3. `headers.set()` **überschreibt** vorhandene Header statt sie hinzuzufügen

### Technischer Hintergrund

Die Fetch API Spezifikation definiert `Set-Cookie` als speziellen Header:
- Er darf mehrfach in einer Response vorkommen (einmal pro Cookie)
- `headers.get("set-cookie")` kombiniert alle Werte mit `, ` (Komma) - das ist für Cookies ungültig
- `headers.forEach()` liefert inkonsistente Ergebnisse je nach Runtime

---

## Die Lösung

### Korrekter Code

```typescript
// 1. Alle anderen Header normal kopieren, aber Set-Cookie auslassen
upstreamResponse.headers.forEach((value, key) => {
  const lowerKey = key.toLowerCase();
  if (!SKIP_RESPONSE_HEADERS.has(lowerKey) && lowerKey !== "set-cookie") {
    response.headers.set(key, value);
  }
});

// 2. Set-Cookie explizit mit getSetCookie() behandeln
const setCookieHeaders = upstreamResponse.headers.getSetCookie();
if (setCookieHeaders && setCookieHeaders.length > 0) {
  for (const cookie of setCookieHeaders) {
    // append() nicht set() - jeder Set-Cookie muss ein separater Header sein!
    response.headers.append("Set-Cookie", cookie);
  }
}
```

### Wichtige Punkte

| Methode | Verwendung | Warum |
|---------|------------|-------|
| `getSetCookie()` | Set-Cookie Header lesen | Gibt Array zurück, kein kombinierter String |
| `append()` | Set-Cookie Header schreiben | Fügt hinzu statt zu überschreiben |
| `set()` | Alle anderen Header | Ein Wert pro Header-Name |

### Verfügbarkeit von `getSetCookie()`

- **Node.js**: Ab Version 18.14.1
- **Browser**: Alle modernen Browser
- **Next.js**: Ab 14.x (nutzt Node.js 18+)

---

## Checkliste für zukünftige Änderungen

### Wenn du den API Proxy änderst:

- [ ] **Niemals `forEach()` für Set-Cookie verwenden**
- [ ] **Immer `getSetCookie()` + `append()` für Cookies**
- [ ] **Nach Änderungen testen:** Login → Cookie im Browser prüfen → Folge-Request

### Wenn du Cookie-Handling änderst:

- [ ] **SameSite muss `Lax` sein** (nicht `Strict`) für Cross-Origin Requests
- [ ] **Domain darf nicht `localhost` sein** - wird automatisch zu `null` konvertiert
- [ ] **Path muss `/` sein** für alle Routes

### Wenn du auf neuere Next.js Version upgradest:

- [ ] **Prüfe ob `getSetCookie()` noch unterstützt wird**
- [ ] **Teste den kompletten Auth-Flow nach dem Upgrade**
- [ ] **Prüfe die Next.js Release Notes auf Cookie-Änderungen**

---

## Debugging

### Cookie kommt nicht beim Browser an?

1. **Backend-Response prüfen:**
   ```bash
   curl -v -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.de","password":"password"}'
   ```
   Suche nach `Set-Cookie` Header in der Response.

2. **Proxy-Response prüfen:**
   ```bash
   curl -v -X POST http://localhost:3000/api/backend/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.de","password":"password"}'
   ```
   Vergleiche den `Set-Cookie` Header mit dem Backend.

3. **Temporäres Logging hinzufügen:**
   ```typescript
   // In route.ts nach getSetCookie()
   console.log("Set-Cookie headers from upstream:", setCookieHeaders);
   ```

### Cookie wird gesendet aber Session invalid?

1. **Prüfe SESSION_SECRET** - muss in Backend und Web identisch sein
2. **Prüfe Cookie-Domain** - `localhost` vs `127.0.0.1` Problem
3. **Prüfe Session-Expiry** - Standard ist 120 Minuten

---

## Header die NICHT weitergeleitet werden dürfen

```typescript
const SKIP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",  // Wird vom Runtime gehandhabt
  "content-encoding",   // Body ist bereits dekodiert
  "content-length",     // Wird neu berechnet
]);
```

**Warum:**
- `transfer-encoding`: Next.js/Node.js handhabt Chunked Encoding selbst
- `content-encoding`: Der `fetch()` dekodiert gzip/br automatisch
- `content-length`: Muss zur neuen Response-Größe passen

---

## Architektur-Übersicht

```
Browser (localhost:1887)
    │
    │ fetch('/api/backend/auth/login', { credentials: 'include' })
    ▼
Next.js API Route Handler
    │
    │ fetch(API_BASE_URL + '/auth/login')
    ▼
FastAPI Backend (Docker: http://api:8000)
    │
    │ Response mit Set-Cookie: zollpilot_session=abc123...
    ▼
Next.js API Route Handler
    │
    │ getSetCookie() → ["zollpilot_session=abc123..."]
    │ response.headers.append("Set-Cookie", cookie)
    ▼
Browser
    │
    └─→ Cookie wird gespeichert ✓
```

---

## Verwandte Dateien

| Datei | Zweck |
|-------|-------|
| `apps/web/src/app/api/backend/[...path]/route.ts` | API Proxy mit Cookie-Handling |
| `apps/web/src/app/lib/api/client.ts` | API Client (nutzt Proxy mit `credentials: include`) |
| `apps/api/app/routes/auth.py` | Backend Auth Endpoints |
| `apps/api/app/middleware/session.py` | Session Middleware |
| `apps/api/app/core/config.py` | Cookie-Konfiguration |
| `docs/AUTH.md` | Allgemeine Auth-Dokumentation |

---

## Referenzen

- [MDN: Headers.getSetCookie()](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getSetCookie)
- [Node.js Headers API](https://nodejs.org/api/globals.html#class-headers)
- [Fetch Standard: Forbidden Response Header Names](https://fetch.spec.whatwg.org/#forbidden-response-header-name)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Zusätzliche Bugfixes (Januar 2026)

### Config Validation Bug: SESSION_SECRET "change-me" Check

**Problem:** Der Check für das Default-Secret `"change-me"` wurde nie ausgeführt, weil der Längen-Check zuerst kam.

**Datei:** `apps/api/app/core/config.py`

**Ursache:**
```python
# FALSCH - "change-me" hat nur 9 Zeichen, also greift len() < 32 zuerst!
if not settings.session_secret:
    errors.append("SESSION_SECRET is required")
elif len(settings.session_secret) < 32:  # <- wird bei "change-me" ausgelöst
    warnings.append("...")
elif settings.session_secret == "change-me":  # <- wird NIE erreicht!
    ...
```

**Lösung:** Den `"change-me"` Check VOR den Längen-Check setzen:
```python
if not settings.session_secret:
    errors.append("SESSION_SECRET is required")
elif settings.session_secret == "change-me":  # <- Jetzt zuerst!
    if settings.environment == "production":
        errors.append("SESSION_SECRET must not be 'change-me' in production")
    else:
        warnings.append("SESSION_SECRET is using default value")
elif len(settings.session_secret) < 32:
    warnings.append("...")
```

**Test:** `pytest tests/test_config.py::TestValidateSettings::test_default_session_secret_in_production_raises_error`
