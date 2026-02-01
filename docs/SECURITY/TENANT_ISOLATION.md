# Tenant Isolation Security

> **Sprint 10 – U9**: Security & Tenant Isolation Hardening

---

## Overview

ZollPilot is a multi-tenant application where complete data isolation between tenants is critical. This document describes the security architecture that ensures:

1. **No cross-tenant data access** – A user in Tenant A can never see or modify Tenant B's data
2. **Defense in depth** – Multiple layers of protection, not just one
3. **Fail secure** – On any error, access is denied (not granted)
4. **No information leakage** – Even the existence of other tenants' data is hidden

---

## Architecture Layers

### Layer 1: Authentication (Session)

All authenticated requests require a valid session:

```
Request → Session Cookie → Session Table → User → Membership → Tenant
```

- Sessions are stored server-side in PostgreSQL
- Session tokens are hashed (HMAC-SHA256) before storage
- Cookies are `httponly`, `samesite=lax`, and optionally `secure`
- Invalid/expired sessions return **401 AUTH_REQUIRED**

### Layer 2: Authorization (AuthContext)

Every protected endpoint receives an `AuthContext`:

```python
@dataclass(frozen=True)
class AuthContext:
    user: dict      # Current user
    tenant: dict    # Current tenant (from membership)
    role: Role      # User's role in tenant
```

The tenant_id comes from the database, **never from the client**.

### Layer 3: Tenant Guards (require_tenant_scope)

All database queries for tenant-scoped resources use the tenant guard:

```python
from app.core.tenant_guard import require_tenant_scope, build_tenant_where

# Step 1: Always include tenant_id in WHERE clause
case = await prisma.case.find_first(
    where=build_tenant_where(context.tenant["id"], id=case_id)
)

# Step 2: Verify result with tenant guard (defense in depth)
verified_case = require_tenant_scope(
    resource=case,
    resource_type="Case",
    resource_id=case_id,
    current_tenant_id=context.tenant["id"],
    user_id=context.user["id"],
)
```

### Layer 4: Security Event Logging

All access violations are logged for audit:

```python
from app.core.security_events import log_security_event, SecurityEventType

log_security_event(
    event_type=SecurityEventType.TENANT_SCOPE_VIOLATION,
    user_id=user_id,
    tenant_id=tenant_id,
    resource_type="Case",
    resource_id=case_id,
    details={"reason": "tenant_mismatch"},
)
```

---

## Security Guarantees

### ✅ What IS Protected

| Resource | Protection |
|----------|------------|
| Cases | `WHERE tenant_id = current_tenant_id` |
| Case Fields | Via case ownership |
| Profiles | `WHERE user_id = current_user_id` |
| Purchases | `WHERE tenant_id = current_tenant_id` |
| Credit Balance | `WHERE tenant_id = current_tenant_id` |
| Admin Endpoints | `role = SYSTEM_ADMIN` required |

### ✅ Response Codes

| Scenario | Response |
|----------|----------|
| Not authenticated | 401 AUTH_REQUIRED |
| Resource in other tenant | 404 NOT_FOUND |
| Resource doesn't exist | 404 NOT_FOUND |
| Insufficient role | 403 FORBIDDEN |

**Important:** Cross-tenant access returns **404 (not 403)** to avoid leaking that the resource exists.

---

## Role-Based Access Control

### Role Hierarchy

```
SYSTEM_ADMIN (5)  – Full system access
    ↓
OWNER (4)         – Tenant owner
    ↓
ADMIN (3)         – Tenant administrator
    ↓
EDITOR (2)        – Content editor
    ↓
USER (1)          – Standard user
```

### Admin Endpoint Protection

All `/admin/*` endpoints require `SYSTEM_ADMIN`:

```python
from app.dependencies.auth import require_role
from app.core.rbac import Role

get_admin_context = require_role(Role.SYSTEM_ADMIN)

@router.get("/admin/tenants")
async def list_tenants(context: AuthContext = Depends(get_admin_context)):
    # Only SYSTEM_ADMIN can reach here
    ...
```

---

## Frontend Protection

### Server-Side Auth Checks

Admin routes (`/admin/*`) have server-side guards:

```typescript
// apps/web/src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const session = await fetchSession();
  requireSession(session);  // Redirects to /login if not authenticated
  requireAdmin(session);    // Redirects to /app if not SYSTEM_ADMIN

  return <AdminShell>{children}</AdminShell>;
}
```

User routes (`/app/*`) also have auth guards:

```typescript
// apps/web/src/app/app/layout.tsx
export default async function AppLayout({ children }) {
  const session = await fetchSession();
  requireSession(session);  // Redirects to /login if not authenticated

  return <AppShell>{children}</AppShell>;
}
```

### Navigation Protection

Admin navigation is only shown to users with `can_access_admin` permission:

```typescript
if (session.permissions.can_access_admin) {
  // Show admin navigation
}
```

---

## Security Event Types

| Event | Severity | Description |
|-------|----------|-------------|
| `tenant_scope_violation` | WARNING | Cross-tenant access attempt |
| `role_violation` | WARNING | Unauthorized role access |
| `auth_required` | INFO | Unauthenticated request |
| `admin_access` | INFO | Admin endpoint accessed |
| `login_success` | INFO | Successful authentication |
| `login_failure` | WARNING | Failed authentication |

---

## Testing

### Negative Tests (test_security_isolation.py)

Critical security tests that verify isolation:

```python
def test_user_a_cannot_access_user_b_case():
    """User A CANNOT see User B's case → 404"""

def test_user_a_cannot_list_user_b_cases():
    """User A's list does NOT include User B's cases"""

def test_regular_user_cannot_access_admin_plans():
    """Regular user CANNOT access /admin/plans → 403"""

def test_direct_case_id_access_blocked():
    """Guessing a case ID is blocked"""
```

### Running Security Tests

```bash
cd apps/api
pytest tests/test_security_isolation.py -v
```

---

## Best Practices for Developers

### DO

1. ✅ Always use `build_tenant_where()` for queries
2. ✅ Always call `require_tenant_scope()` on results
3. ✅ Use `AuthContext.tenant["id"]` for tenant ID
4. ✅ Return 404 for cross-tenant access (not 403)
5. ✅ Log security events for violations

### DON'T

1. ❌ Never trust client-provided tenant_id
2. ❌ Never expose tenant existence via error messages
3. ❌ Never skip tenant checks "for performance"
4. ❌ Never use raw queries without tenant filter
5. ❌ Never log PII in security events

---

## Code References

| Component | File | Purpose |
|-----------|------|---------|
| Tenant Guard | `app/core/tenant_guard.py` | Enforce tenant scope |
| Role Guard | `app/core/role_guard.py` | Enforce role access |
| Security Events | `app/core/security_events.py` | Audit logging |
| Auth Dependency | `app/dependencies/auth.py` | Extract AuthContext |
| Security Tests | `tests/test_security_isolation.py` | Negative tests |

---

## Gaps / Future Work

- **No PenTest yet** – Scheduled for production readiness
- **Rate limiting is in-memory** – Needs Redis for production scale
- **No IP-based blocking** – Could add for brute force protection
- **No MFA** – Not implemented in current version

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Overall architecture
- [API_CONTRACTS.md](../API_CONTRACTS.md) – API error codes
- [DECISIONS.md](../DECISIONS.md) – ADR-003 (Session Auth), ADR-007 (Multi-Tenant)
