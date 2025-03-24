import json
import firebase_admin
from firebase_admin import credentials, firestore

# === CONFIG ===
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
OUTPUT_JSON = "data/docs_index.json"
COLLECTION = "2025JFK"

# Initialize
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def fetch_all_docs():
    docs = db.collection(COLLECTION).stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "id": doc.id,
            "title": data.get("title", doc.id),
            "description": data.get("description", ""),
        })
    return result

def main():
    print("Fetching all documents from Firestore...")
    docs = fetch_all_docs()
    print(f"Fetched {len(docs)} docs — writing to {OUTPUT_JSON}")
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)
    print("✅ Done.")

if __name__ == "__main__":
    main()
