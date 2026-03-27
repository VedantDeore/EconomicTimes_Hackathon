from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_instance = Database()


async def connect_to_mongo():
    """Create MongoDB connection on startup."""
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]

    # Create indexes
    await create_indexes()
    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection on shutdown."""
    if db_instance.client:
        db_instance.client.close()
        print("🔌 MongoDB connection closed")


async def create_indexes():
    """Create all required indexes for collections."""
    db = db_instance.db

    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("partner_id")

    # Financial Profiles
    await db.financial_profiles.create_index("user_id", unique=True)

    # Goals
    await db.goals.create_index("user_id")
    await db.goals.create_index([("user_id", 1), ("status", 1)])

    # Investments
    await db.investments.create_index("user_id")
    await db.investments.create_index([("user_id", 1), ("source", 1)])

    # Tax Records
    await db.tax_records.create_index(
        [("user_id", 1), ("financial_year", 1)], unique=True
    )

    # Reports
    await db.reports.create_index([("user_id", 1), ("report_type", 1)])
    await db.reports.create_index([("generated_at", -1)])

    # Couples
    await db.couples.create_index("partner_1_id")
    await db.couples.create_index("partner_2_id")
    await db.couples.create_index("invite_code", unique=True)

    # Life Events
    await db.life_events.create_index("user_id")
    await db.life_events.create_index([("user_id", 1), ("event_type", 1)])


def get_database():
    """Dependency injection for database access."""
    return db_instance.db
