"""FastAPI application for RE-Auction Simulator"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import sys
import os

# Add engine path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'engine'))

from database import get_db, engine
import models
from schemas import *
from clearing.engine import ClearingEngine, Lot, Bid

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RE-Auction Simulator API",
    version="1.0.0",
    description="Renewable Energy Auction Platform"
)

# CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}


# Statistics
@app.get("/api/stats/market", response_model=MarketStatsResponse)
def get_market_stats(db: Session = Depends(get_db)):
    """Get market statistics for overview"""
    from datetime import timedelta
    from sqlalchemy import func

    # Get active regions (areas with recent auctions)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_regions = db.query(models.Auction.area)\
        .filter(models.Auction.created_at >= thirty_days_ago)\
        .distinct()\
        .all()
    active_regions = [r[0] for r in active_regions]

    # Get recent cleared auctions (last 5)
    recent_auctions = db.query(models.Auction)\
        .filter(models.Auction.status.in_(['cleared', 'published']))\
        .filter(models.Auction.cleared_price.isnot(None))\
        .order_by(models.Auction.created_at.desc())\
        .limit(5)\
        .all()

    # Calculate average cleared price
    avg_price = None
    total_volume = 0.0
    if recent_auctions:
        prices = [a.cleared_price for a in recent_auctions if a.cleared_price]
        if prices:
            avg_price = sum(prices) / len(prices)
        total_volume = sum(a.cleared_volume or 0 for a in recent_auctions)

    # Build recent clearings list
    recent_clearings = [
        RecentClearing(
            auction_id=a.auction_id,
            area=a.area,
            cleared_price=a.cleared_price,
            cleared_volume=a.cleared_volume or 0,
            cleared_at=a.created_at
        )
        for a in recent_auctions
    ]

    return MarketStatsResponse(
        active_regions=active_regions,
        avg_cleared_price=avg_price,
        total_volume_traded=total_volume,
        recent_clearings=recent_clearings
    )


# Auctions
@app.post("/api/auctions", response_model=AuctionResponse)
def create_auction(auction: AuctionCreate, db: Session = Depends(get_db)):
    """Create new auction"""
    db_auction = models.Auction(**auction.dict())
    db.add(db_auction)
    db.commit()
    db.refresh(db_auction)
    return db_auction


@app.get("/api/auctions")
def list_auctions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    area: Optional[str] = None,
    with_counts: bool = False,
    db: Session = Depends(get_db)
):
    """List auctions with optional filters and counts"""
    from sqlalchemy import func

    query = db.query(models.Auction)

    # Apply filters
    if status:
        query = query.filter(models.Auction.status == status)
    if area:
        query = query.filter(models.Auction.area == area)

    auctions = query.offset(skip).limit(limit).all()

    # If counts not needed, return simple response
    if not with_counts:
        return auctions

    # Enrich with counts
    result = []
    for auction in auctions:
        # Count lots and bids
        lots_count = db.query(models.Lot)\
            .filter(models.Lot.auction_id == auction.auction_id)\
            .count()

        bids_count = db.query(models.Bid)\
            .filter(models.Bid.auction_id == auction.auction_id)\
            .count()

        # Get price range from lots
        price_stats = db.query(
            func.min(models.Lot.reserve_price),
            func.max(models.Lot.reserve_price)
        ).filter(models.Lot.auction_id == auction.auction_id).first()

        min_price = price_stats[0] if price_stats else None
        max_price = price_stats[1] if price_stats else None

        # Build enriched response
        auction_dict = {
            "auction_id": auction.auction_id,
            "mode": auction.mode,
            "area": auction.area,
            "starts_at": auction.starts_at,
            "ends_at": auction.ends_at,
            "status": auction.status,
            "cleared_price": auction.cleared_price,
            "cleared_volume": auction.cleared_volume,
            "created_at": auction.created_at,
            "lots_count": lots_count,
            "bids_count": bids_count,
            "min_lot_price": min_price,
            "max_lot_price": max_price
        }
        result.append(AuctionWithCountsResponse(**auction_dict))

    return result


@app.get("/api/auctions/{auction_id}", response_model=AuctionResponse)
def get_auction(auction_id: int, db: Session = Depends(get_db)):
    """Get auction by ID"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction


@app.delete("/api/auctions/{auction_id}")
def delete_auction(auction_id: int, db: Session = Depends(get_db)):
    """Delete auction (only if status is 'draft' and no lots/bids exist)"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    # Only allow deletion of draft auctions
    if auction.status != 'draft':
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete auction with status '{auction.status}'. Only 'draft' auctions can be deleted."
        )

    # Check if any lots exist
    lots_count = db.query(models.Lot).filter(models.Lot.auction_id == auction_id).count()
    if lots_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete auction with {lots_count} lot(s). Remove all lots first."
        )

    # Check if any bids exist
    bids_count = db.query(models.Bid).filter(models.Bid.auction_id == auction_id).count()
    if bids_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete auction with {bids_count} bid(s). Remove all bids first."
        )

    # Safe to delete
    db.delete(auction)
    db.commit()

    return {"message": "Auction deleted successfully", "auction_id": auction_id}


# Lots
@app.post("/api/lots", response_model=LotResponse)
def create_lot(lot: LotCreate, db: Session = Depends(get_db)):
    """Create new lot"""
    # Validate auction exists and is in correct state
    auction = db.query(models.Auction).filter(models.Auction.auction_id == lot.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status not in ['draft', 'open']:
        raise HTTPException(status_code=400, detail="Cannot add lots to locked/cleared auction")

    # Validate volumes
    if lot.min_vol_mwh > lot.max_vol_mwh:
        raise HTTPException(status_code=400, detail="min_vol cannot exceed max_vol")

    db_lot = models.Lot(**lot.dict())
    db.add(db_lot)
    db.commit()
    db.refresh(db_lot)
    return db_lot


@app.get("/api/lots", response_model=List[LotResponse])
def list_lots(auction_id: int = None, db: Session = Depends(get_db)):
    """List lots"""
    query = db.query(models.Lot)
    if auction_id:
        query = query.filter(models.Lot.auction_id == auction_id)
    return query.all()


# Bids
@app.post("/api/bids", response_model=BidResponse)
def submit_bid(bid: BidCreate, db: Session = Depends(get_db)):
    """Submit bid"""
    # Validate auction exists and is open
    auction = db.query(models.Auction).filter(models.Auction.auction_id == bid.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != 'open':
        raise HTTPException(status_code=400, detail="Auction is not open for bidding")

    db_bid = models.Bid(**bid.dict())
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)
    return db_bid


@app.get("/api/bids", response_model=List[BidResponse])
def list_bids(auction_id: int = None, org_id: int = None, db: Session = Depends(get_db)):
    """List bids (restricted before clearing)"""
    query = db.query(models.Bid)
    if auction_id:
        # Check if auction is cleared before showing all bids
        auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
        if auction and auction.status not in ['cleared', 'published']:
            if not org_id:
                raise HTTPException(status_code=403, detail="Cannot view bids before clearing")
        query = query.filter(models.Bid.auction_id == auction_id)
    if org_id:
        query = query.filter(models.Bid.org_id == org_id)
    return query.all()


# User activity endpoints
@app.get("/api/my/lots", response_model=List[MyLotResponse])
def get_my_lots(org_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get lots for specific organization with auction context"""
    from sqlalchemy.orm import joinedload

    # Get lots with joined auction data
    query = db.query(models.Lot)\
        .join(models.Plant, models.Lot.plant_id == models.Plant.plant_id)\
        .join(models.Auction, models.Lot.auction_id == models.Auction.auction_id)\
        .filter(models.Plant.org_id == org_id)

    # Filter by status if provided
    if status == 'active':
        query = query.filter(models.Auction.status.in_(['open', 'locked']))
    elif status == 'cleared':
        query = query.filter(models.Auction.status.in_(['cleared', 'published']))
    elif status and status != 'all':
        query = query.filter(models.Auction.status == status)

    lots_with_auctions = query.all()

    # Build response with auction context
    result = []
    for lot in lots_with_auctions:
        auction = lot.auction

        # Get match data if auction is cleared
        matched_volume = None
        cleared_price = None
        if auction.status in ['cleared', 'published']:
            match = db.query(models.Match)\
                .filter(models.Match.lot_id == lot.lot_id)\
                .first()
            if match:
                matched_volume = match.cleared_volume
                cleared_price = match.cleared_price

        result.append(MyLotResponse(
            lot_id=lot.lot_id,
            auction_id=auction.auction_id,
            auction_area=auction.area,
            auction_status=auction.status,
            min_vol_mwh=lot.min_vol_mwh,
            max_vol_mwh=lot.max_vol_mwh,
            reserve_price=lot.reserve_price,
            created_at=lot.created_at,
            matched_volume=matched_volume,
            cleared_price=cleared_price
        ))

    return result


@app.get("/api/my/bids", response_model=List[MyBidResponse])
def get_my_bids(org_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get bids for specific organization with auction context"""
    from sqlalchemy import func

    # Get bids with joined auction data
    query = db.query(models.Bid)\
        .join(models.Auction, models.Bid.auction_id == models.Auction.auction_id)\
        .filter(models.Bid.org_id == org_id)

    # Filter by status if provided
    if status == 'active':
        query = query.filter(models.Auction.status.in_(['open', 'locked']))
    elif status == 'cleared':
        query = query.filter(models.Auction.status.in_(['cleared', 'published']))
    elif status and status != 'all':
        query = query.filter(models.Auction.status == status)

    bids_with_auctions = query.all()

    # Build response with auction context
    result = []
    for bid in bids_with_auctions:
        auction = bid.auction

        # Get match data if auction is cleared
        won_volume = None
        cleared_price = None
        if auction.status in ['cleared', 'published']:
            # Sum all matches for this bid
            match_sum = db.query(func.sum(models.Match.cleared_volume))\
                .filter(models.Match.bid_id == bid.bid_id)\
                .scalar()

            if match_sum:
                won_volume = match_sum
                # Get cleared price from auction
                cleared_price = auction.cleared_price

        result.append(MyBidResponse(
            bid_id=bid.bid_id,
            auction_id=auction.auction_id,
            auction_area=auction.area,
            auction_status=auction.status,
            price_yen_kwh=bid.price_yen_kwh,
            volume_mwh=bid.volume_mwh,
            created_at=bid.created_at,
            won_volume=won_volume,
            cleared_price=cleared_price
        ))

    return result


# Auction operations
@app.post("/api/auctions/{auction_id}/open")
def open_auction(auction_id: int, db: Session = Depends(get_db)):
    """Open auction (start bidding window)"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != 'draft':
        raise HTTPException(status_code=400, detail="Can only open draft auctions")

    # Check if there are lots
    lot_count = db.query(models.Lot).filter(models.Lot.auction_id == auction_id).count()
    if lot_count == 0:
        raise HTTPException(status_code=400, detail="Cannot open auction without lots")

    auction.status = 'open'
    db.commit()

    return {
        "auction_id": auction_id,
        "status": "open",
        "lot_count": lot_count,
        "message": f"Auction opened with {lot_count} lots"
    }


@app.post("/api/auctions/{auction_id}/lock")
def lock_auction(auction_id: int, db: Session = Depends(get_db)):
    """Lock auction (close bidding window)"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != 'open':
        raise HTTPException(status_code=400, detail="Can only lock open auctions")

    auction.status = 'locked'
    db.commit()

    # Get bid count
    bid_count = db.query(models.Bid).filter(models.Bid.auction_id == auction_id).count()

    return {
        "auction_id": auction_id,
        "status": "locked",
        "bid_count": bid_count,
        "message": f"Auction locked with {bid_count} bids"
    }


@app.post("/api/auctions/{auction_id}/clear", response_model=ClearingResponse)
def clear_auction(auction_id: int, db: Session = Depends(get_db)):
    """Run clearing algorithm"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != 'locked':
        raise HTTPException(status_code=400, detail="Auction must be locked before clearing")

    # Get lots and bids
    lots = db.query(models.Lot).filter(models.Lot.auction_id == auction_id).all()
    bids = db.query(models.Bid).filter(models.Bid.auction_id == auction_id).all()

    if not lots:
        raise HTTPException(status_code=400, detail="No lots in auction")
    if not bids:
        raise HTTPException(status_code=400, detail="No bids in auction")

    # Convert to clearing engine format
    engine_lots = [
        Lot(
            lot_id=lot.lot_id,
            min_vol_mwh=lot.min_vol_mwh,
            max_vol_mwh=lot.max_vol_mwh,
            reserve_price=lot.reserve_price,
            step_mwh=lot.step_mwh,
            allow_partial=lot.allow_partial
        )
        for lot in lots
    ]

    engine_bids = [
        Bid(
            bid_id=bid.bid_id,
            org_id=bid.org_id,
            price_yen_kwh=bid.price_yen_kwh,
            volume_mwh=bid.volume_mwh,
            allow_partial=bid.allow_partial,
            created_at=bid.created_at
        )
        for bid in bids
    ]

    # Run clearing
    engine = ClearingEngine(mode=auction.mode.value, seed=42)
    result = engine.clear(engine_lots, engine_bids)

    # Save matches
    for match in result.matches:
        db_match = models.Match(
            auction_id=auction_id,
            lot_id=match.lot_id,
            bid_id=match.bid_id,
            cleared_price=match.cleared_price,
            cleared_volume=match.cleared_volume,
            notes=match.notes
        )
        db.add(db_match)

    # Update auction
    auction.status = 'cleared'
    auction.cleared_price = result.cleared_price
    auction.cleared_volume = result.cleared_volume
    db.commit()

    return ClearingResponse(
        auction_id=auction_id,
        cleared_price=result.cleared_price,
        cleared_volume=result.cleared_volume,
        matches_count=len(result.matches),
        audit_trail=result.audit_trail
    )


@app.get("/api/auctions/{auction_id}/report", response_model=ReportResponse)
def get_report(auction_id: int, db: Session = Depends(get_db)):
    """Get clearing report"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status not in ['cleared', 'published']:
        raise HTTPException(status_code=400, detail="Auction not yet cleared")

    lots_count = db.query(models.Lot).filter(models.Lot.auction_id == auction_id).count()
    bids_count = db.query(models.Bid).filter(models.Bid.auction_id == auction_id).count()
    matches = db.query(models.Match).filter(models.Match.auction_id == auction_id).all()

    return ReportResponse(
        auction_id=auction_id,
        mode=auction.mode,
        area=auction.area,
        cleared_price=auction.cleared_price,
        cleared_volume=auction.cleared_volume or 0,
        total_lots=lots_count,
        total_bids=bids_count,
        matches=[MatchResponse.from_orm(m) for m in matches]
    )


# Interviews
@app.post("/api/interviews", response_model=InterviewResponse)
def create_interview(interview: InterviewCreate, db: Session = Depends(get_db)):
    """Create interview (面談)"""
    # Validate match exists
    match = db.query(models.Match).filter(models.Match.match_id == interview.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    db_interview = models.Interview(**interview.dict())
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview


@app.get("/api/interviews", response_model=List[InterviewResponse])
def list_interviews(match_id: int = None, db: Session = Depends(get_db)):
    """List interviews"""
    query = db.query(models.Interview)
    if match_id:
        query = query.filter(models.Interview.match_id == match_id)
    return query.all()


# Contracts
@app.post("/api/contracts", response_model=ContractResponse)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    """Create contract"""
    # Validate match exists
    match = db.query(models.Match).filter(models.Match.match_id == contract.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    db_contract = models.Contract(**contract.dict())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract


@app.get("/api/contracts", response_model=List[ContractResponse])
def list_contracts(match_id: int = None, status: str = None, db: Session = Depends(get_db)):
    """List contracts"""
    query = db.query(models.Contract)
    if match_id:
        query = query.filter(models.Contract.match_id == match_id)
    if status:
        query = query.filter(models.Contract.status == status)
    return query.all()


@app.post("/api/contracts/{contract_id}/sign")
def sign_contract(contract_id: int, db: Session = Depends(get_db)):
    """Sign contract (mark as signed)"""
    contract = db.query(models.Contract).filter(models.Contract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.status not in ['draft', 'pending']:
        raise HTTPException(status_code=400, detail="Can only sign draft or pending contracts")

    contract.status = 'signed'
    db.commit()

    return {
        "contract_id": contract_id,
        "status": "signed",
        "message": "Contract signed successfully"
    }


# Orgs
@app.post("/api/orgs", response_model=OrgResponse)
def create_org(org: OrgCreate, db: Session = Depends(get_db)):
    """Create organization"""
    db_org = models.Org(**org.dict())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


@app.get("/api/orgs", response_model=List[OrgResponse])
def list_orgs(db: Session = Depends(get_db)):
    """List organizations"""
    return db.query(models.Org).all()


# Plants
@app.post("/api/plants", response_model=PlantResponse)
def create_plant(plant: PlantCreate, db: Session = Depends(get_db)):
    """Create plant"""
    db_plant = models.Plant(**plant.dict())
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant


@app.get("/api/plants", response_model=List[PlantResponse])
def list_plants(org_id: int = None, db: Session = Depends(get_db)):
    """List plants"""
    query = db.query(models.Plant)
    if org_id:
        query = query.filter(models.Plant.org_id == org_id)
    return query.all()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
