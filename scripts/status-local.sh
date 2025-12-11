#!/bin/bash

# RE-Auction Simulator - Local Development Status Script

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RE-Auction Simulator - Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check PostgreSQL
echo -e "${YELLOW}PostgreSQL:${NC}"
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Running on port 5432${NC}"
    if PGPASSWORD=re_password psql -h localhost -U re_user -d re_auction -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Database 're_auction' is accessible${NC}"
    else
        echo -e "  ${RED}✗ Database 're_auction' not accessible${NC}"
    fi
else
    echo -e "  ${RED}✗ Not running${NC}"
fi
echo ""

# Check Backend API
echo -e "${YELLOW}Backend API:${NC}"
if lsof -i :8000 >/dev/null 2>&1; then
    API_PID=$(lsof -t -i :8000)
    echo -e "  ${GREEN}✓ Running on port 8000 (PID: $API_PID)${NC}"

    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Health check passed${NC}"
        AUCTION_COUNT=$(curl -s http://localhost:8000/api/auctions | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
        echo -e "  ${BLUE}  Auctions in DB: $AUCTION_COUNT${NC}"
    else
        echo -e "  ${YELLOW}  Health check failed${NC}"
    fi
else
    echo -e "  ${RED}✗ Not running${NC}"

    if [ -f /tmp/re-auction-api.log ]; then
        echo -e "  ${YELLOW}Last 5 lines from log:${NC}"
        tail -5 /tmp/re-auction-api.log | sed 's/^/    /'
    fi
fi
echo ""

# Check Frontend
echo -e "${YELLOW}Frontend:${NC}"
if lsof -i :3000 >/dev/null 2>&1; then
    FRONTEND_PID=$(lsof -t -i :3000)
    echo -e "  ${GREEN}✓ Running on port 3000 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "  ${RED}✗ Not running${NC}"

    if [ -f /tmp/re-auction-frontend.log ]; then
        echo -e "  ${YELLOW}Last 5 lines from log:${NC}"
        tail -5 /tmp/re-auction-frontend.log | sed 's/^/    /'
    fi
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Frontend:  http://localhost:3000"
echo -e "  API:       http://localhost:8000"
echo -e "  API Docs:  http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  API:       tail -f /tmp/re-auction-api.log"
echo -e "  Frontend:  tail -f /tmp/re-auction-frontend.log"
echo -e "${BLUE}========================================${NC}"
