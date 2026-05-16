import os

SYNC_FILE = os.path.join("bridge", "latest_sync.txt")

def main():
    print("="*40)
    print("SILVER WOLF VI - AI CONTEXT SYNC")
    print("="*40)
    
    if not os.path.exists(SYNC_FILE):
        print("No sync data found. Interact with the app first.")
        return

    with open(SYNC_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    print("\nLATEST APP INTERACTIONS:\n")
    print(content)
    print("\n" + "="*40)
    print("ANTIGRAVITY: Please review the latest app interactions above.")
    print("="*40)

if __name__ == "__main__":
    main()
