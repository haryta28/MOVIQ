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
    
    print("--- Sample Task ---")
    t = await db.tasks.find_one()
    print(t)

if __name__ == "__main__":
    asyncio.run(main())
