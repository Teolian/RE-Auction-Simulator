"""Tests for clearing engine"""
import pytest
from datetime import datetime
from clearing.engine import ClearingEngine, Lot, Bid


def test_uniform_price_basic():
    """Test basic uniform-price clearing"""
    engine = ClearingEngine(mode="uniform_price", seed=42)

    lots = [
        Lot(1, 0, 100, 10.0, 10, True),
        Lot(2, 0, 100, 10.0, 10, True),
    ]

    bids = [
        Bid(1, 101, 15.0, 80, True, datetime.now()),
        Bid(2, 102, 12.0, 70, True, datetime.now()),
        Bid(3, 103, 11.0, 60, True, datetime.now()),
    ]

    result = engine.clear(lots, bids)

    # All bids should clear
    assert result.cleared_price == 11.0
    assert result.cleared_volume == 200
    assert len(result.matches) >= 3


def test_uniform_price_reserve():
    """Test reserve price enforcement"""
    engine = ClearingEngine(mode="uniform_price", seed=42)

    lots = [Lot(1, 0, 100, 20.0, 10, True)]  # Reserve 20

    bids = [
        Bid(1, 101, 15.0, 50, True, datetime.now()),  # Below reserve
    ]

    result = engine.clear(lots, bids)

    # Should not clear due to reserve
    assert result.cleared_price is None
    assert len(result.matches) == 0


def test_pay_as_bid_basic():
    """Test pay-as-bid clearing"""
    engine = ClearingEngine(mode="pay_as_bid", seed=42)

    lots = [Lot(1, 0, 100, 10.0, 10, True)]

    bids = [
        Bid(1, 101, 15.0, 50, True, datetime.now()),
        Bid(2, 102, 12.0, 60, True, datetime.now()),
    ]

    result = engine.clear(lots, bids)

    # First bid should win and pay 15.0
    assert len(result.matches) >= 1
    assert result.matches[0].cleared_price == 15.0
    assert result.cleared_volume == 100


def test_partial_fills():
    """Test partial fill logic"""
    engine = ClearingEngine(mode="uniform_price", seed=42)

    lots = [Lot(1, 0, 100, 10.0, 10, True)]

    bids = [
        Bid(1, 101, 15.0, 150, True, datetime.now()),  # Allow partial
    ]

    result = engine.clear(lots, bids)

    # Should partially fill to 100
    assert result.cleared_volume <= 100


def test_time_priority():
    """Test time-based tie-breaking"""
    engine = ClearingEngine(mode="uniform_price", seed=42)

    lots = [Lot(1, 0, 100, 10.0, 10, True)]

    t1 = datetime(2025, 1, 1, 10, 0, 0)
    t2 = datetime(2025, 1, 1, 10, 0, 1)

    bids = [
        Bid(1, 101, 15.0, 60, True, t2),  # Later
        Bid(2, 102, 15.0, 60, True, t1),  # Earlier - should win tie
    ]

    result = engine.clear(lots, bids)

    # Earlier bid should be matched first
    matched_bids = [m.bid_id for m in result.matches]
    assert 2 in matched_bids


def test_supply_constraint():
    """Test that matched volume never exceeds supply"""
    engine = ClearingEngine(mode="uniform_price", seed=42)

    total_supply = 100
    lots = [Lot(1, 0, total_supply, 10.0, 10, True)]

    bids = [
        Bid(i, 100+i, 20.0, 50, True, datetime.now())
        for i in range(5)
    ]

    result = engine.clear(lots, bids)

    assert result.cleared_volume <= total_supply


def test_deterministic_with_seed():
    """Test that clearing is deterministic with fixed seed"""
    lots = [Lot(1, 0, 100, 10.0, 10, True)]
    bids = [
        Bid(1, 101, 15.0, 60, True, datetime.now()),
        Bid(2, 102, 15.0, 60, True, datetime.now()),
    ]

    result1 = ClearingEngine(mode="uniform_price", seed=42).clear(lots, bids)
    result2 = ClearingEngine(mode="uniform_price", seed=42).clear(lots, bids)

    assert result1.cleared_price == result2.cleared_price
    assert result1.cleared_volume == result2.cleared_volume
