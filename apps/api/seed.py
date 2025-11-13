"""Seed script for RE-Auction Simulator"""
from datetime import datetime, timedelta
from database import SessionLocal
import models
from passlib.hash import bcrypt

def seed_data():
    db = SessionLocal()

    print("Seeding database...")

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

    # Create organizations
    seller_org = models.Org(name="Tokyo Solar Corp", type=models.OrgType.SELLER.value)
    buyer_org1 = models.Org(name="Kansai Energy Trading", type=models.OrgType.BUYER.value)
    buyer_org2 = models.Org(name="Hokkaido Power Co", type=models.OrgType.BUYER.value)
    operator_org = models.Org(name="JEPX Auction Operator", type=models.OrgType.OPERATOR.value)

    db.add_all([seller_org, buyer_org1, buyer_org2, operator_org])
    db.commit()

    print(f"Created {4} organizations")

    # Create users
    users = [
        models.User(
            org_id=seller_org.org_id,
            email="seller@tokyo-solar.jp",
            role=models.UserRole.SELLER.value,
            pwd_hash=bcrypt.hash("password123")
        ),
        models.User(
            org_id=buyer_org1.org_id,
            email="buyer@kansai-energy.jp",
            role=models.UserRole.BUYER.value,
            pwd_hash=bcrypt.hash("password123")
        ),
        models.User(
            org_id=buyer_org2.org_id,
            email="buyer@hokkaido-power.jp",
            role=models.UserRole.BUYER.value,
            pwd_hash=bcrypt.hash("password123")
        ),
        models.User(
            org_id=operator_org.org_id,
            email="operator@jepx.jp",
            role=models.UserRole.OPERATOR.value,
            pwd_hash=bcrypt.hash("password123")
        ),
    ]
    db.add_all(users)
    db.commit()

    print(f"Created {len(users)} users")

    # Create plants
    plants = [
        models.Plant(
            org_id=seller_org.org_id,
            type=models.PlantType.PV.value,
            prefecture="Tokyo",
            ac_mw=50.0,
            profile_json={"commissioned": "2020-04", "panels": 125000}
        ),
        models.Plant(
            org_id=seller_org.org_id,
            type=models.PlantType.WIND.value,
            prefecture="Akita",
            ac_mw=30.0,
            profile_json={"commissioned": "2021-11", "turbines": 10}
        ),
        models.Plant(
            org_id=seller_org.org_id,
            type=models.PlantType.PV.value,
            prefecture="Osaka",
            ac_mw=25.0,
            profile_json={"commissioned": "2022-06", "panels": 62500}
        ),
    ]
    db.add_all(plants)
    db.commit()

    print(f"Created {len(plants)} plants")

    # Create auctions
    now = datetime.now()
    auction1 = models.Auction(
        mode=models.AuctionMode.UNIFORM_PRICE.value,
        area="Kanto",
        starts_at=now - timedelta(days=2),
        ends_at=now + timedelta(days=5),
        status=models.AuctionStatus.OPEN.value
    )
    auction2 = models.Auction(
        mode=models.AuctionMode.PAY_AS_BID.value,
        area="Kansai",
        starts_at=now - timedelta(days=1),
        ends_at=now + timedelta(days=7),
        status=models.AuctionStatus.OPEN.value
    )

    db.add_all([auction1, auction2])
    db.commit()

    print(f"Created 2 auctions")

    # Create lots for auction1
    lots_auction1 = [
        models.Lot(
            auction_id=auction1.auction_id,
            plant_id=plants[0].plant_id,
            min_vol_mwh=50.0,
            max_vol_mwh=200.0,
            reserve_price=12.0,
            step_mwh=10.0,
            allow_partial=True
        ),
        models.Lot(
            auction_id=auction1.auction_id,
            plant_id=plants[1].plant_id,
            min_vol_mwh=30.0,
            max_vol_mwh=150.0,
            reserve_price=11.5,
            step_mwh=10.0,
            allow_partial=True
        ),
    ]

    # Create lots for auction2
    lots_auction2 = [
        models.Lot(
            auction_id=auction2.auction_id,
            plant_id=plants[2].plant_id,
            min_vol_mwh=40.0,
            max_vol_mwh=100.0,
            reserve_price=13.0,
            step_mwh=5.0,
            allow_partial=True
        ),
    ]

    db.add_all(lots_auction1 + lots_auction2)
    db.commit()

    print(f"Created {len(lots_auction1) + len(lots_auction2)} lots")

    # Create bids for auction1
    bids_auction1 = [
        models.Bid(
            auction_id=auction1.auction_id,
            org_id=buyer_org1.org_id,
            price_yen_kwh=15.5,
            volume_mwh=120.0,
            allow_partial=True,
            created_at=now - timedelta(hours=10)
        ),
        models.Bid(
            auction_id=auction1.auction_id,
            org_id=buyer_org1.org_id,
            price_yen_kwh=14.0,
            volume_mwh=80.0,
            allow_partial=True,
            created_at=now - timedelta(hours=9)
        ),
        models.Bid(
            auction_id=auction1.auction_id,
            org_id=buyer_org2.org_id,
            price_yen_kwh=16.0,
            volume_mwh=100.0,
            allow_partial=True,
            created_at=now - timedelta(hours=8)
        ),
        models.Bid(
            auction_id=auction1.auction_id,
            org_id=buyer_org2.org_id,
            price_yen_kwh=13.5,
            volume_mwh=90.0,
            allow_partial=True,
            created_at=now - timedelta(hours=7)
        ),
        models.Bid(
            auction_id=auction1.auction_id,
            org_id=buyer_org2.org_id,
            price_yen_kwh=12.5,
            volume_mwh=60.0,
            allow_partial=False,
            created_at=now - timedelta(hours=6)
        ),
    ]

    # Create bids for auction2
    bids_auction2 = [
        models.Bid(
            auction_id=auction2.auction_id,
            org_id=buyer_org1.org_id,
            price_yen_kwh=14.5,
            volume_mwh=70.0,
            allow_partial=True,
            created_at=now - timedelta(hours=5)
        ),
        models.Bid(
            auction_id=auction2.auction_id,
            org_id=buyer_org2.org_id,
            price_yen_kwh=15.0,
            volume_mwh=50.0,
            allow_partial=True,
            created_at=now - timedelta(hours=4)
        ),
        models.Bid(
            auction_id=auction2.auction_id,
            org_id=buyer_org2.org_id,
            price_yen_kwh=13.0,
            volume_mwh=40.0,
            allow_partial=True,
            created_at=now - timedelta(hours=3)
        ),
    ]

    db.add_all(bids_auction1 + bids_auction2)
    db.commit()

    print(f"Created {len(bids_auction1) + len(bids_auction2)} bids")

    print("\n=== Seed Summary ===")
    print(f"Organizations: {db.query(models.Org).count()}")
    print(f"Users: {db.query(models.User).count()}")
    print(f"Plants: {db.query(models.Plant).count()}")
    print(f"Auctions: {db.query(models.Auction).count()}")
    print(f"Lots: {db.query(models.Lot).count()}")
    print(f"Bids: {db.query(models.Bid).count()}")
    print("\n=== Ready for demo ===")
    print(f"Auction 1 (ID={auction1.auction_id}): {auction1.mode}, {auction1.area}")
    print(f"  - Status: {auction1.status}")
    print(f"  - Lots: {len(lots_auction1)}")
    print(f"  - Bids: {len(bids_auction1)}")
    print(f"\nAuction 2 (ID={auction2.auction_id}): {auction2.mode}, {auction2.area}")
    print(f"  - Status: {auction2.status}")
    print(f"  - Lots: {len(lots_auction2)}")
    print(f"  - Bids: {len(bids_auction2)}")

    db.close()


if __name__ == "__main__":
    seed_data()
