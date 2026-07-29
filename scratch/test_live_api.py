import httpx

url = "https://moviq.onrender.com/api/auth/login"
print(f"Sending POST request to {url}...")
try:
    r = httpx.post(url, json={"email": "admin@moviq.in", "password": "demo1234"}, timeout=10)
    print("Status code:", r.status_code)
    print("Response headers:", dict(r.headers))
    print("Response body:", r.text)
except Exception as e:
    print("Error:", e)
