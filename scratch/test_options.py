import httpx

url = "https://moviq.onrender.com/api/auth/login"
print(f"Sending OPTIONS request to {url}...")
try:
    r = httpx.options(url, headers={
        "Origin": "https://moviq.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }, timeout=10)
    print("Status code:", r.status_code)
    print("Response headers:", dict(r.headers))
    print("Response body:", r.text)
except Exception as e:
    print("Error:", e)
