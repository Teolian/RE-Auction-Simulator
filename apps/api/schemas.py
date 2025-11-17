"""Pydantic schemas for API requests/responses"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from models import (
    OrgType, UserRole, UserStatus, PlantType,
    AuctionMode, AuctionStatus, InterviewStatus, ContractStatus
)


# Org schemas
class OrgCreate(BaseModel):
    name: str
    type: OrgType


class OrgResponse(BaseModel):
    org_id: int
    name: str
    type: OrgType
    created_at: datetime

    class Config:
        from_attributes = True


# User schemas
class UserCreate(BaseModel):
    org_id: int
    email: EmailStr
    role: UserRole
    password: str


class UserResponse(BaseModel):
    user_id: int
    org_id: int
    email: str
    role: UserRole
    status: UserStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Plant schemas
class PlantCreate(BaseModel):
    org_id: int
    type: PlantType
    prefecture: Optional[str] = None
    ac_mw: float
    profile_json: Optional[dict] = None


class PlantResponse(BaseModel):
    plant_id: int
    org_id: int
    type: PlantType
    prefecture: Optional[str]
    ac_mw: float
    profile_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


# Auction schemas
class AuctionCreate(BaseModel):
    mode: AuctionMode
    area: str
    starts_at: datetime
    ends_at: datetime


class AuctionResponse(BaseModel):
    auction_id: int
    mode: AuctionMode
    area: str
    starts_at: datetime
    ends_at: datetime
    status: AuctionStatus
    cleared_price: Optional[float]
    cleared_volume: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# Lot schemas
class LotCreate(BaseModel):
    auction_id: int
    plant_id: int
    min_vol_mwh: float = Field(gt=0)
    max_vol_mwh: float = Field(gt=0)
    reserve_price: float = Field(gt=0)
    step_mwh: float = Field(gt=0)
    allow_partial: bool = True


class LotResponse(BaseModel):
    lot_id: int
    auction_id: int
    plant_id: int
    min_vol_mwh: float
    max_vol_mwh: float
    reserve_price: float
    step_mwh: float
    allow_partial: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Bid schemas
class BidCreate(BaseModel):
    auction_id: int
    org_id: int
    price_yen_kwh: float = Field(gt=0)
    volume_mwh: float = Field(gt=0)
    allow_partial: bool = True
    terms_json: Optional[dict] = None


class BidResponse(BaseModel):
    bid_id: int
    auction_id: int
    org_id: int
    price_yen_kwh: float
    volume_mwh: float
    allow_partial: bool
    terms_json: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


# Match schemas
class MatchResponse(BaseModel):
    match_id: int
    auction_id: int
    lot_id: int
    bid_id: int
    cleared_price: float
    cleared_volume: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Interview schemas
class InterviewCreate(BaseModel):
    match_id: int
    when_ts: datetime
    contact: Optional[str] = None
    notes: Optional[str] = None


class InterviewResponse(BaseModel):
    iv_id: int
    match_id: int
    status: InterviewStatus
    when_ts: datetime
    contact: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Clearing schemas
class ClearingRequest(BaseModel):
    auction_id: int


class ClearingResponse(BaseModel):
    auction_id: int
    cleared_price: Optional[float]
    cleared_volume: float
    matches_count: int
    audit_trail: List[dict]


# Report schemas
class ReportResponse(BaseModel):
    auction_id: int
    mode: AuctionMode
    area: str
    cleared_price: Optional[float]
    cleared_volume: float
    total_lots: int
    total_bids: int
    matches: List[MatchResponse]


# Contract schemas
class ContractCreate(BaseModel):
    match_id: int
    draft_url: Optional[str] = None


class ContractResponse(BaseModel):
    contract_id: int
    match_id: int
    draft_url: Optional[str]
    status: ContractStatus
    created_at: datetime

    class Config:
        from_attributes = True


# Extended auction response with counts
class AuctionWithCountsResponse(AuctionResponse):
    lots_count: int = 0
    bids_count: int = 0
    min_lot_price: Optional[float] = None
    max_lot_price: Optional[float] = None


# Market statistics
class RecentClearing(BaseModel):
    auction_id: int
    area: str
    cleared_price: float
    cleared_volume: float
    cleared_at: datetime


class MarketStatsResponse(BaseModel):
    active_regions: List[str]
    avg_cleared_price: Optional[float] = None
    total_volume_traded: float = 0.0
    recent_clearings: List[RecentClearing] = []


# User activity schemas
class MyLotResponse(BaseModel):
    lot_id: int
    auction_id: int
    auction_area: str
    auction_status: AuctionStatus
    min_vol_mwh: float
    max_vol_mwh: float
    reserve_price: float
    created_at: datetime
    # Cleared data (if applicable)
    matched_volume: Optional[float] = None
    cleared_price: Optional[float] = None


class MyBidResponse(BaseModel):
    bid_id: int
    auction_id: int
    auction_area: str
    auction_status: AuctionStatus
    price_yen_kwh: float
    volume_mwh: float
    created_at: datetime
    # Cleared data (if applicable)
    won_volume: Optional[float] = None
    cleared_price: Optional[float] = None
