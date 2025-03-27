import re
import firebase_admin
from firebase_admin import credentials, firestore
from tqdm import tqdm

# === Config ===
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
COLLECTION_NAME = "2025JFK"
BATCH_SIZE = 500  # Adjust if needed

# === Initialize Firebase ===
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

# === Prefix lines to remove ===
cancellation_lines = {
    "title": [
        "Here is a clear and concise title for the document excerpt:",
        "Here is a clear and concise title under 15 words:"
    ],
    "description": [
        "Here is a summary of the document excerpt in 2-3 concise and informative sentences:",
        "Here is a concise and informative summary:",
        "Here is a summary of the document excerpt in 2-3 concise sentences:",
        "Here is a concise summary:",
        "Here is a summary of the document excerpt:",
        "Here is a summary of the excerpt in 2-3 concise and informative sentences:"
    ]
}

# === Text cleaner ===
def clean_text(text, lines):
    for line in lines:
        text = re.sub(f"^{re.escape(line)}", "", text.strip(), flags=re.IGNORECASE)
    text = re.sub(r'^[\'"]+|[\'"]+$', '', text).strip()
    return text

# === Batched Firestore cleaning ===
def clean_firestore_titles_and_descriptions(batch_size=BATCH_SIZE):
    print("🔍 Cleaning Firestore documents in batches...\n")
    last_doc = None
    total_cleaned = 0

    while True:
        query = db.collection(COLLECTION_NAME).order_by("__name__").limit(batch_size)
        if last_doc:
            query = query.start_after(last_doc)

        docs = list(query.stream())
        if not docs:
            break

        for doc in tqdm(docs, desc=f"Cleaning batch from {docs[0].id}"):
            data = doc.to_dict()
            update_data = {}

            if "title" in data:
                cleaned = clean_text(data["title"], cancellation_lines["title"])
                if cleaned != data["title"]:
                    update_data["title"] = cleaned

            if "description" in data:
                cleaned = clean_text(data["description"], cancellation_lines["description"])
                if cleaned != data["description"]:
                    update_data["description"] = cleaned

            if update_data:
                db.collection(COLLECTION_NAME).document(doc.id).update(update_data)
                print(f"✅ Cleaned {doc.id}")
                total_cleaned += 1

        last_doc = docs[-1]

    print(f"\n🎉 Done! Total documents cleaned: {total_cleaned}")

if __name__ == "__main__":
    clean_firestore_titles_and_descriptions()
