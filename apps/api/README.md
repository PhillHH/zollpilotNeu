# API (FastAPI)

Skeleton service with:

- `/health` endpoint
- `/auth/*` endpoints (register/login/logout/me)
- `/cases/*` endpoints (create/list/get)
- Request-ID middleware
- Central error handling
- DB-backed sessions (cookies)
- Contract enforcement via `X-Contract-Version`
- Prisma client prepared (no business logic)

Run locally (without Docker):

1. `python -m venv .venv`
2. `.venv\\Scripts\\activate`
3. `pip install -r requirements.txt`
4. `uvicorn app.main:app --reload`

