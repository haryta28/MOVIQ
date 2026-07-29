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
    print(f"Connecting to MongoDB: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[db_name]
    
    try:
        colls = await db.list_collection_names()
        print("Collections in database:", colls)
        
        for coll_name in colls:
            count = await db[coll_name].count_documents({})
            print(f"Collection '{coll_name}': {count} documents")
            
        print("\nListing users in 'users' collection:")
        async for u in db.users.find():
            u_print = {k: v for k, v in u.items() if k != "password_hash"}
            print(u_print)
    except Exception as e:
        print("Database error:", e)

if __name__ == "__main__":
    asyncio.run(main())
