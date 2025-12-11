"""Basic API tests"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint"""
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_auction():
    """Test auction creation"""
    auction_data = {
        "mode": "uniform_price",
        "area": "Tokyo",
        "starts_at": "2025-12-01T09:00:00",
        "ends_at": "2025-12-05T18:00:00"
    }
    response = client.post("/api/auctions", json=auction_data)
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "uniform_price"
    assert data["area"] == "Tokyo"
    assert "auction_id" in data


def test_list_auctions():
    """Test listing auctions"""
    response = client.get("/api/auctions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_invalid_lot_volumes():
    """Test lot validation"""
    lot_data = {
        "auction_id": 1,
        "plant_id": 1,
        "min_vol_mwh": 100,
        "max_vol_mwh": 50,  # Invalid: max < min
        "reserve_price": 10.0,
        "step_mwh": 5.0
    }
    response = client.post("/api/lots", json=lot_data)
    assert response.status_code in [400, 404]


def test_cannot_bid_on_non_open_auction():
    """Test bidding restrictions"""
    # This will fail if auction doesn't exist or isn't open
    bid_data = {
        "auction_id": 9999,  # Non-existent
        "org_id": 1,
        "price_yen_kwh": 15.0,
        "volume_mwh": 50.0
    }
    response = client.post("/api/bids", json=bid_data)
    assert response.status_code in [400, 404]
