# Architecture

## Layers

1. **Database (PostgreSQL + Prisma)**
   - Owns schema and migrations
   - No business logic

2. **API (FastAPI)**
   - Owns business logic and orchestration
   - Exposes HTTP interfaces
   - No UI responsibilities

3. **Frontend (Next.js)**
   - Owns presentation and user experience
   - No business logic

## Boundaries

- The API is strictly separated from the frontend to keep the backend reusable
  for future mobile clients.
- Shared contracts live in `packages/shared` to keep API/FE alignment explicit.
- Frontend talks only to the API, never directly to the database.

## Auth Flow (text)

1. Client sends `POST /auth/register` or `POST /auth/login`.
2. API validates credentials and creates a DB session.
3. API sets an HTTP-only session cookie.
4. Client uses the cookie for subsequent requests.
5. API resolves the session and enforces RBAC.

## RBAC

- RBAC is enforced exclusively in the backend.
- Role order is explicit: OWNER > ADMIN > USER.

## API Contracts

- Contract versioning is enforced via `X-Contract-Version`.
- Standard response shapes are documented in `docs/API_CONTRACTS.md`.

