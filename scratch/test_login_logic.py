import asyncio
import os
import certifi
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Mock passlib and jwt config
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    root_dir = Path(__file__).parent.parent
    load_dotenv(root_dir / "backend" / ".env")
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "moviq")
    jwt_secret = os.environ.get("JWT_SECRET")
    
    print(f"Connecting to MongoDB: {db_name}")
    print(f"JWT Secret: {jwt_secret[:10]}...")
    
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[db_name]
    
    email = "admin@moviq.in"
    password = "demo1234"
    
    print(f"Finding user: {email}")
    user = await db.users.find_one({"email": email.lower()})
    if not user:
        print("User not found!")
        return
        
    print("User found:", {k: v for k, v in user.items() if k != "password_hash"})
    
    # 1. Test password verification
    try:
        print("Verifying password...")
        verified = pwd_ctx.verify(password, user["password_hash"])
        print("Password verification result:", verified)
    except Exception as e:
        print("Password verification failed with exception:", e)
        import traceback
        traceback.print_exc()
        
    # 2. Test JWT creation
    try:
        print("Creating JWT...")
        payload = {
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=24 * 7),
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")
        print("JWT Token created successfully:", token[:20] + "...")
    except Exception as e:
        print("JWT creation failed with exception:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
