"""Enhanced seed script for RE-Auction Simulator with realistic data"""
from datetime import datetime, timedelta
from database import SessionLocal
import models
from passlib.hash import bcrypt

def seed_data():
    db = SessionLocal()

    print("🌱 Seeding database with realistic data...")

    # Clear existing data
    db.query(models.Interview).delete()
    db.query(models.Contract).delete()
    db.query(models.Match).delete()
    db.query(models.Bid).delete()
    db.query(models.Lot).delete()
    db.query(models.Auction).delete()
    db.query(models.Plant).delete()
    db.query(models.User).delete()
    db.query(models.Org).delete()
    db.commit()

    # ===== ORGANIZATIONS =====
    # Sellers (energy producers)
    sellers = [
        models.Org(name="SunPower Japan K.K.", type=models.OrgType.SELLER.value),
        models.Org(name="Tokyo Renewable Energy", type=models.OrgType.SELLER.value),
        models.Org(name="Kyushu Wind Farm Co.", type=models.OrgType.SELLER.value),
        models.Org(name="Hokkaido Solar Systems", type=models.OrgType.SELLER.value),
        models.Org(name="Osaka Green Energy", type=models.OrgType.SELLER.value),
    ]

    # Buyers (energy consumers)
    buyers = [
        models.Org(name="TechCorp Manufacturing", type=models.OrgType.BUYER.value),
        models.Org(name="Kansai Steel Industries", type=models.OrgType.BUYER.value),
        models.Org(name="Tokyo Data Centers Ltd.", type=models.OrgType.BUYER.value),
        models.Org(name="Nagoya Automotive Group", type=models.OrgType.BUYER.value),
        models.Org(name="Sapporo Food Processing", type=models.OrgType.BUYER.value),
        models.Org(name="Fukuoka Electronics Inc.", type=models.OrgType.BUYER.value),
    ]

    # Operator
    operator = models.Org(name="JEPX Auction Platform", type=models.OrgType.OPERATOR.value)

    all_orgs = sellers + buyers + [operator]
    db.add_all(all_orgs)
    db.commit()

    print(f"✅ Created {len(all_orgs)} organizations ({len(sellers)} sellers, {len(buyers)} buyers)")

    # ===== USERS =====
    users = []
    for org in all_orgs:
        email_domain = org.name.lower().replace(" ", "-").replace(".", "").replace(",", "")[:20]
        role = org.type.lower()  # enum values are lowercase: seller, buyer, operator
        users.append(models.User(
            org_id=org.org_id,
            email=f"user@{email_domain}.jp",
            role=role,
            pwd_hash=bcrypt.hash("demo123")
        ))

    db.add_all(users)
    db.commit()
    print(f"✅ Created {len(users)} users")

    # ===== PLANTS =====
    plants_data = [
        # SunPower Japan K.K.
        {"org": sellers[0], "type": "PV", "prefecture": "Tokyo", "ac_mw": 120.0, "commissioned": "2019-03", "panels": 300000},
        {"org": sellers[0], "type": "PV", "prefecture": "Saitama", "ac_mw": 85.0, "commissioned": "2020-11", "panels": 212500},

        # Tokyo Renewable Energy
        {"org": sellers[1], "type": "PV", "prefecture": "Kanagawa", "ac_mw": 95.0, "commissioned": "2021-06", "panels": 237500},
        {"org": sellers[1], "type": "WIND", "prefecture": "Chiba", "ac_mw": 60.0, "commissioned": "2020-09", "turbines": 20},

        # Kyushu Wind Farm Co.
        {"org": sellers[2], "type": "WIND", "prefecture": "Fukuoka", "ac_mw": 150.0, "commissioned": "2018-12", "turbines": 50},
        {"org": sellers[2], "type": "WIND", "prefecture": "Nagasaki", "ac_mw": 90.0, "commissioned": "2022-04", "turbines": 30},

        # Hokkaido Solar Systems
        {"org": sellers[3], "type": "PV", "prefecture": "Hokkaido", "ac_mw": 110.0, "commissioned": "2020-05", "panels": 275000},
        {"org": sellers[3], "type": "WIND", "prefecture": "Hokkaido", "ac_mw": 75.0, "commissioned": "2021-08", "turbines": 25},

        # Osaka Green Energy
        {"org": sellers[4], "type": "PV", "prefecture": "Osaka", "ac_mw": 70.0, "commissioned": "2022-01", "panels": 175000},
        {"org": sellers[4], "type": "PV", "prefecture": "Kyoto", "ac_mw": 55.0, "commissioned": "2023-03", "panels": 137500},
    ]

    plants = []
    for p in plants_data:
        profile = {"commissioned": p["commissioned"]}
        if p["type"] == "PV":
            profile["panels"] = p["panels"]
        else:
            profile["turbines"] = p["turbines"]

        plants.append(models.Plant(
            org_id=p["org"].org_id,
            type=p["type"],
            prefecture=p["prefecture"],
            ac_mw=p["ac_mw"],
            profile_json=profile
        ))

    db.add_all(plants)
    db.commit()
    print(f"✅ Created {len(plants)} plants (PV: {sum(1 for p in plants if p.type == 'PV')}, Wind: {sum(1 for p in plants if p.type == 'WIND')})")

    # ===== AUCTIONS =====
    now = datetime.now()
    auctions_data = [
        # CLEARED auctions (past results)
        {
            "mode": "UNIFORM_PRICE",
            "area": "Kanto",
            "starts_at": now - timedelta(days=30),
            "ends_at": now - timedelta(days=23),
            "status": "CLEARED",
            "cleared_price": 14.2,
            "cleared_volume": 450.0
        },
        {
            "mode": "PAY_AS_BID",
            "area": "Kansai",
            "starts_at": now - timedelta(days=25),
            "ends_at": now - timedelta(days=18),
            "status": "CLEARED",
            "cleared_price": 13.8,
            "cleared_volume": 380.0
        },
        {
            "mode": "UNIFORM_PRICE",
            "area": "Kyushu",
            "starts_at": now - timedelta(days=20),
            "ends_at": now - timedelta(days=13),
            "status": "CLEARED",
            "cleared_price": 15.1,
            "cleared_volume": 520.0
        },

        # LOCKED auctions (ready for clearing)
        {
            "mode": "UNIFORM_PRICE",
            "area": "Tohoku",
            "starts_at": now - timedelta(days=10),
            "ends_at": now - timedelta(days=1),
            "status": "LOCKED",
            "cleared_price": None,
            "cleared_volume": None
        },

        # OPEN auctions (active bidding)
        {
            "mode": "UNIFORM_PRICE",
            "area": "Kanto",
            "starts_at": now - timedelta(days=3),
            "ends_at": now + timedelta(days=4),
            "status": "OPEN",
            "cleared_price": None,
            "cleared_volume": None
        },
        {
            "mode": "PAY_AS_BID",
            "area": "Kansai",
            "starts_at": now - timedelta(days=2),
            "ends_at": now + timedelta(days=5),
            "status": "OPEN",
            "cleared_price": None,
            "cleared_volume": None
        },
        {
            "mode": "UNIFORM_PRICE",
            "area": "Chubu",
            "starts_at": now - timedelta(days=1),
            "ends_at": now + timedelta(days=6),
            "status": "OPEN",
            "cleared_price": None,
            "cleared_volume": None
        },
        {
            "mode": "PAY_AS_BID",
            "area": "Hokkaido",
            "starts_at": now,
            "ends_at": now + timedelta(days=7),
            "status": "OPEN",
            "cleared_price": None,
            "cleared_volume": None
        },
    ]

    auctions = []
    for a in auctions_data:
        auctions.append(models.Auction(
            mode=a["mode"],
            area=a["area"],
            starts_at=a["starts_at"],
            ends_at=a["ends_at"],
            status=a["status"],
            cleared_price=a["cleared_price"],
            cleared_volume=a["cleared_volume"]
        ))

    db.add_all(auctions)
    db.commit()
    print(f"✅ Created {len(auctions)} auctions (Open: {sum(1 for a in auctions if a.status == 'OPEN')}, Locked: {sum(1 for a in auctions if a.status == 'LOCKED')}, Cleared: {sum(1 for a in auctions if a.status == 'CLEARED')})")

    # ===== LOTS =====
    lots = []

    # Lots for CLEARED auctions (auction 0, 1, 2)
    lots.extend([
        # Auction 0 (Kanto, CLEARED)
        models.Lot(auction_id=auctions[0].auction_id, plant_id=plants[0].plant_id,
                   min_vol_mwh=100.0, max_vol_mwh=300.0, reserve_price=12.5, step_mwh=20.0, allow_partial=True),
        models.Lot(auction_id=auctions[0].auction_id, plant_id=plants[2].plant_id,
                   min_vol_mwh=80.0, max_vol_mwh=250.0, reserve_price=13.0, step_mwh=15.0, allow_partial=True),

        # Auction 1 (Kansai, CLEARED)
        models.Lot(auction_id=auctions[1].auction_id, plant_id=plants[8].plant_id,
                   min_vol_mwh=60.0, max_vol_mwh=180.0, reserve_price=11.8, step_mwh=10.0, allow_partial=True),
        models.Lot(auction_id=auctions[1].auction_id, plant_id=plants[9].plant_id,
                   min_vol_mwh=50.0, max_vol_mwh=150.0, reserve_price=12.2, step_mwh=10.0, allow_partial=True),

        # Auction 2 (Kyushu, CLEARED)
        models.Lot(auction_id=auctions[2].auction_id, plant_id=plants[4].plant_id,
                   min_vol_mwh=120.0, max_vol_mwh=350.0, reserve_price=13.5, step_mwh=25.0, allow_partial=True),
        models.Lot(auction_id=auctions[2].auction_id, plant_id=plants[5].plant_id,
                   min_vol_mwh=90.0, max_vol_mwh=220.0, reserve_price=14.0, step_mwh=20.0, allow_partial=True),
    ])

    # Lots for LOCKED auction (auction 3)
    lots.extend([
        models.Lot(auction_id=auctions[3].auction_id, plant_id=plants[6].plant_id,
                   min_vol_mwh=95.0, max_vol_mwh=280.0, reserve_price=12.8, step_mwh=15.0, allow_partial=True),
        models.Lot(auction_id=auctions[3].auction_id, plant_id=plants[7].plant_id,
                   min_vol_mwh=70.0, max_vol_mwh=200.0, reserve_price=13.2, step_mwh=15.0, allow_partial=True),
    ])

    # Lots for OPEN auctions (auctions 4, 5, 6, 7)
    lots.extend([
        # Auction 4 (Kanto, OPEN)
        models.Lot(auction_id=auctions[4].auction_id, plant_id=plants[0].plant_id,
                   min_vol_mwh=110.0, max_vol_mwh=320.0, reserve_price=13.0, step_mwh=20.0, allow_partial=True),
        models.Lot(auction_id=auctions[4].auction_id, plant_id=plants[1].plant_id,
                   min_vol_mwh=75.0, max_vol_mwh=210.0, reserve_price=12.8, step_mwh=15.0, allow_partial=True),
        models.Lot(auction_id=auctions[4].auction_id, plant_id=plants[3].plant_id,
                   min_vol_mwh=55.0, max_vol_mwh=160.0, reserve_price=13.5, step_mwh=10.0, allow_partial=True),

        # Auction 5 (Kansai, OPEN)
        models.Lot(auction_id=auctions[5].auction_id, plant_id=plants[8].plant_id,
                   min_vol_mwh=65.0, max_vol_mwh=190.0, reserve_price=12.0, step_mwh=10.0, allow_partial=True),
        models.Lot(auction_id=auctions[5].auction_id, plant_id=plants[9].plant_id,
                   min_vol_mwh=50.0, max_vol_mwh=140.0, reserve_price=12.5, step_mwh=10.0, allow_partial=True),

        # Auction 6 (Chubu, OPEN)
        models.Lot(auction_id=auctions[6].auction_id, plant_id=plants[2].plant_id,
                   min_vol_mwh=85.0, max_vol_mwh=240.0, reserve_price=13.2, step_mwh=15.0, allow_partial=True),

        # Auction 7 (Hokkaido, OPEN)
        models.Lot(auction_id=auctions[7].auction_id, plant_id=plants[6].plant_id,
                   min_vol_mwh=100.0, max_vol_mwh=290.0, reserve_price=13.8, step_mwh=20.0, allow_partial=True),
        models.Lot(auction_id=auctions[7].auction_id, plant_id=plants[7].plant_id,
                   min_vol_mwh=80.0, max_vol_mwh=210.0, reserve_price=14.2, step_mwh=15.0, allow_partial=True),
    ])

    db.add_all(lots)
    db.commit()
    print(f"✅ Created {len(lots)} lots across all auctions")

    # ===== BIDS =====
    bids = []

    # Bids for CLEARED auctions (already matched)
    # Auction 0 bids
    bids.extend([
        models.Bid(auction_id=auctions[0].auction_id, org_id=buyers[0].org_id,
                   price_yen_kwh=15.5, volume_mwh=150.0, allow_partial=True, created_at=now - timedelta(days=28)),
        models.Bid(auction_id=auctions[0].auction_id, org_id=buyers[1].org_id,
                   price_yen_kwh=14.8, volume_mwh=200.0, allow_partial=True, created_at=now - timedelta(days=27)),
        models.Bid(auction_id=auctions[0].auction_id, org_id=buyers[2].org_id,
                   price_yen_kwh=14.0, volume_mwh=180.0, allow_partial=True, created_at=now - timedelta(days=26)),
    ])

    # Auction 1 bids
    bids.extend([
        models.Bid(auction_id=auctions[1].auction_id, org_id=buyers[3].org_id,
                   price_yen_kwh=14.5, volume_mwh=160.0, allow_partial=True, created_at=now - timedelta(days=23)),
        models.Bid(auction_id=auctions[1].auction_id, org_id=buyers[4].org_id,
                   price_yen_kwh=13.8, volume_mwh=140.0, allow_partial=True, created_at=now - timedelta(days=22)),
        models.Bid(auction_id=auctions[1].auction_id, org_id=buyers[5].org_id,
                   price_yen_kwh=13.2, volume_mwh=120.0, allow_partial=True, created_at=now - timedelta(days=21)),
    ])

    # Auction 2 bids
    bids.extend([
        models.Bid(auction_id=auctions[2].auction_id, org_id=buyers[0].org_id,
                   price_yen_kwh=16.0, volume_mwh=200.0, allow_partial=True, created_at=now - timedelta(days=18)),
        models.Bid(auction_id=auctions[2].auction_id, org_id=buyers[1].org_id,
                   price_yen_kwh=15.5, volume_mwh=180.0, allow_partial=True, created_at=now - timedelta(days=17)),
        models.Bid(auction_id=auctions[2].auction_id, org_id=buyers[2].org_id,
                   price_yen_kwh=14.8, volume_mwh=220.0, allow_partial=True, created_at=now - timedelta(days=16)),
    ])

    # Bids for LOCKED auction (ready for clearing)
    bids.extend([
        models.Bid(auction_id=auctions[3].auction_id, org_id=buyers[3].org_id,
                   price_yen_kwh=15.0, volume_mwh=170.0, allow_partial=True, created_at=now - timedelta(days=8)),
        models.Bid(auction_id=auctions[3].auction_id, org_id=buyers[4].org_id,
                   price_yen_kwh=14.2, volume_mwh=150.0, allow_partial=True, created_at=now - timedelta(days=7)),
        models.Bid(auction_id=auctions[3].auction_id, org_id=buyers[5].org_id,
                   price_yen_kwh=13.5, volume_mwh=130.0, allow_partial=True, created_at=now - timedelta(days=6)),
    ])

    # Bids for OPEN auctions
    # Auction 4 bids
    bids.extend([
        models.Bid(auction_id=auctions[4].auction_id, org_id=buyers[0].org_id,
                   price_yen_kwh=15.5, volume_mwh=180.0, allow_partial=True, created_at=now - timedelta(hours=48)),
        models.Bid(auction_id=auctions[4].auction_id, org_id=buyers[1].org_id,
                   price_yen_kwh=14.8, volume_mwh=160.0, allow_partial=True, created_at=now - timedelta(hours=36)),
        models.Bid(auction_id=auctions[4].auction_id, org_id=buyers[2].org_id,
                   price_yen_kwh=14.0, volume_mwh=140.0, allow_partial=True, created_at=now - timedelta(hours=24)),
    ])

    # Auction 5 bids
    bids.extend([
        models.Bid(auction_id=auctions[5].auction_id, org_id=buyers[3].org_id,
                   price_yen_kwh=14.5, volume_mwh=150.0, allow_partial=True, created_at=now - timedelta(hours=30)),
        models.Bid(auction_id=auctions[5].auction_id, org_id=buyers[4].org_id,
                   price_yen_kwh=13.8, volume_mwh=120.0, allow_partial=True, created_at=now - timedelta(hours=20)),
    ])

    # Auction 6 bids
    bids.extend([
        models.Bid(auction_id=auctions[6].auction_id, org_id=buyers[5].org_id,
                   price_yen_kwh=15.0, volume_mwh=130.0, allow_partial=True, created_at=now - timedelta(hours=12)),
    ])

    # Auction 7 has no bids yet (just opened)

    db.add_all(bids)
    db.commit()
    print(f"✅ Created {len(bids)} bids across all auctions")

    # ===== MATCHES (for cleared auctions) =====
    matches = []

    # Auction 0 matches (UNIFORM_PRICE at 14.2)
    matches.extend([
        models.Match(lot_id=lots[0].lot_id, bid_id=bids[0].bid_id, volume_mwh=150.0, price_yen_kwh=14.2),
        models.Match(lot_id=lots[0].lot_id, bid_id=bids[1].bid_id, volume_mwh=150.0, price_yen_kwh=14.2),
        models.Match(lot_id=lots[1].lot_id, bid_id=bids[1].bid_id, volume_mwh=50.0, price_yen_kwh=14.2),
        models.Match(lot_id=lots[1].lot_id, bid_id=bids[2].bid_id, volume_mwh=100.0, price_yen_kwh=14.2),
    ])

    # Auction 1 matches (PAY_AS_BID - different prices)
    matches.extend([
        models.Match(lot_id=lots[2].lot_id, bid_id=bids[3].bid_id, volume_mwh=120.0, price_yen_kwh=14.5),
        models.Match(lot_id=lots[3].lot_id, bid_id=bids[3].bid_id, volume_mwh=40.0, price_yen_kwh=14.5),
        models.Match(lot_id=lots[3].lot_id, bid_id=bids[4].bid_id, volume_mwh=110.0, price_yen_kwh=13.8),
        models.Match(lot_id=lots[2].lot_id, bid_id=bids[5].bid_id, volume_mwh=60.0, price_yen_kwh=13.2),
    ])

    # Auction 2 matches (UNIFORM_PRICE at 15.1)
    matches.extend([
        models.Match(lot_id=lots[4].lot_id, bid_id=bids[6].bid_id, volume_mwh=200.0, price_yen_kwh=15.1),
        models.Match(lot_id=lots[4].lot_id, bid_id=bids[7].bid_id, volume_mwh=150.0, price_yen_kwh=15.1),
        models.Match(lot_id=lots[5].lot_id, bid_id=bids[8].bid_id, volume_mwh=170.0, price_yen_kwh=15.1),
    ])

    db.add_all(matches)
    db.commit()
    print(f"✅ Created {len(matches)} matches for cleared auctions")

    # ===== SUMMARY =====
    print("\n" + "="*60)
    print("🎉 SEED COMPLETE - Database populated with realistic data")
    print("="*60)
    print(f"\n📊 Summary:")
    print(f"  Organizations: {db.query(models.Org).count()}")
    print(f"    - Sellers: {len(sellers)}")
    print(f"    - Buyers: {len(buyers)}")
    print(f"    - Operators: 1")
    print(f"  Users: {db.query(models.User).count()}")
    print(f"  Plants: {db.query(models.Plant).count()}")
    print(f"  Auctions: {db.query(models.Auction).count()}")
    print(f"    - Open: {sum(1 for a in auctions if a.status == 'OPEN')}")
    print(f"    - Locked: {sum(1 for a in auctions if a.status == 'LOCKED')}")
    print(f"    - Cleared: {sum(1 for a in auctions if a.status == 'CLEARED')}")
    print(f"  Lots: {db.query(models.Lot).count()}")
    print(f"  Bids: {db.query(models.Bid).count()}")
    print(f"  Matches: {db.query(models.Match).count()}")

    print(f"\n📋 Sample Organizations:")
    print(f"  Sellers: {', '.join([s.name for s in sellers[:3]])}")
    print(f"  Buyers: {', '.join([b.name for b in buyers[:3]])}")

    print(f"\n🏆 Cleared Auctions (with results):")
    for a in [auctions[0], auctions[1], auctions[2]]:
        print(f"  {a.area} ({a.mode}): ¥{a.cleared_price}/kWh, {a.cleared_volume} MWh")

    print(f"\n🔒 Locked Auction (ready for clearing):")
    print(f"  {auctions[3].area} ({auctions[3].mode}): {sum(1 for l in lots if l.auction_id == auctions[3].auction_id)} lots, {sum(1 for b in bids if b.auction_id == auctions[3].auction_id)} bids")

    print(f"\n🔓 Open Auctions (active bidding):")
    for a in [auctions[4], auctions[5], auctions[6], auctions[7]]:
        lot_count = sum(1 for l in lots if l.auction_id == a.auction_id)
        bid_count = sum(1 for b in bids if b.auction_id == a.auction_id)
        print(f"  {a.area} ({a.mode}): {lot_count} lots, {bid_count} bids")

    print("\n✅ Ready for demo! Login credentials: user@[org-name].jp / demo123")
    print("="*60 + "\n")

    db.close()


if __name__ == "__main__":
    seed_data()
