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

**If containers fail to start:**
```bash
# Clean everything and rebuild
make clean
make init
```

**Check container status:**
```bash
make ps
docker-compose logs api
docker-compose logs frontend
docker-compose logs db
```

**Reset database:**
```bash
make down
docker volume rm re-auction-simulator_postgres_data
make up
```

## Manual Setup (Without Docker)

See main [README.md](README.md) for manual installation instructions.
