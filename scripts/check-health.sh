#!/bin/bash
# Health check script for RE-Auction Simulator

echo "=== RE-Auction Simulator Health Check ==="
echo ""

# Check Docker
echo "1. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi
echo "✅ Docker installed"

# Check containers
echo ""
echo "2. Checking containers..."
if docker ps | grep -q "re_auction"; then
    echo "✅ Containers running:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep re_auction
else
    echo "❌ No RE-Auction containers running"
    echo ""
    echo "Start containers with:"
    echo "  make up"
    echo "  # or"
    echo "  docker-compose up -d"
    exit 1
fi

# Check database
echo ""
echo "3. Checking database..."
if docker exec re_auction_db pg_isready -U re_user -d re_auction &> /dev/null; then
    echo "✅ Database ready"

    # Check data
    AUCTION_COUNT=$(docker exec re_auction_db psql -U re_user -d re_auction -t -c "SELECT COUNT(*) FROM auctions;" 2>/dev/null | xargs)
    if [ "$AUCTION_COUNT" -gt 0 ]; then
        echo "✅ Database has data: $AUCTION_COUNT auctions"
    else
        echo "⚠️  Database is empty. Run: make seed"
    fi
else
    echo "❌ Database not ready"
    echo "Restart database: docker restart re_auction_db"
    exit 1
fi

# Check API
echo ""
echo "4. Checking API..."
if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
    echo "✅ API responding"

    # Test auctions endpoint
    RESPONSE=$(curl -s http://localhost:8000/api/auctions)
    if echo "$RESPONSE" | grep -q "auction_id"; then
        echo "✅ API returns auction data"
    else
        echo "⚠️  API responds but no auction data"
        echo "Run: make seed"
    fi
else
    echo "❌ API not responding"
    echo "Check logs: docker logs re_auction_api"
    exit 1
fi

# Check frontend
echo ""
echo "5. Checking frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend responding"
else
    echo "❌ Frontend not responding"
    echo "Check logs: docker logs re_auction_frontend"
    exit 1
fi

echo ""
echo "=== All checks passed! ==="
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  API:      http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
