import httpx

# Test 1: login with non-existent user
url = "https://moviq.onrender.com/api/auth/login"
print("Test 1: POST with non-existent user...")
try:
    r = httpx.post(url, json={"email": "nonexistent@company.in", "password": "password123"}, timeout=10)
    print("Status code:", r.status_code)
    print("Response headers:", dict(r.headers))
    print("Response body:", r.text)
except Exception as e:
    print("Error:", e)

# Test 2: login with real user but wrong password
print("\nTest 2: POST with real user but wrong password...")
try:
    r = httpx.post(url, json={"email": "admin@moviq.in", "password": "wrongpassword"}, timeout=10)
    print("Status code:", r.status_code)
    print("Response headers:", dict(r.headers))
    print("Response body:", r.text)
except Exception as e:
    print("Error:", e)
