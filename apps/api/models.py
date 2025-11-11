from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class OrgType(str, enum.Enum):
    SELLER = "seller"
    BUYER = "buyer"
    OPERATOR = "operator"

class UserRole(str, enum.Enum):
    SELLER = "seller"
    BUYER = "buyer"
    OPERATOR = "operator"
    ADMIN = "admin"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class PlantType(str, enum.Enum):
    PV = "pv"
    WIND = "wind"

class AuctionMode(str, enum.Enum):
    UNIFORM_PRICE = "uniform_price"
    PAY_AS_BID = "pay_as_bid"

class AuctionStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    LOCKED = "locked"
    CLEARED = "cleared"
    PUBLISHED = "published"

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SIGNED = "signed"
    CANCELLED = "cancelled"

class Org(Base):
    __tablename__ = "orgs"

    org_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(OrgType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="org")
    plants = relationship("Plant", back_populates="org")
    bids = relationship("Bid", back_populates="org")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("orgs.org_id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    pwd_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    org = relationship("Org", back_populates="users")

class Plant(Base):
    __tablename__ = "plants"

    plant_id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("orgs.org_id"), nullable=False)
    type = Column(Enum(PlantType), nullable=False)
    prefecture = Column(String(100))
    ac_mw = Column(Float, nullable=False)
    profile_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    org = relationship("Org", back_populates="plants")
    lots = relationship("Lot", back_populates="plant")

class Auction(Base):
    __tablename__ = "auctions"

    auction_id = Column(Integer, primary_key=True, index=True)
    mode = Column(Enum(AuctionMode), nullable=False)
    area = Column(String(100), nullable=False, index=True)
    starts_at = Column(DateTime, nullable=False, index=True)
    ends_at = Column(DateTime, nullable=False)
    status = Column(Enum(AuctionStatus), default=AuctionStatus.DRAFT)
    cleared_price = Column(Float, nullable=True)
    cleared_volume = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lots = relationship("Lot", back_populates="auction")
    bids = relationship("Bid", back_populates="auction")
    matches = relationship("Match", back_populates="auction")

class Lot(Base):
    __tablename__ = "lots"

    lot_id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.auction_id"), nullable=False, index=True)
    plant_id = Column(Integer, ForeignKey("plants.plant_id"), nullable=False)
    min_vol_mwh = Column(Float, nullable=False)
    max_vol_mwh = Column(Float, nullable=False)
    reserve_price = Column(Float, nullable=False)
    step_mwh = Column(Float, nullable=False)
    allow_partial = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    auction = relationship("Auction", back_populates="lots")
    plant = relationship("Plant", back_populates="lots")
    matches = relationship("Match", back_populates="lot")

class Bid(Base):
    __tablename__ = "bids"

    bid_id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.auction_id"), nullable=False, index=True)
    org_id = Column(Integer, ForeignKey("orgs.org_id"), nullable=False, index=True)
    price_yen_kwh = Column(Float, nullable=False, index=True)
    volume_mwh = Column(Float, nullable=False)
    allow_partial = Column(Boolean, default=True)
    terms_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    auction = relationship("Auction", back_populates="bids")
    org = relationship("Org", back_populates="bids")
    matches = relationship("Match", back_populates="bid")

class Match(Base):
    __tablename__ = "matches"

    match_id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.auction_id"), nullable=False, index=True)
    lot_id = Column(Integer, ForeignKey("lots.lot_id"), nullable=False)
    bid_id = Column(Integer, ForeignKey("bids.bid_id"), nullable=False)
    cleared_price = Column(Float, nullable=False)
    cleared_volume = Column(Float, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    auction = relationship("Auction", back_populates="matches")
    lot = relationship("Lot", back_populates="matches")
    bid = relationship("Bid", back_populates="matches")
    interviews = relationship("Interview", back_populates="match")
    contracts = relationship("Contract", back_populates="match")

class Interview(Base):
    __tablename__ = "interviews"

    iv_id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"), nullable=False, index=True)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED)
    when_ts = Column(DateTime, nullable=False)
    contact = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="interviews")

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.match_id"), nullable=False, index=True)
    draft_url = Column(String(500))
    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="contracts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(255), nullable=False)
    action = Column(String(255), nullable=False)
    ref_id = Column(String(100))
    ts = Column(DateTime, default=datetime.utcnow, index=True)
    meta = Column(JSON)
