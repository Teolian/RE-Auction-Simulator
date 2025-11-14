# RE-Auction Simulator (Standalone MVP)

Renewable Energy auction simulator with sealed-bid clearing, RBAC, and interview management.

## Goal
Professional B2B auction platform for PV/wind generation with transparent clearing mechanics (uniform-price / pay-as-bid), audit trail, and post-auction interview coordination (面談).

## Stack
- **Frontend**: Next.js (TypeScript), shadcn/ui + Tailwind, TanStack Query/Table, ECharts
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy, Alembic, pydantic v2
- **Engine**: Python clearing module (uniform-price, pay-as-bid)
- **DB**: PostgreSQL

## Project Structure
```
repo/
  apps/
    frontend/    # Next.js + TypeScript + shadcn/ui
    api/         # FastAPI + SQLAlchemy + Alembic
    engine/      # Python clearing module
  db/
    migrations/  # SQL schema migrations
  .env.example   # Environment template
```

## Quick Start

**Prerequisites**: Docker and Docker Compose

```bash
# First time setup (builds and starts all services)
make init

# Or manually
docker-compose up -d
```

Wait 10-15 seconds for services to start. Access:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Useful commands:**
```bash
make help      # Show all available commands
make up        # Start services
make down      # Stop services
make logs      # View logs
make test      # Run tests
make clean     # Clean everything
```

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## Local Setup

### Option 1: Docker (Recommended)

See Quick Start above or [QUICKSTART.md](QUICKSTART.md).

**Development mode** (with hot-reload):
```bash
make dev
```

### Option 2: Local Development (Without Docker)

**Prerequisites**: Python 3.11+, Node.js 18+, PostgreSQL 14+

#### Quick Start with Scripts

We provide convenient scripts for local development:

```bash
# Start all services
./start-local.sh

# Check status
./status-local.sh

# Stop all services
./stop-local.sh
```

Access:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

**Logs:**
- API: `tail -f /tmp/re-auction-api.log`
- Frontend: `tail -f /tmp/re-auction-frontend.log`

#### Manual Setup

If you prefer manual control:

##### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with DATABASE_URL pointing to localhost
```

##### 2. Database
```bash
# Start PostgreSQL
service postgresql start

# Create user and database
su - postgres -c "createuser re_user"
su - postgres -c "createdb -O re_user re_auction"
su - postgres -c "psql -c \"ALTER USER re_user WITH PASSWORD 're_password';\""

# Apply migrations
PGPASSWORD=re_password psql -h localhost -U re_user -d re_auction -f db/migrations/001_initial_schema.sql
```

##### 3. Backend
```bash
cd apps/api

# Install dependencies
uv pip install --system -r requirements.txt

# Seed sample data (2 auctions, 3 lots, 8 bids)
export DATABASE_URL="postgresql://re_user:re_password@localhost:5432/re_auction"
python seed.py

# Run API
export PYTHONPATH="/home/user/RE-Auction-Simulator/apps/engine:$PYTHONPATH"
uvicorn main:app --reload --port 8000
```

##### 4. Frontend
```bash
cd apps/frontend
npm install
npm run dev
# Open http://localhost:3000
```

#### 4. Run Tests
```bash
# Clearing engine tests
cd apps/engine
python -m pytest tests/

# API tests
cd apps/api
pytest test_api.py
```

## Demo Script (2-3 min)

The seeded data includes 2 auctions ready for demo:

**Quick Demo:**
1. Open http://localhost:3000
2. Click on "Auction 1" (Kanto, Uniform Price)
3. Review lots (2 lots, 350 MWh total supply)
4. Click "Lock Auction" to close bidding window
5. Click "Run Clearing" to execute uniform-price algorithm
6. View clearing report:
   - Cleared price (uniform for all winners)
   - Supply/Demand curve (ECharts visualization)
   - Match details table
7. Inspect matches and cleared volumes

**Full Flow:**
1. View auction list with status badges
2. Open auction detail page
3. Review lots and sealed bids (hidden until clearing)
4. Lock auction when bidding window closes
5. Run clearing algorithm (uniform-price or pay-as-bid)
6. Analyze results:
   - S/D curve intersection shows clearing price
   - Winners table shows matched lots/bids
   - Audit trail for transparency
7. (Optional) Create interviews (面談) for winner pairs via API

## API Endpoints
- `POST /api/auctions` - Create auction
- `POST /api/lots` - Create lot
- `POST /api/bids` - Submit bid
- `POST /api/auctions/{id}/lock` - Close bidding window
- `POST /api/auctions/{id}/clear` - Run clearing
- `GET /api/auctions/{id}/report` - View clearing report
- `POST /api/interviews` - Create interview
- `GET /healthz` - Health check

## Troubleshooting

If you encounter issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

Quick fixes:
- Frontend error: Wait 15s for services to start, then refresh
- No data: Run `make seed`
- Reset everything: `make clean && make init`

## Deployment
- **Frontend**: Vercel
- **Backend**: Railway/Render
- **DB**: Neon PostgreSQL

## License
MIT
