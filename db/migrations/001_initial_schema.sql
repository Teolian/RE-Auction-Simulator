-- Initial schema for RE-Auction Simulator
-- Generated: 2025-11-11

CREATE TYPE org_type AS ENUM ('seller', 'buyer', 'operator');
CREATE TYPE user_role AS ENUM ('seller', 'buyer', 'operator', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE plant_type AS ENUM ('pv', 'wind');
CREATE TYPE auction_mode AS ENUM ('uniform_price', 'pay_as_bid');
CREATE TYPE auction_status AS ENUM ('draft', 'open', 'locked', 'cleared', 'published');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'signed', 'cancelled');

CREATE TABLE orgs (
    org_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type org_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    org_id INTEGER NOT NULL REFERENCES orgs(org_id),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    pwd_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plants (
    plant_id SERIAL PRIMARY KEY,
    org_id INTEGER NOT NULL REFERENCES orgs(org_id),
    type plant_type NOT NULL,
    prefecture VARCHAR(100),
    ac_mw FLOAT NOT NULL,
    profile_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auctions (
    auction_id SERIAL PRIMARY KEY,
    mode auction_mode NOT NULL,
    area VARCHAR(100) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status auction_status DEFAULT 'draft',
    cleared_price FLOAT,
    cleared_volume FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lots (
    lot_id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(auction_id),
    plant_id INTEGER NOT NULL REFERENCES plants(plant_id),
    min_vol_mwh FLOAT NOT NULL,
    max_vol_mwh FLOAT NOT NULL,
    reserve_price FLOAT NOT NULL,
    step_mwh FLOAT NOT NULL,
    allow_partial BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bids (
    bid_id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(auction_id),
    org_id INTEGER NOT NULL REFERENCES orgs(org_id),
    price_yen_kwh FLOAT NOT NULL,
    volume_mwh FLOAT NOT NULL,
    allow_partial BOOLEAN DEFAULT TRUE,
    terms_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(auction_id),
    lot_id INTEGER NOT NULL REFERENCES lots(lot_id),
    bid_id INTEGER NOT NULL REFERENCES bids(bid_id),
    cleared_price FLOAT NOT NULL,
    cleared_volume FLOAT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE interviews (
    iv_id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(match_id),
    status interview_status DEFAULT 'scheduled',
    when_ts TIMESTAMP NOT NULL,
    contact VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(match_id),
    draft_url VARCHAR(500),
    status contract_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    ref_id VARCHAR(100),
    ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta JSONB
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_auctions_area_starts ON auctions(area, starts_at);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_lots_auction ON lots(auction_id);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_org ON bids(org_id);
CREATE INDEX idx_bids_price ON bids(price_yen_kwh);
CREATE INDEX idx_bids_created ON bids(created_at);
CREATE INDEX idx_matches_auction ON matches(auction_id);
CREATE INDEX idx_matches_lot ON matches(lot_id);
CREATE INDEX idx_interviews_match ON interviews(match_id);
CREATE INDEX idx_contracts_match ON contracts(match_id);
CREATE INDEX idx_audit_ts ON audit_logs(ts);
