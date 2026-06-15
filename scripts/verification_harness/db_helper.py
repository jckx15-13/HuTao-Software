# db_helper.py
import os
import sys
import json
from pathlib import Path

# Add odysseus and odysseus/src to PYTHONPATH
ODYSSEUS_DIR = Path(__file__).resolve().parent.parent.parent / "odysseus"
sys.path.extend([str(ODYSSEUS_DIR), str(ODYSSEUS_DIR / "src")])

# Ensure DATABASE_URL points to the absolute path of app.db
db_path = ODYSSEUS_DIR / "data" / "app.db"
os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from core.database import SessionLocal, ModelEndpoint, Session, ChatMessage

def seed():
    print("Seeding database...")
    db = SessionLocal()
    try:
        # 1. Clean up existing mock records first to prevent duplicates/conflicts
        cleanup_logic(db)

        # 2. Seed ModelEndpoint
        mock_ep = ModelEndpoint(
            id="mock-endpoint",
            name="Mock Endpoint",
            base_url="http://127.0.0.1:9099/v1",
            api_key=None,
            is_enabled=True,
            hidden_models=None,
            cached_models=json.dumps(["mock-model"]),
            model_type="llm",
            supports_tools=False,
            owner=None
        )
        db.add(mock_ep)

        # 3. Seed Session
        mock_sess = Session(
            id="mock-session",
            name="Mock Session",
            endpoint_url="http://127.0.0.1:9099/v1/chat/completions",
            model="mock-model",
            owner="internal-tool",
            rag=False,
            archived=False,
            folder=None,
            headers={}
        )
        db.add(mock_sess)

        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

def cleanup_logic(db):
    # Delete chat messages belonging to mock session
    db.query(ChatMessage).filter(ChatMessage.session_id == "mock-session").delete()
    # Delete mock session
    db.query(Session).filter(Session.id == "mock-session").delete()
    # Delete mock model endpoint
    db.query(ModelEndpoint).filter(ModelEndpoint.id == "mock-endpoint").delete()

def cleanup():
    print("Cleaning up database...")
    db = SessionLocal()
    try:
        cleanup_logic(db)
        db.commit()
        print("Database cleaned up successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python db_helper.py [seed|cleanup]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    if command == "seed":
        seed()
    elif command == "cleanup":
        cleanup()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
