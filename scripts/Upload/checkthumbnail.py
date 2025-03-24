import firebase_admin
from firebase_admin import credentials, firestore

# === Config ===
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
COLLECTION_NAME = "2025JFK"

# === Initialize Firestore ===
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

# === Fetch documents and check thumbnails ===
def check_missing_thumbnails():
    print(f"Checking collection: {COLLECTION_NAME}...")
    missing = []

    docs = db.collection(COLLECTION_NAME).stream()
    total = 0

    for doc in docs:
        total += 1
        data = doc.to_dict()
        thumbnails = data.get("thumbnails")

        if not isinstance(thumbnails, list) or len(thumbnails) == 0:
            missing.append(doc.id)

    print(f"\n✅ Done. Total docs checked: {total}")
    print(f"❌ Docs missing thumbnails: {len(missing)}")

    if missing:
        print("\nList of docs without thumbnails:")
        for doc_id in missing:
            print(f" - {doc_id}")

if __name__ == "__main__":
    check_missing_thumbnails()
