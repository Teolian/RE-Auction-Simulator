#!/bin/bash

# RE-Auction Simulator - Local Development Start Script
# This script starts the application without Docker

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RE-Auction Simulator - Local Start${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}[1/5] Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${YELLOW}PostgreSQL not running. Starting...${NC}"
    service postgresql start
    sleep 2

    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${RED}Failed to start PostgreSQL${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Check database exists
echo -e "${YELLOW}[2/5] Checking database...${NC}"
if ! PGPASSWORD=re_password psql -h localhost -U re_user -d re_auction -c "SELECT 1" >/dev/null 2>&1; then
    echo -e "${YELLOW}Database not found. Please run database setup first.${NC}"
    echo -e "${YELLOW}Run: PGPASSWORD=re_password psql -h localhost -U re_user -d re_auction -f db/migrations/001_initial_schema.sql${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database is ready${NC}"
echo ""

# Start Backend API
echo -e "${YELLOW}[3/5] Starting Backend API...${NC}"
cd apps/api
export DATABASE_URL="postgresql://re_user:re_password@localhost:5432/re_auction"
export PYTHONPATH="/home/user/RE-Auction-Simulator/apps/engine:$PYTHONPATH"
export TZ="Asia/Tokyo"

# Kill existing API process if running
pkill -f "uvicorn main:app" 2>/dev/null || true

nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > /tmp/re-auction-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/re-auction-api.pid

sleep 3

# Check if API started
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API started (PID: $API_PID)${NC}"
else
    echo -e "${RED}Failed to start Backend API. Check /tmp/re-auction-api.log${NC}"
    tail -20 /tmp/re-auction-api.log
    exit 1
fi
echo ""

# Start Frontend
echo -e "${YELLOW}[4/5] Starting Frontend...${NC}"
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi

# Kill existing frontend process if running
pkill -f "next dev" 2>/dev/null || true

nohup npm run dev > /tmp/re-auction-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/re-auction-frontend.pid

sleep 8

# Check if frontend started
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}Failed to start Frontend. Check /tmp/re-auction-frontend.log${NC}"
    tail -20 /tmp/re-auction-frontend.log
    exit 1
fi
echo ""

# Summary
echo -e "${YELLOW}[5/5] Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access the application:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  API:       ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  API:       tail -f /tmp/re-auction-api.log"
echo -e "  Frontend:  tail -f /tmp/re-auction-frontend.log"
echo ""
echo -e "${BLUE}To stop:${NC}"
echo -e "  ./stop-local.sh"
echo ""
