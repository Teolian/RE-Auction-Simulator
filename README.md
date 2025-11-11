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

## Local Setup

### Option 1: Docker (Recommended)

**Prerequisites**: Docker and Docker Compose

```bash
# Start all services (PostgreSQL + API + Frontend)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The seed script runs automatically on first start. Access:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Development mode** (with hot-reload for API):
```bash
docker-compose -f docker-compose.dev.yml up
```

### Option 2: Manual Setup

**Prerequisites**: Python 3.11+, Node.js 18+, PostgreSQL 14+

#### 1. Setup Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

#### 2. Backend
```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
createdb re_auction
# Or use the SQL migration directly:
# psql re_auction < ../../db/migrations/001_initial_schema.sql

# Seed sample data (2 auctions, 3 lots, 8 bids)
python seed.py

# Run API
uvicorn main:app --reload --port 8000
```

#### 3. Frontend
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

## Deployment
- **Frontend**: Vercel
- **Backend**: Railway/Render
- **DB**: Neon PostgreSQL

## License
MIT
