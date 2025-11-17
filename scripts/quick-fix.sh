#!/bin/bash
# Quick fix script for common issues

echo "=== RE-Auction Simulator Quick Fix ==="
echo ""

echo "Step 1: Stopping all containers..."
docker-compose down

echo ""
echo "Step 2: Removing old volumes..."
docker volume rm re-auction-simulator_postgres_data 2>/dev/null || true

echo ""
echo "Step 3: Pulling latest code..."
git pull origin claude/re-auction-mvp-setup-011CV1aJDY3unUGaQ9VVSEMP || echo "Already up to date"

echo ""
echo "Step 4: Rebuilding images..."
docker-compose build --no-cache

echo ""
echo "Step 5: Starting services..."
docker-compose up -d

echo ""
echo "Step 6: Waiting for services to start (30 seconds)..."
for i in {30..1}; do
    echo -ne "Waiting $i seconds...\r"
    sleep 1
done
echo ""

echo ""
echo "Step 7: Running seed script..."
sleep 5
docker exec re_auction_api python seed.py 2>/dev/null || echo "Seed script will run on first API start"

echo ""
echo "Step 8: Checking health..."
bash scripts/check-health.sh

echo ""
echo "=== Fix Complete ==="
echo ""
echo "Open in browser: http://localhost:3000"
