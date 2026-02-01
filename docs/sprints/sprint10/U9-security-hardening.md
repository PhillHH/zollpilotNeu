# Sprint 10 – U9: Security & Tenant-Isolation Hardening

> **Status**: Abgeschlossen
> **Datum**: 2026-02-01

---

## Zusammenfassung

Implementierung von harten Sicherheits- und Isolationsgarantien für ZollPilot. Das System ist nun produktionsreif mit strikter Mandantentrennung und rollenbasierter Zugriffskontrolle.

---

## Umgesetzte Features

### A) Backend – Tenant Guards

**Neue Module:**

```
apps/api/app/core/
├── tenant_guard.py      # require_tenant_scope(), build_tenant_where()
├── role_guard.py        # require_admin(), require_tenant_admin()
└── security_events.py   # log_security_event(), SecurityEventType
```

**Zentrale Utility: `require_tenant_scope`**

```python
from app.core.tenant_guard import require_tenant_scope, build_tenant_where

# 1. WHERE clause immer mit tenant_id
case = await prisma.case.find_first(
    where=build_tenant_where(context.tenant["id"], id=case_id)
)

# 2. Ergebnis verifizieren (Defense in Depth)
verified = require_tenant_scope(
    resource=case,
    resource_type="Case",
    resource_id=case_id,
    current_tenant_id=context.tenant["id"],
)
```

**Erzwungen für:**
- Cases
- Case Fields
- Profiles (via user_id)
- Credits (via tenant_id)
- Purchases (via tenant_id)

### B) Backend – Role Guards

**Strikte Trennung:**
- USER → Standard-Endpunkte
- ADMIN → Tenant-Admin-Funktionen
- SYSTEM_ADMIN → `/admin/*` Endpunkte

**Explizite 403 bei Rollenverstoß:**

```python
from app.core.role_guard import require_admin

require_admin(
    user_id=context.user["id"],
    tenant_id=context.tenant["id"],
    role=context.role,
    endpoint="/admin/tenants",
)
```

### C) Frontend – Route Protection

**Admin-Routen (`/admin/*`):**
- Server-side auth check
- Redirect zu `/login` wenn nicht authentifiziert
- Redirect zu `/app` wenn kein SYSTEM_ADMIN

**User-Routen (`/app/*`):**
- Server-side auth check
- Redirect zu `/login` wenn nicht authentifiziert

```typescript
// apps/web/src/app/app/layout.tsx
export default async function AppLayout({ children }) {
  const session = await fetchSession();
  requireSession(session);  // → /login
  return <AppShell>{children}</AppShell>;
}
```

### D) Negative Tests

**Neue Testdatei: `test_security_isolation.py`**

| Test | Beschreibung |
|------|--------------|
| `test_user_a_cannot_access_user_b_case` | User A → User B's Case → 404 |
| `test_user_a_cannot_list_user_b_cases` | User A's Liste enthält nicht User B's Cases |
| `test_user_a_cannot_modify_user_b_case` | User A → PATCH User B's Case → 404 |
| `test_user_a_cannot_archive_user_b_case` | User A → Archive User B's Case → 404 |
| `test_user_a_cannot_update_user_b_case_fields` | User A → PUT Fields → 404 |
| `test_regular_user_cannot_access_admin_plans` | User → /admin/plans → 403 |
| `test_regular_user_cannot_access_admin_tenants` | User → /admin/tenants → 403 |
| `test_admin_can_access_admin_endpoints` | SYSTEM_ADMIN → 200 |
| `test_unauthenticated_user_cannot_access_cases` | Keine Session → 401 |
| `test_direct_case_id_access_blocked` | ID-Guessing → 404 |

### E) Security Event Logging

**Event-Typen:**

| Event | Severity | Beschreibung |
|-------|----------|--------------|
| `tenant_scope_violation` | WARNING | Cross-Tenant Zugriffsversuch |
| `role_violation` | WARNING | Unauthorisierter Rollenzugriff |
| `auth_required` | INFO | Nicht authentifizierter Request |
| `admin_access` | INFO | Admin-Endpunkt aufgerufen |
| `login_success` | INFO | Erfolgreiche Authentifizierung |
| `login_failure` | WARNING | Fehlgeschlagene Authentifizierung |

**Keine personenbezogenen Daten in Logs:**
- Nur IDs und Aktionsmetadaten
- Whitelisted Details (reason, role, endpoint)
- DSGVO-konform

### F) Dokumentation

**Neu erstellt:**
- `docs/SECURITY/TENANT_ISOLATION.md`

**Aktualisiert:**
- `docs/ARCHITECTURE.md` (Security Layer)
- `docs/API_CONTRACTS.md` (AuthZ Section)

---

## Dateien

### Neue Dateien

| Pfad | Beschreibung |
|------|--------------|
| `apps/api/app/core/tenant_guard.py` | Tenant Isolation Guards |
| `apps/api/app/core/role_guard.py` | Role-Based Access Guards |
| `apps/api/app/core/security_events.py` | Security Event Logging |
| `apps/api/tests/test_security_isolation.py` | Negative Security Tests |
| `docs/SECURITY/TENANT_ISOLATION.md` | Security Dokumentation |
| `docs/sprints/sprint10/U9-security-hardening.md` | Sprint Log |

### Geänderte Dateien

| Pfad | Änderung |
|------|----------|
| `apps/api/app/dependencies/auth.py` | Security Event Logging integriert |
| `apps/api/app/routes/cases.py` | Tenant Guards angewendet |
| `apps/web/src/app/app/layout.tsx` | Server-side Auth Check |
| `docs/ARCHITECTURE.md` | Security Layer Section |
| `docs/API_CONTRACTS.md` | AuthZ Behavior Section |

---

## Security Guarantees

### ✅ Garantiert

| Garantie | Implementierung |
|----------|-----------------|
| Tenant Isolation enforced at DB & API level | `build_tenant_where()` + `require_tenant_scope()` |
| No cross-tenant data leakage | 404 statt 403 bei fremden Ressourcen |
| Admin endpoints protected | `SYSTEM_ADMIN` role required |
| Security events logged | `log_security_event()` für Audit |
| Frontend routes protected | Server-side redirects |

### 📋 Response Codes

| Szenario | Response |
|----------|----------|
| Nicht authentifiziert | 401 AUTH_REQUIRED |
| Ressource in anderem Tenant | 404 NOT_FOUND |
| Ressource existiert nicht | 404 NOT_FOUND |
| Unzureichende Rolle | 403 FORBIDDEN |

---

## Gaps / Notes

- **Kein PenTest**: Geplant für Produktionsreife
- **Rate Limiting in-memory**: Redis für Production-Scale empfohlen
- **Keine IP-basierte Blockierung**: Könnte für Brute-Force-Schutz hinzugefügt werden
- **Keine MFA**: Nicht in aktueller Version implementiert
- **Kein Session Invalidation bei Rollenänderung**: Sessions bleiben bis Ablauf gültig

---

## Tests ausführen

```bash
cd apps/api
pytest tests/test_security_isolation.py -v
```

---

## Nächste Schritte

1. PenTest vor Production Launch
2. Redis-basiertes Rate Limiting
3. Session Invalidation bei kritischen Änderungen
4. IP-basierte Brute-Force-Protection (optional)
