"""FastAPI application for RE-Auction Simulator"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import sys
import os

# Add engine path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'engine'))

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


# Auctions
@app.post("/api/auctions", response_model=AuctionResponse)
def create_auction(auction: AuctionCreate, db: Session = Depends(get_db)):
    """Create new auction"""
    db_auction = models.Auction(**auction.dict())
    db.add(db_auction)
    db.commit()
    db.refresh(db_auction)
    return db_auction


@app.get("/api/auctions", response_model=List[AuctionResponse])
def list_auctions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List auctions"""
    auctions = db.query(models.Auction).offset(skip).limit(limit).all()
    return auctions


@app.get("/api/auctions/{auction_id}", response_model=AuctionResponse)
def get_auction(auction_id: int, db: Session = Depends(get_db)):
    """Get auction by ID"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction


# Lots
@app.post("/api/lots", response_model=LotResponse)
def create_lot(lot: LotCreate, db: Session = Depends(get_db)):
    """Create new lot"""
    # Validate auction exists and is in correct state
    auction = db.query(models.Auction).filter(models.Auction.auction_id == lot.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status not in [models.AuctionStatus.DRAFT, models.AuctionStatus.OPEN]:
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
    if auction.status != models.AuctionStatus.OPEN:
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
        if auction and auction.status not in [models.AuctionStatus.CLEARED, models.AuctionStatus.PUBLISHED]:
            if not org_id:
                raise HTTPException(status_code=403, detail="Cannot view bids before clearing")
        query = query.filter(models.Bid.auction_id == auction_id)
    if org_id:
        query = query.filter(models.Bid.org_id == org_id)
    return query.all()


# Auction operations
@app.post("/api/auctions/{auction_id}/lock")
def lock_auction(auction_id: int, db: Session = Depends(get_db)):
    """Lock auction (close bidding window)"""
    auction = db.query(models.Auction).filter(models.Auction.auction_id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != models.AuctionStatus.OPEN:
        raise HTTPException(status_code=400, detail="Can only lock open auctions")

    auction.status = models.AuctionStatus.LOCKED
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
    if auction.status != models.AuctionStatus.LOCKED:
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
    auction.status = models.AuctionStatus.CLEARED
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
    if auction.status not in [models.AuctionStatus.CLEARED, models.AuctionStatus.PUBLISHED]:
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
