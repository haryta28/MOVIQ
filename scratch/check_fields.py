import asyncio
import os
import certifi
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    root_dir = Path(__file__).parent.parent
    load_dotenv(root_dir / "backend" / ".env")
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "moviq")
    
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[db_name]
    
    print("--- Sample Field Executive ---")
    f = await db.field_executives.find_one()
    print(f)
    
    print("\n--- Sample Supervisor ---")
    s = await db.supervisors.find_one()
    print(s)

if __name__ == "__main__":
    asyncio.run(main())
