import json
import os
import firebase_admin
from firebase_admin import credentials, firestore
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Update with your actual paths
DESKTOP = os.path.expanduser("~/Desktop")
NER_INDEX_PATH = os.path.join(DESKTOP, "JFK", "ner_index.json")
TIMELINE_INDEX_PATH = os.path.join(DESKTOP, "JFK", "timeline_index.json")
CREDENTIALS_PATH = os.path.join(DESKTOP, "chatjfkfiles-9364c3addedd.json")

# Firestore Collection Names
NER_COLLECTION = "nameEntityIndex"
TIMELINE_COLLECTION = "timeLineIndex"

# Initialize Firebase Admin SDK
cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def sanitize_doc_id(entity):
    return re.sub(r"[^\w\s\-]", "", entity.strip())

def upload_single_ner(entity, label_map):
    try:
        doc_id = sanitize_doc_id(entity)
        if not doc_id:
            return None
        doc_ref = db.collection(NER_COLLECTION).document(doc_id)
        if doc_ref.get().exists:
            return None  # already exists, skip
        doc_ref.set({"labels": label_map})
        return doc_id
    except Exception as e:
        print(f"❌ Error uploading entity '{entity}': {e}")
        return None

def upload_ner_index(max_workers=16):
    print("📦 Uploading NER index to Firestore...")
    with open(NER_INDEX_PATH, "r", encoding="utf-8") as f:
        ner_data = json.load(f)

    total = len(ner_data)
    uploaded = 0
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(upload_single_ner, entity, label_map) for entity, label_map in ner_data.items()]
        for future in as_completed(futures):
            result = future.result()
            if result:
                uploaded += 1

    print(f"✅ Uploaded {uploaded}/{total} named entities to '{NER_COLLECTION}'")


def upload_timeline_index():
    print("📅 Uploading timeline index to Firestore...")
    with open(TIMELINE_INDEX_PATH, "r", encoding="utf-8") as f:
        timeline_data = json.load(f)

    count = 0
    for date_str, files in timeline_data.items():
        # Try to extract a valid year and filter out invalid ranges
        try:
            year = int(re.findall(r"\d{4}", date_str)[0])
            if year < 1700 or year > 2025:
                continue
        except (IndexError, ValueError):
            continue  # skip if no 4-digit year found

        doc_id = date_str.strip()
        doc_data = { "sources": files }
        db.collection(TIMELINE_COLLECTION).document(doc_id).set(doc_data)
        count += 1

    print(f"✅ Uploaded {count} valid dates to '{TIMELINE_COLLECTION}'")

def main():
    upload_ner_index()
    upload_timeline_index()

if __name__ == "__main__":
    main()
