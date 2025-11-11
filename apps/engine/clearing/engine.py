"""
Clearing engine for RE-Auction Simulator
Supports uniform-price and pay-as-bid modes with partial fills and tie-breaking
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import random


@dataclass
class Lot:
    lot_id: int
    min_vol_mwh: float
    max_vol_mwh: float
    reserve_price: float
    step_mwh: float
    allow_partial: bool


@dataclass
class Bid:
    bid_id: int
    org_id: int
    price_yen_kwh: float
    volume_mwh: float
    allow_partial: bool
    created_at: datetime


@dataclass
class MatchResult:
    lot_id: int
    bid_id: int
    cleared_price: float
    cleared_volume: float
    notes: str = ""


@dataclass
class ClearingResult:
    matches: List[MatchResult]
    cleared_price: Optional[float]
    cleared_volume: float
    audit_trail: List[Dict]


class ClearingEngine:
    """Clearing engine with uniform-price and pay-as-bid support"""

    def __init__(self, mode: str = "uniform_price", seed: Optional[int] = None):
        self.mode = mode
        self.seed = seed
        if seed is not None:
            random.seed(seed)
        self.audit_trail = []

    def clear(self, lots: List[Lot], bids: List[Bid]) -> ClearingResult:
        """Run clearing algorithm"""
        self.audit_trail = []

        if self.mode == "uniform_price":
            return self._clear_uniform_price(lots, bids)
        elif self.mode == "pay_as_bid":
            return self._clear_pay_as_bid(lots, bids)
        else:
            raise ValueError(f"Unknown mode: {self.mode}")

    def _clear_uniform_price(self, lots: List[Lot], bids: List[Bid]) -> ClearingResult:
        """Uniform-price clearing: all winners pay the same clearing price"""

        # Calculate total supply
        total_supply = sum(lot.max_vol_mwh for lot in lots)
        min_reserve = min(lot.reserve_price for lot in lots) if lots else 0

        self.audit_trail.append({
            "step": "init",
            "total_supply_mwh": total_supply,
            "min_reserve_price": min_reserve,
            "num_lots": len(lots),
            "num_bids": len(bids)
        })

        # Sort bids by price DESC, then by time ASC (earlier bids win ties)
        sorted_bids = sorted(
            bids,
            key=lambda b: (-b.price_yen_kwh, b.created_at)
        )

        # Find clearing price by walking down demand curve
        cumulative_demand = 0
        clearing_price = None
        clearing_volume = 0

        for i, bid in enumerate(sorted_bids):
            if cumulative_demand + bid.volume_mwh <= total_supply:
                cumulative_demand += bid.volume_mwh
            else:
                # Partial fill possible
                remaining = total_supply - cumulative_demand
                if remaining > 0 and bid.allow_partial:
                    cumulative_demand = total_supply
                    clearing_price = bid.price_yen_kwh
                    clearing_volume = total_supply
                    break
                else:
                    # Use previous bid's price
                    if i > 0:
                        clearing_price = sorted_bids[i-1].price_yen_kwh
                        clearing_volume = cumulative_demand
                    break
        else:
            # All bids accepted
            if sorted_bids:
                clearing_price = sorted_bids[-1].price_yen_kwh
                clearing_volume = cumulative_demand

        # Check reserve price
        if clearing_price and clearing_price < min_reserve:
            self.audit_trail.append({
                "step": "reserve_check_failed",
                "clearing_price": clearing_price,
                "min_reserve": min_reserve
            })
            return ClearingResult([], None, 0, self.audit_trail)

        self.audit_trail.append({
            "step": "clearing_price_found",
            "price": clearing_price,
            "volume": clearing_volume
        })

        # Match bids to lots
        matches = self._match_bids_to_lots(
            lots, sorted_bids, clearing_price, total_supply
        )

        return ClearingResult(
            matches=matches,
            cleared_price=clearing_price,
            cleared_volume=sum(m.cleared_volume for m in matches),
            audit_trail=self.audit_trail
        )

    def _clear_pay_as_bid(self, lots: List[Lot], bids: List[Bid]) -> ClearingResult:
        """Pay-as-bid clearing: each winner pays their own bid price"""

        total_supply = sum(lot.max_vol_mwh for lot in lots)

        self.audit_trail.append({
            "step": "init",
            "mode": "pay_as_bid",
            "total_supply_mwh": total_supply,
            "num_lots": len(lots),
            "num_bids": len(bids)
        })

        # Sort bids by price DESC, then by time ASC
        sorted_bids = sorted(
            bids,
            key=lambda b: (-b.price_yen_kwh, b.created_at)
        )

        # Match bids to lots with pay-as-bid pricing
        matches = []
        remaining_supply = {lot.lot_id: lot.max_vol_mwh for lot in lots}
        lot_reserve = {lot.lot_id: lot.reserve_price for lot in lots}

        for bid in sorted_bids:
            bid_remaining = bid.volume_mwh

            # Try to match with available lots
            for lot in lots:
                if remaining_supply[lot.lot_id] <= 0:
                    continue

                # Check reserve price
                if bid.price_yen_kwh < lot.reserve_price:
                    self.audit_trail.append({
                        "step": "bid_below_reserve",
                        "bid_id": bid.bid_id,
                        "bid_price": bid.price_yen_kwh,
                        "reserve": lot.reserve_price
                    })
                    continue

                # Calculate match volume
                available = remaining_supply[lot.lot_id]
                match_vol = min(bid_remaining, available)

                # Check if partial allowed
                if match_vol < bid_remaining and not bid.allow_partial:
                    continue
                if match_vol < available and not lot.allow_partial:
                    match_vol = 0

                if match_vol > 0:
                    matches.append(MatchResult(
                        lot_id=lot.lot_id,
                        bid_id=bid.bid_id,
                        cleared_price=bid.price_yen_kwh,  # Pay as bid
                        cleared_volume=match_vol,
                        notes=f"Pay-as-bid at {bid.price_yen_kwh}"
                    ))

                    remaining_supply[lot.lot_id] -= match_vol
                    bid_remaining -= match_vol

                    self.audit_trail.append({
                        "step": "match",
                        "bid_id": bid.bid_id,
                        "lot_id": lot.lot_id,
                        "volume": match_vol,
                        "price": bid.price_yen_kwh
                    })

                if bid_remaining <= 0:
                    break

        total_volume = sum(m.cleared_volume for m in matches)

        return ClearingResult(
            matches=matches,
            cleared_price=None,  # No single clearing price in pay-as-bid
            cleared_volume=total_volume,
            audit_trail=self.audit_trail
        )

    def _match_bids_to_lots(
        self,
        lots: List[Lot],
        sorted_bids: List[Bid],
        clearing_price: float,
        total_supply: float
    ) -> List[MatchResult]:
        """Match winning bids to lots for uniform-price"""

        matches = []
        remaining_supply = {lot.lot_id: lot.max_vol_mwh for lot in lots}

        # Only match bids at or above clearing price
        winning_bids = [b for b in sorted_bids if b.price_yen_kwh >= clearing_price]

        for bid in winning_bids:
            bid_remaining = bid.volume_mwh

            # Allocate to lots
            for lot in lots:
                if remaining_supply[lot.lot_id] <= 0:
                    continue

                available = remaining_supply[lot.lot_id]
                match_vol = min(bid_remaining, available)

                # Check partial fill constraints
                if match_vol < bid_remaining and not bid.allow_partial:
                    continue
                if match_vol < available and not lot.allow_partial:
                    match_vol = 0

                if match_vol > 0:
                    matches.append(MatchResult(
                        lot_id=lot.lot_id,
                        bid_id=bid.bid_id,
                        cleared_price=clearing_price,
                        cleared_volume=match_vol,
                        notes=f"Uniform price {clearing_price}"
                    ))

                    remaining_supply[lot.lot_id] -= match_vol
                    bid_remaining -= match_vol

                    self.audit_trail.append({
                        "step": "match",
                        "bid_id": bid.bid_id,
                        "lot_id": lot.lot_id,
                        "volume": match_vol,
                        "price": clearing_price
                    })

                if bid_remaining <= 0:
                    break

        return matches
