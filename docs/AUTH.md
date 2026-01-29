# Authentication & Authorization

> **Sprint 2+** – Role-based access control with clear separation of User and Admin contexts.
> **Update Sprint X** – User-Typen (PRIVATE/BUSINESS) und Tenant-Zuordnung.

---

## Overview

ZollPilot implements session-based authentication with HTTP-only cookies and role-based access control (RBAC).

## User-Typen

### PRIVATE vs. BUSINESS

| Typ | Beschreibung | Tenant-Pflicht |
|-----|--------------|----------------|
| `PRIVATE` | Privatnutzer ohne Unternehmensbezug | Nein |
| `BUSINESS` | Unternehmensnutzer | Ja (genau ein Tenant) |

### User-Status

| Status | Beschreibung | Login erlaubt |
|--------|--------------|---------------|
| `ACTIVE` | Aktiver Nutzer | Ja |
| `DISABLED` | Deaktivierter Nutzer | Nein |

### Tenant-Zuordnung

- **PRIVATE User**: Können ohne Tenant-Membership existieren (oder mit persönlichem Tenant)
- **BUSINESS User**: Müssen genau einem Tenant zugeordnet sein
- Validierung erfolgt bei der Registrierung und Tenant-Zuweisung

## Role Model

### Hierarchy (highest to lowest)

| Role | Level | Description | Access |
|------|-------|-------------|--------|
| `SYSTEM_ADMIN` | 4 | ZollPilot internal | Full system access (plans, all tenants) |
| `OWNER` | 3 | Tenant owner | Full access within their tenant |
| `ADMIN` | 2 | Tenant administrator | Administrative access within tenant |
| `USER` | 1 | Standard user | Limited access within tenant |

### Key Distinctions

- **SYSTEM_ADMIN**: Can access `/admin/*` endpoints (plans, all tenants, credits)
- **OWNER/ADMIN**: Tenant-level administrators, NO access to system admin
- **USER**: Standard tenant member

## Access Matrix

| Endpoint | USER | ADMIN | OWNER | SYSTEM_ADMIN |
|----------|------|-------|-------|--------------|
| `/cases/*` | ✓ | ✓ | ✓ | ✓ |
| `/billing/me` | ✓ | ✓ | ✓ | ✓ |
| `/procedures/*` | ✓ | ✓ | ✓ | ✓ |
| `/admin/plans` | ✗ | ✗ | ✗ | ✓ |
| `/admin/tenants` | ✗ | ✗ | ✗ | ✓ |
| `/admin/tenants/{id}/credits/*` | ✗ | ✗ | ✗ | ✓ |

## Authentication Flow

```
1. POST /auth/register or /auth/login
   ↓
2. API validates credentials
   ↓
3. Creates session in DB (token_hash)
   ↓
4. Sets HTTP-only session cookie
   ↓
5. Client includes cookie in subsequent requests
   ↓
6. SessionMiddleware validates session
   ↓
7. AuthContext populated with user/tenant/role
```

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 401 | Unauthorized | Not authenticated (no/invalid session) |
| 403 | Forbidden | Authenticated but insufficient permissions |

## Frontend Guards

### Server-Side (Layout)

```tsx
// /admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await fetchSession();
  requireSession(session);  // 401 → redirect to /login
  requireAdmin(session);    // 403 → redirect to /app
  return <AdminShell>{children}</AdminShell>;
}
```

### Client-Side (Component)

```tsx
// AdminGuard component
<AdminGuard>
  <AdminOnlyContent />
</AdminGuard>
```

Shows friendly 403 message instead of crashing.

## API Response Format

### 401 Unauthorized

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentifizierung erforderlich."
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Du bist eingeloggt, hast aber keine Berechtigung für diese Aktion.",
    "required_role": "SYSTEM_ADMIN",
    "your_role": "OWNER"
  }
}
```

## Demo Admin Access

For development/testing, register with `demo_admin: true`:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Contract-Version: 1" \
  -d '{"email": "admin@example.com", "password": "secret", "demo_admin": true}'
```

This creates a user with `SYSTEM_ADMIN` role.

**WARNING**: Do NOT use in production. Disable or remove this option before deployment.

## Session Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_SECRET` | change-me | Secret for token hashing (MUST change in prod) |
| `SESSION_TTL_MINUTES` | 120 | Session lifetime |
| `SESSION_COOKIE_NAME` | zollpilot_session | Cookie name |
| `SESSION_COOKIE_SECURE` | false | HTTPS only (true in prod) |
| `SESSION_COOKIE_DOMAIN` | localhost | Cookie domain |

## Logging

Access denials are logged with:

```json
{
  "level": "WARNING",
  "message": "Access denied: insufficient role",
  "request_id": "abc-123",
  "user_id": "user-456",
  "user_role": "OWNER",
  "required_role": "SYSTEM_ADMIN",
  "endpoint": "/admin/plans"
}
```

## Related Files

| File | Purpose |
|------|---------|
| `apps/api/app/core/rbac.py` | Role enum and hierarchy |
| `apps/api/app/dependencies/auth.py` | Auth context and role guards |
| `apps/api/app/routes/auth.py` | Auth endpoints (register, login, me) |
| `apps/api/app/routes/admin.py` | Admin endpoints (SYSTEM_ADMIN only) |
| `apps/web/src/app/lib/auth.ts` | Frontend auth utilities |
| `apps/web/src/app/admin/layout.tsx` | Admin route guard |
| `apps/web/src/app/components/guards/AdminGuard.tsx` | Client-side admin guard |
