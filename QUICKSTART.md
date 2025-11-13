# RE-Auction Simulator - Quick Start

## Prerequisites
- Docker
- Docker Compose

## Fast Setup (Recommended)

```bash
# First time setup - builds and starts everything
make init

# Or manually:
docker-compose up -d
```

Wait 10-15 seconds for services to start, then access:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Useful Commands

```bash
# View all available commands
make help

# Start services
make up

# Stop services
make down

# View logs
make logs

# Restart services
make restart

# Run tests
make test

# Open database shell
make shell-db

# Check API health
make health
```

## Development Mode

For hot-reload during development:

```bash
make dev
```

## Troubleshooting

**If you see errors on the frontend:**
1. Wait 10-15 seconds for all services to fully start
2. Check API is running: `curl http://localhost:8000/healthz`
3. View logs: `make logs`

**Common issues:**
- **"Failed to connect to API"** - API not ready yet, wait or run `make restart`
- **"No auctions found"** - Run seed script: `make seed`
- **Port already in use** - Stop other services or change ports

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

**Complete reset:**
```bash
make clean
make init
```

## Manual Setup (Without Docker)

See main [README.md](README.md) for manual installation instructions.
