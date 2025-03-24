import json
import time
import logging
from multiprocessing import Pool
from tqdm import tqdm
import firebase_admin
from firebase_admin import credentials, firestore
from google.api_core.exceptions import Aborted, DeadlineExceeded, NotFound

# === CONFIG ===
CREDS_PATH         = r"C:\Users\adoro\Desktop\chatjfkfiles-9364c3addedd.json"
INDEX_PATH         = r"C:\Users\adoro\Desktop\JFK\indexes\reverse_word_index.json"
COLLECTION_NAME    = "word_index"
SKIP_NUMERIC       = True
MIN_WORD_LENGTH    = 2
MIN_TOTAL_COUNT    = 3
MAX_FILES_PER_DOC  = 200
MAX_BATCH          = 500
MAX_RETRIES        = 5
RETRY_DELAY        = 2
NUM_WORKERS        = 10

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s | %(message)s")

# Initialize Firebase once
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def sanitize_doc_id(word):
    return "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in word)

def is_valid(word, total):
    if SKIP_NUMERIC and any(c.isdigit() for c in word):
        return False
    return len(word) >= MIN_WORD_LENGTH and total >= MIN_TOTAL_COUNT

def chunk_list(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i+size]

def commit_batch(batch):
    for attempt in range(1, MAX_RETRIES+1):
        try:
            batch.commit()
            return
        except (Aborted, DeadlineExceeded) as e:
            logging.warning(f"Batch retry {attempt}/{MAX_RETRIES}: {e}")
            time.sleep(RETRY_DELAY)
    raise RuntimeError("Batch failed after retries")

def doc_exists(ref):
    try:
        return ref.get().exists
    except NotFound:
        return False

def process_word(item):
    word, counts = item
    total = sum(counts.values())
    if not is_valid(word, total):
        return (0, 1)

    files = [{"name": f, "count": c} for f, c in counts.items()]
    chunks = list(chunk_list(files, MAX_FILES_PER_DOC))
    base_id = sanitize_doc_id(word)

    writes = created = skipped = 0
    batch = db.batch()

    for i, chunk in enumerate(chunks, start=1):
        doc_id = base_id if len(chunks) == 1 else f"{base_id}__{i}"
        ref = db.collection(COLLECTION_NAME).document(doc_id)
        if doc_exists(ref):
            skipped += 1
        else:
            data = {"word": word, "files": chunk}
            if len(chunks) > 1:
                data["subIndex"] = True
            batch.set(ref, data)
            writes += 1
            created += 1

        if writes >= MAX_BATCH:
            commit_batch(batch)
            batch = db.batch()
            writes = 0

    if writes:
        commit_batch(batch)

    return (created, skipped)

def split_dict(d, n):
    items = list(d.items())
    chunk_size = len(items) // n + (1 if len(items) % n else 0)
    return [items[i*chunk_size:(i+1)*chunk_size] for i in range(n)]

if __name__ == "__main__":
    with open(INDEX_PATH, encoding="utf-8") as f:
        index = json.load(f)

    tasks = split_dict(index, NUM_WORKERS)
    total = len(index)
    created = skipped = 0

    with Pool(NUM_WORKERS) as pool, tqdm(total=total, desc="Words uploaded", unit="word") as pbar:
        for c, s in pool.imap_unordered(process_word, (item for chunk in tasks for item in chunk), chunksize=100):
            created += c
            skipped += s
            pbar.update()

    logging.info(f"✅ Done — {created} new docs, {skipped} skipped.") 
