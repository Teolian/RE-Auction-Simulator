#!/bin/bash

# RE-Auction Simulator - Local Development Stop Script

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RE-Auction Simulator - Stopping${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop Frontend
echo -e "${YELLOW}Stopping Frontend...${NC}"
if [ -f /tmp/re-auction-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/re-auction-frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}Frontend process not running${NC}"
    fi
    rm -f /tmp/re-auction-frontend.pid
else
    pkill -f "next dev" 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}" || echo -e "${YELLOW}Frontend not running${NC}"
fi

# Stop Backend API
echo -e "${YELLOW}Stopping Backend API...${NC}"
if [ -f /tmp/re-auction-api.pid ]; then
    API_PID=$(cat /tmp/re-auction-api.pid)
    if kill -0 $API_PID 2>/dev/null; then
        kill $API_PID
        echo -e "${GREEN}✓ Backend API stopped (PID: $API_PID)${NC}"
    else
        echo -e "${YELLOW}API process not running${NC}"
    fi
    rm -f /tmp/re-auction-api.pid
else
    pkill -f "uvicorn main:app" 2>/dev/null && echo -e "${GREEN}✓ Backend API stopped${NC}" || echo -e "${YELLOW}API not running${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}PostgreSQL is still running.${NC}"
echo -e "${BLUE}To stop PostgreSQL: service postgresql stop${NC}"
echo ""
