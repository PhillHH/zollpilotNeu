# Security Baseline

- Authentication uses email + password.
- Passwords are hashed with bcrypt.
- Sessions are stored in the DB and referenced by HTTP-only cookies.
- JWTs are intentionally not used for business logic to keep revocation simple.
- Follow least privilege when adding DB roles.
- No business logic in the frontend.
- All data access goes through the API layer.

