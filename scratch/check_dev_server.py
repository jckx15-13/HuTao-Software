import urllib.request
try:
    response = urllib.request.urlopen("http://127.0.0.1:3000/?fallback=true", timeout=5)
    print("Status:", response.status)
    print("Headers:", dict(response.headers))
    html = response.read().decode('utf-8')
    print("HTML Length:", len(html))
    print("HTML snippet:", html[:500])
except Exception as e:
    print("Error:", e)
