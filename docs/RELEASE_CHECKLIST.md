# Release Checklist

Use this checklist before every production release. Do not skip items.

---

## 📋 Pre-Release Checklist

### 1. Code Quality

- [ ] All tests passing locally
  ```bash
  # Backend
  cd apps/api && pytest -v
  
  # Frontend
  cd apps/web && npm test -- --run
  ```

- [ ] Lint passes without errors
  ```bash
  # Backend
  cd apps/api && ruff check app/ tests/
  
  # Frontend
  cd apps/web && npm run lint
  ```

- [ ] TypeScript compiles without errors
  ```bash
  cd apps/web && npx tsc --noEmit
  ```

- [ ] No new linter warnings introduced

### 2. CI/CD

- [ ] CI pipeline is green on `main` branch
- [ ] All PR checks passed
- [ ] No pending merge conflicts
- [ ] Branch is up-to-date with `main`

### 3. Database

- [ ] All migrations are committed
- [ ] Migration files have been reviewed
- [ ] No pending schema changes
- [ ] Test migration rollback works (if applicable)
  ```bash
  # Check migration status
  npx prisma migrate status --schema=prisma/schema.prisma
  ```

### 4. Documentation

- [ ] API changes documented in `docs/API_CONTRACTS.md`
- [ ] New features documented in `docs/ARCHITECTURE.md`
- [ ] Environment variables documented in `docs/SETUP.md`
- [ ] Sprint log created (`docs/sprints/sprint1/P1pXX.md`)
- [ ] CHANGELOG updated (if maintained)

### 5. Configuration

- [ ] `.env.example` updated if new variables added
- [ ] No hardcoded secrets in code
- [ ] Production environment variables set correctly
- [ ] `SESSION_SECRET` is strong (32+ chars)
- [ ] `SESSION_COOKIE_SECURE=true` for production

### 6. Build Verification

- [ ] Docker images build successfully
  ```bash
  docker compose build
  ```

- [ ] Application starts without errors
  ```bash
  docker compose up
  ```

- [ ] Health check passes
  ```bash
  curl -H "X-Contract-Version: 1" http://localhost:8000/health
  curl -H "X-Contract-Version: 1" http://localhost:8000/ready
  ```

---

## 🚀 Release Process

### Step 1: Final Verification

```bash
# Pull latest
git checkout main
git pull origin main

# Run full test suite
cd apps/api && pytest -v
cd ../web && npm test -- --run

# Build images
docker compose build --no-cache
```

### Step 2: Create Release Tag

```bash
# Format: vMAJOR.MINOR.PATCH
git tag -a v1.0.0 -m "Release v1.0.0: Description"
git push origin v1.0.0
```

### Step 3: Deploy

**For Docker Compose:**
```bash
docker compose pull
docker compose down
docker compose up -d
```

**For PaaS (Render, Fly, etc.):**
- Push triggers automatic deployment
- Or trigger manual deploy in dashboard

### Step 4: Post-Deploy Verification

- [ ] Health endpoint returns 200
- [ ] Ready endpoint returns 200 (DB connected)
- [ ] Frontend loads without errors
- [ ] Login/Register works
- [ ] Create case works
- [ ] Wizard renders correctly
- [ ] Submit case works
- [ ] PDF export works (if credits available)

---

## 🔥 Rollback Procedure

### If issues are discovered:

1. **Immediate**: Revert to previous Docker image
   ```bash
   docker compose down
   docker compose up -d --no-build
   # Or pull previous tag
   ```

2. **Database**: If migration caused issues
   ```bash
   # Rollback last migration (CAREFUL!)
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

3. **Git**: Revert the commit
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

---

## 📊 Release Notes Template

```markdown
## Version X.Y.Z (YYYY-MM-DD)

### Features
- Feature 1: Description
- Feature 2: Description

### Bug Fixes
- Fix 1: Description
- Fix 2: Description

### Breaking Changes
- Change 1: Migration required

### Dependencies
- Updated X from 1.0 to 1.1

### Known Issues
- Issue 1: Workaround description
```

---

## 🔐 Security Release

For security-related releases:

- [ ] Vulnerability disclosed responsibly
- [ ] Fix reviewed by second pair of eyes
- [ ] No detailed vulnerability info in public commit message
- [ ] Update dependencies if CVE-related
- [ ] Post-release: notify affected users (if applicable)

---

## 📅 Release Schedule

**Recommended cadence:**
- **Patches** (bug fixes): As needed
- **Minor** (features): Weekly/Bi-weekly
- **Major** (breaking): Quarterly with notice

**Release Windows:**
- Preferred: Tuesday - Thursday, 10:00 - 16:00 UTC
- Avoid: Fridays, weekends, holidays
- Allow 2h for monitoring after deploy

---

## 📞 Escalation

If release issues occur:

1. **Check logs**: `docker logs zollpilot-api -f`
2. **Check health**: `curl http://localhost:8000/ready`
3. **Rollback** if critical (see above)
4. **Notify** team in #releases channel
5. **Document** incident in post-mortem

