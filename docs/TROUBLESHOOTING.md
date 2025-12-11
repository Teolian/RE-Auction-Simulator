# Troubleshooting Guide

## Common Issues

### 1. Frontend shows "Failed to connect to API"

**Symptoms:**
- Red error banner on frontend
- Console error: `Failed to fetch auctions`
- TypeError: `e.map is not a function`

**Solutions:**

**Check if API container is running:**
```bash
docker ps | grep re_auction
# Or
make ps
```

**View API logs:**
```bash
docker logs re_auction_api
# Or
make logs
```

**If API is not running:**
```bash
# Restart services
make restart

# Or rebuild
make rebuild
```

**If API is starting but crashing:**
```bash
# Check database connection
docker logs re_auction_db

# Restart everything
make down
make up
```

---

### 2. Database connection errors

**Symptoms:**
- API logs show: `connection refused` or `database "re_auction" does not exist`

**Solutions:**

```bash
# Check database status
docker exec re_auction_db pg_isready -U re_user

# If not ready, restart database
docker restart re_auction_db

# Wait 10 seconds, then restart API
sleep 10
docker restart re_auction_api
```

**If database won't start:**
```bash
# Remove and recreate
make down
docker volume rm re-auction-simulator_postgres_data
make up
```

---

### 3. "No auctions found" after successful startup

**Symptom:**
- Frontend loads but shows empty state
- No errors in logs

**Solution:**

Seed script may not have run. Run it manually:
```bash
docker exec re_auction_api python seed.py
# Or
make seed
```

Refresh frontend: http://localhost:3000

---

### 4. Frontend build fails: "Module not found: '@/lib/api'"

**Symptom:**
- Docker build error during frontend stage
- `Can't resolve '@/lib/api'`

**Solution:**

This was fixed in commit `96df9f4`. Update your code:
```bash
git pull origin claude/re-auction-mvp-setup-011CV1aJDY3unUGaQ9VVSEMP
make rebuild
```

---

### 5. Port already in use

**Symptoms:**
- Error: `port is already allocated`
- Cannot start containers

**Solutions:**

**Check what's using the port:**
```bash
# Check port 3000 (frontend)
lsof -i :3000

# Check port 8000 (API)
lsof -i :8000

# Check port 5432 (database)
lsof -i :5432
```

**Kill the process or change ports in docker-compose.yml:**
```yaml
services:
  api:
    ports:
      - "8001:8000"  # Use 8001 instead of 8000
```

---

### 6. Docker build is very slow

**Solution:**

This was fixed with `uv` in commit `d56a92f`. If you're still using old version:
```bash
git pull
make rebuild
```

Build should now be 10-100x faster.

---

### 7. CORS errors in browser console

**Symptoms:**
- Console shows: `Access to fetch ... has been blocked by CORS policy`

**Solution:**

Check API CORS settings in `docker-compose.yml`:
```yaml
environment:
  ALLOWED_ORIGINS: http://localhost:3000,http://127.0.0.1:3000
```

Restart API after changes:
```bash
docker restart re_auction_api
```

---

### 8. Frontend shows blank page

**Solutions:**

**Check frontend logs:**
```bash
docker logs re_auction_frontend
```

**Check browser console** (F12) for JavaScript errors.

**Rebuild frontend:**
```bash
docker-compose up -d --build frontend
```

---

## Diagnostic Commands

**Full system check:**
```bash
# Check all containers
make ps

# Check API health
curl http://localhost:8000/healthz

# Check frontend
curl http://localhost:3000

# View all logs
make logs
```

**Database check:**
```bash
# Connect to database
make shell-db

# Inside psql:
\dt                    # List tables
SELECT COUNT(*) FROM auctions;
SELECT COUNT(*) FROM bids;
\q                     # Exit
```

**API shell:**
```bash
make shell-api

# Inside container:
python seed.py         # Re-run seed
pytest test_api.py     # Run tests
exit
```

---

## Complete Reset

If nothing else works, do a complete reset:

```bash
# Stop everything
make down

# Remove all volumes and images
docker system prune -a --volumes

# Rebuild from scratch
make init
```

Wait 15-20 seconds after `make init` before accessing frontend.

---

## Getting Help

If you're still stuck:

1. Check the logs: `make logs`
2. Check GitHub issues: https://github.com/Teolian/RE-Auction-Simulator/issues
3. Provide:
   - Output of `docker ps`
   - Output of `make logs`
   - Browser console errors (F12)
