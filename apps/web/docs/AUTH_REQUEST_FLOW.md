# Auth Request Flow Documentation

## Overview

This document explains the authentication request flow in ZollPilot, covering how cookies are handled between the browser, Next.js server, and backend API.

## Architecture

```
Browser (localhost:3000)
    │
    │ Server Actions / Fetch
    ▼
Next.js Server (localhost:3000)
    │
    │ Direct HTTP with Cookie forwarding
    ▼
Backend API (localhost:8000)
```

## Authentication Flow

### Login Flow

1. **User submits login form** (`AuthForm.tsx`)
2. **Browser calls `apiRequest("/auth/login", ...)`**
   - Since running in browser (`typeof window !== "undefined"`), calls `backendJson()` server action
3. **Server action executes on Next.js server**
   - Makes direct HTTP request to `http://localhost:8000/auth/login`
   - Backend validates credentials and returns `Set-Cookie` header
4. **`applySetCookies()` stores cookie in Next.js cookie store**
   - Uses `cookies().set()` to store the session cookie
   - Next.js automatically sends `Set-Cookie` header back to browser
5. **Browser stores cookie** and redirects to `/app`

### Subsequent Authenticated Requests

For all authenticated API calls (from client components):

1. **Client component calls API** (e.g., `cases.list()`)
2. **`apiRequest()` detects browser context**
   - Calls `backendJson()` server action
3. **Server action reads cookies**
   - `buildCookieHeader()` uses `cookies().getAll()` to get all cookies
   - These are cookies sent by the browser in the server action request
4. **Server action forwards cookies to backend**
   - Cookie header is included in the direct HTTP request to backend
5. **Backend validates session and returns data**

### Server-Side Auth Checks (e.g., AdminLayout)

1. **Server Component calls `fetchSession()`**
2. **`fetchSession()` reads cookie from Next.js cookie store**
   - Uses `await cookies()` to get session cookie
3. **Calls `apiRequest()` with explicit Cookie header**
4. **Since server-side, `apiRequest()` uses `apiFetch()`**
   - Makes direct HTTP request to backend with Cookie header

## Cookie Handling Rules

### Where Cookies Are Read

| Context | Function | How Cookies Are Read |
|---------|----------|---------------------|
| Client Component | `apiRequest()` | Calls `backendJson()` server action |
| Server Action | `buildCookieHeader()` | `cookies().getAll()` |
| Server Component | `fetchSession()` | `cookies().get()` then explicit header |

### Where Cookies Are Written

| Context | Trigger | How Cookies Are Set |
|---------|---------|---------------------|
| Login | Backend returns `Set-Cookie` | `applySetCookies()` → `cookies().set()` |
| Session Refresh | Backend returns `Set-Cookie` | `applySetCookies()` → `cookies().set()` |

### Cookie Requirements

- **Name**: `zollpilot_session` (configurable via `SESSION_COOKIE_NAME`)
- **HttpOnly**: Yes (set by backend)
- **Secure**: Configurable via `SESSION_COOKIE_SECURE`
- **SameSite**: Lax (must be Lax for server actions to receive cookies)
- **Domain**: `localhost` (configurable via `SESSION_COOKIE_DOMAIN`)

## Proxy Route (`/api/backend/[...path]`)

The proxy route exists but is **not used** by the main application. All API calls go through server actions for better cookie handling.

The proxy:
- Forwards all headers including Cookie via `new Headers(request.headers)`
- Forwards Set-Cookie headers from backend response
- Adds `X-Contract-Version` header if not present

## Common Issues and Solutions

### Issue: 401 AUTH_REQUIRED despite valid session

**Cause**: Code calling incorrect endpoint or not forwarding cookies.

**Solution**:
- Use `apiRequest()` instead of direct `fetch()`
- Ensure all client-side fetches use server actions (automatic via `apiRequest()`)

### Issue: AdminGuard not detecting auth

**Fixed**: AdminGuard was calling `/api/auth/me` directly (non-existent route). Now uses `apiRequest("/auth/me")` which properly forwards cookies via server action.

### Issue: Cookies not persisting after login

**Check**:
1. Backend returns `Set-Cookie` header
2. `applySetCookies()` is called (check for errors)
3. Cookie domain matches request domain
4. Cookie SameSite allows server action requests

## Why This Design?

1. **Security**: Server actions keep API_BASE_URL server-side only
2. **Cookie Handling**: Next.js cookies() API handles cookie synchronization between server and browser
3. **Simplicity**: Single code path for all API calls via `apiRequest()`
4. **Type Safety**: Response types are centralized in client.ts

## Preventing Future Issues

1. **Always use `apiRequest()`** - Never use direct `fetch()` for backend calls
2. **Test auth flows** - Run `tests/auth-cookie.test.ts` after changes
3. **Check Set-Cookie handling** - Verify `applySetCookies()` handles all cookie attributes
4. **Avoid browser-only fetch** - If you must use fetch, use the proxy route with `credentials: "include"`
