import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# === Config ===
creds_path = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
index_path = r"C:\Users\\Desktop\JFK\indexes\1to4gram_index.json"
MIN_TOTAL_COUNT = 3
MAX_FILES_PER_DOC = 200
BATCH_LIMIT = 500

# === Firestore Setup ===
cred = credentials.Certificate(creds_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

def chunk_list(lst, chunk_size):
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i+chunk_size]

def is_valid_ngram(ngram):
    words = ngram.split()
    
    # Skip if any word contains a digit
    if any(any(char.isdigit() for char in word) for word in words):
        return False

    # Skip if any word is too short
    if any(len(word) < 2 for word in words):
        return False

    return True

def upload_ngram_index(path):
    with open(path, "r", encoding="utf-8") as f:
        index = json.load(f)

    total_written = 0

    for n_str, ngram_map in index.items():
        if n_str == "1":
            print(f"⏭️ Skipping 1-grams ({len(ngram_map)} entries)...")
            continue

        print(f"Processing {len(ngram_map)} {n_str}-grams...")
        subcol = db.collection("ngram_index").document(n_str).collection("grams")

        batch = db.batch()
        batch_size = 0

        for ngram, file_counts in ngram_map.items():
            total_count = sum(file_counts.values())
            if total_count < MIN_TOTAL_COUNT:
                continue
            if not is_valid_ngram(ngram):
                continue

            files_list = [{"name": fname, "count": count} for fname, count in file_counts.items()]
            if len(files_list) > MAX_FILES_PER_DOC:
                for i, chunk in enumerate(chunk_list(files_list, MAX_FILES_PER_DOC)):
                    doc_id = f"{ngram}__{i+1}"
                    doc_ref = subcol.document(doc_id)
                    batch.set(doc_ref, {
                        "ngram": ngram,
                        "files": chunk,
                        "subIndex": True
                    })
                    batch_size += 1
                    total_written += 1
                    if batch_size >= BATCH_LIMIT:
                        batch.commit()
                        batch = db.batch()
                        batch_size = 0
            else:
                doc_ref = subcol.document(ngram)
                batch.set(doc_ref, {
                    "ngram": ngram,
                    "files": files_list
                })
                batch_size += 1
                total_written += 1
                if batch_size >= BATCH_LIMIT:
                    batch.commit()
                    batch = db.batch()
                    batch_size = 0

        if batch_size > 0:
            batch.commit()

        print(f"✔ Uploaded {total_written} documents for {n_str}-grams.")

    print(f"✅ DONE: Uploaded total of {total_written} n-gram documents to Firestore.")



if __name__ == "__main__":
    upload_ngram_index(index_path)
