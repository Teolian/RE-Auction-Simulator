.PHONY: help build up down logs clean test seed restart health fix

help:
	@echo "RE-Auction Simulator - Makefile Commands"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make up          - Start all services (db + api + frontend)"
	@echo "  make down        - Stop all services"
	@echo "  make build       - Build Docker images"
	@echo "  make rebuild     - Rebuild images and start"
	@echo "  make logs        - View logs from all services"
	@echo "  make restart     - Restart all services"
	@echo "  make clean       - Stop and remove all containers, volumes, images"
	@echo ""
	@echo "Development:"
	@echo "  make dev         - Start in development mode (with hot-reload)"
	@echo "  make seed        - Run seed script"
	@echo "  make shell-api   - Open shell in API container"
	@echo "  make shell-db    - Open psql in database"
	@echo ""
	@echo "Testing:"
	@echo "  make test        - Run all tests"
	@echo "  make test-api    - Run API tests"
	@echo "  make test-engine - Run clearing engine tests"
	@echo ""
	@echo "Status:"
	@echo "  make ps          - Show running containers"
	@echo "  make health      - Check system health"
	@echo "  make fix         - Quick fix for common issues"

# Main commands
up:
	docker-compose up -d
	@echo ""
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "API:      http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "Run 'make logs' to view logs"

down:
	docker-compose down

build:
	docker-compose build

rebuild:
	docker-compose up -d --build

logs:
	docker-compose logs -f

restart:
	docker-compose restart

clean:
	docker-compose down -v --rmi all
	@echo "All containers, volumes, and images removed"

# Development
dev:
	docker-compose -f docker-compose.dev.yml up

seed:
	docker-compose exec api python seed.py

shell-api:
	docker-compose exec api bash

shell-db:
	docker-compose exec db psql -U re_user -d re_auction

# Testing
test: test-engine test-api

test-api:
	docker-compose exec api pytest test_api.py -v

test-engine:
	docker-compose exec api pytest /app/engine/tests/test_clearing.py -v

# Status
ps:
	docker-compose ps

health:
	@bash scripts/check-health.sh

fix:
	@bash scripts/quick-fix.sh

# First time setup
init: build up
	@echo ""
	@echo "Waiting for services to start..."
	@sleep 10
	@echo ""
	@echo "Setup complete!"
	@echo "Frontend: http://localhost:3000"
	@echo "API:      http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
