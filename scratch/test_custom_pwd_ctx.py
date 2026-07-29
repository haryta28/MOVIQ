import bcrypt

# The hash stored in DB for admin@moviq.in (hashed via passlib bcrypt)
# We can check if bcrypt.checkpw works directly on it.
stored_hash = "$2b$12$V.s139.Wp5.6d4821a.7u.Z3a014ac2a283e2037312c714..." # example structure, let's use the real hash from DB

# Let's fetch the actual hash of admin@moviq.in from production DB
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
    
    user = await db.users.find_one({"email": "admin@moviq.in"})
    db_hash = user["password_hash"]
    print("Database Hash:", db_hash)
    
    # Test checking with direct bcrypt
    password = "demo1234"
    result = bcrypt.checkpw(password.encode("utf-8"), db_hash.encode("utf-8"))
    print("Verified successfully with direct bcrypt:", result)

if __name__ == "__main__":
    asyncio.run(main())
