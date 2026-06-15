import urllib.request
import urllib.error
import json
import sys

def check_get(url):
    print(f"Checking GET {url} ...")
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            body = response.read().decode('utf-8')
            print(f"  [SUCCESS] Status: {status}")
            return status, body
    except urllib.error.HTTPError as e:
        print(f"  [HTTPError] Status: {e.code}")
        return e.code, None
    except Exception as e:
        print(f"  [Error] {e}")
        return None, None

def check_post_chat(url):
    print(f"Checking POST {url} ...")
    data = json.dumps({"message": "ping", "system_instruction": ""}).encode('utf-8')
    headers = {"Content-Type": "application/json"}
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode('utf-8')
            print(f"  [SUCCESS] Status: {status}")
            print(f"  Body: {body}")
            return status, body
    except urllib.error.HTTPError as e:
        print(f"  [HTTPError] Status: {e.code}")
        try:
            err_body = e.read().decode('utf-8')
            print(f"  Error body: {err_body}")
        except:
            pass
        return e.code, None
    except Exception as e:
        print(f"  [Error] {e}")
        return None, None

def main():
    print("=== Silver Wolf VI Port & Services Check ===")
    
    # 1. Vite (3000)
    vite_status, _ = check_get("http://127.0.0.1:3000")
    
    # 2. FastAPI Bridge (8001) status
    bridge_status, bridge_body = check_get("http://127.0.0.1:8001/status")
    
    # 3. Odysseus (7000) health
    odysseus_status, odysseus_body = check_get("http://127.0.0.1:7000/api/health")
    
    # 4. Chat proxy via bridge
    chat_status, chat_body = check_post_chat("http://127.0.0.1:8001/chat")
    
    print("=== Results Summary ===")
    print(f"Vite (3000) Health: {'OK' if vite_status == 200 else 'FAILED'}")
    print(f"Bridge (8001) Status: {'OK' if bridge_status == 200 else 'FAILED'}")
    print(f"Odysseus (7000) Health: {'OK' if odysseus_status == 200 else 'FAILED'}")
    print(f"Chat Proxy via Bridge: {'OK' if chat_status == 200 else 'FAILED'}")

if __name__ == "__main__":
    main()
