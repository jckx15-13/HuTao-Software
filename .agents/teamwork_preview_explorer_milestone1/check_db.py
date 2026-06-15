import sqlite3
import json
import os

db_path = r"c:\Users\jaron\OneDrive - Ministry of Education (M365 T&L)\Documents\silver-wolf-vi\odysseus\data\app.db"

def main():
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=== Model Endpoints ===")
    try:
        cursor.execute("SELECT id, name, base_url, is_enabled, cached_models, owner FROM model_endpoints")
        rows = cursor.fetchall()
        for r in rows:
            print(f"ID: {r[0]}")
            print(f"  Name: {r[1]}")
            print(f"  Base URL: {r[2]}")
            print(f"  Enabled: {r[3]}")
            print(f"  Cached Models: {r[4]}")
            print(f"  Owner: {r[5]}")
    except Exception as e:
        print(f"Error reading model_endpoints: {e}")
        
    print("\n=== Sessions ===")
    try:
        cursor.execute("SELECT id, name, endpoint_url, model, owner FROM sessions")
        rows = cursor.fetchall()
        for r in rows:
            print(f"ID: {r[0]}")
            print(f"  Name: {r[1]}")
            print(f"  Endpoint URL: {r[2]}")
            print(f"  Model: {r[3]}")
            print(f"  Owner: {r[4]}")
    except Exception as e:
        print(f"Error reading sessions: {e}")
        
    conn.close()

if __name__ == "__main__":
    main()
