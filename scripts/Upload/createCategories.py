import os
import json
import re
import time
import requests
import threading
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import firebase_admin
from firebase_admin import credentials, firestore

# CONFIGURATION
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"
MAIN_DOC_COLLECTION = "2025JFK"              # Collection with your documents
CATEGORY_INDEX_COLLECTION = "categoriesIndex"  # Index collection for categories
GROUP_INDEX_COLLECTION = "groupsIndex"         # Index collection for groups
CACHE_FILE = r"C:\Users\\Desktop\group_cache.json"
MAX_ATTEMPTS = 3
NUM_WORKERS = 10

# Initialize Firebase
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Global cache and lock (to safely share among threads)
cache_lock = threading.Lock()
group_cache = {}

def load_cache(filepath: str) -> dict:
    """Load the grouping cache from disk (if it exists)."""
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load cache from {filepath}: {e}")
    return {}

def save_cache(cache: dict, filepath: str):
    """Save the grouping cache to disk."""
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=4)
        print(f"✅ Cache saved to {filepath}")
    except Exception as e:
        print(f"❌ Error saving cache: {e}")

def compute_cache_key(title: str, description: str) -> str:
    """
    Compute a cache key from the document's title and description.
    (We normalize by stripping and lowercasing.)
    """
    hasher = hashlib.md5()
    combined = (title.strip().lower() + description.strip().lower()).encode('utf-8')
    hasher.update(combined)
    return hasher.hexdigest()

def generate_category_and_group(title: str, description: str) -> dict:
    """
    Uses Llama to classify a document into a plain category and a high-level group.
    The prompt is straightforward (no extra dramatic language).
    
    Expected output (example):
    { "category": "Government Documents", "group": "Reports and Investigations" }
    """
    prompt = (
        f"Classify the following document into a specific category and assign it a high-level group. "
        f"Use clear, plain language appropriate for JFK assassination files.\n\n"
        f"Title: {title}\n"
        f"Description: {description}\n\n"
        f"Return a valid JSON object with two keys: \"category\" and \"group\".\n\n"
        f"Example output:\n"
        f'{{ "category": "CIA Documents", "group": "Reports and Investigations" }}'
    )
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt},
            stream=True
        )
    except Exception as e:
        print(f"❌ Error connecting to Llama: {e}")
        return {}
    
    full_response = ""
    for line in response.iter_lines():
        if line:
            try:
                data = json.loads(line.decode("utf-8"))
                full_response += data.get("response", "")
            except Exception as e:
                print(f"❌ Error decoding response chunk: {e}")
    full_response = full_response.strip()
    # Extract JSON portion: use first "{" and last "}"
    start = full_response.find("{")
    end = full_response.rfind("}")
    json_str = full_response[start:end+1] if start != -1 and end != -1 and end > start else full_response
    try:
        result = json.loads(json_str)
        if isinstance(result, dict) and "category" in result and "group" in result:
            return result
        else:
            print("⚠️ Unexpected format in generated result:", result)
            return {}
    except json.JSONDecodeError as e:
        print("⚠️ JSON decoding error in generated result:", e)
        return {}

def update_document(doc_id: str, category: str, group: str):
    """Update the document with the new 'category' and 'group' fields (overwriting any existing ones)."""
    try:
        db.collection(MAIN_DOC_COLLECTION).document(doc_id).update({
            "category": category,
            "group": group
        })
    except Exception as e:
        print(f"❌ Error updating document {doc_id}: {e}")

def sanitize_for_doc_id(value: str) -> str:
    """Sanitize a string for use as a Firestore document ID (e.g., replace '/' and ':' with underscores)."""
    return value.replace('/', '_').replace(':', '_').strip()

def update_category_index(category: str, doc_id: str):
    """Update the categoriesIndex collection by adding doc_id under the sanitized category document."""
    try:
        sanitized = sanitize_for_doc_id(category)
        db.collection(CATEGORY_INDEX_COLLECTION).document(sanitized).set({
            "doc_ids": firestore.ArrayUnion([doc_id]),
            "original_category": category
        }, merge=True)
    except Exception as e:
        print(f"❌ Error updating category index for {category}: {e}")

def update_group_index(group: str, doc_id: str):
    """Update the groupsIndex collection by adding doc_id under the sanitized group document."""
    try:
        sanitized = sanitize_for_doc_id(group)
        db.collection(GROUP_INDEX_COLLECTION).document(sanitized).set({
            "doc_ids": firestore.ArrayUnion([doc_id]),
            "original_group": group
        }, merge=True)
    except Exception as e:
        print(f"❌ Error updating group index for {group}: {e}")

def process_document(doc: dict):
    """
    Process a single document:
      - Compute a cache key based on title and description.
      - Check the local cache for a previously generated grouping.
      - If not found, call Llama (retrying up to MAX_ATTEMPTS) to generate a new grouping.
      - Update the document with the new "category" and "group".
      - Update the category and group index collections.
    """
    doc_id = doc["doc_id"]
    title = doc["title"]
    description = doc["description"]
    key = compute_cache_key(title, description)
    
    # Check cache
    with cache_lock:
        cached = group_cache.get(key)
    
    if cached:
        result = cached
        print(f"♻️ Using cached grouping for document {doc_id}")
    else:
        result = {}
        attempt = 0
        while attempt < MAX_ATTEMPTS and not result:
            result = generate_category_and_group(title, description)
            if result and result.get("category") and result.get("group"):
                break
            attempt += 1
            print(f"Retrying Llama for document {doc_id} (Attempt {attempt+1}/{MAX_ATTEMPTS})...")
            time.sleep(1)
        if not result:
            print(f"⚠️ [{doc_id}] Failed to generate grouping after {MAX_ATTEMPTS} attempts.")
            return
        # Save result to cache
        with cache_lock:
            group_cache[key] = result

    # Remove any leading/trailing slashes and whitespace
    category = result["category"].strip(" /")
    group = result["group"].strip(" /")
    
    update_document(doc_id, category, group)
    update_category_index(category, doc_id)
    update_group_index(group, doc_id)
    print(f"✅ [{doc_id}] Updated with category: {category} | group: {group}")

def fetch_documents():
    """
    Fetch all documents from the main collection (that have title and description).
    """
    documents = []
    try:
        docs = db.collection(MAIN_DOC_COLLECTION).stream()
        for doc in docs:
            data = doc.to_dict()
            title = data.get("title", "")
            description = data.get("description", "")
            if title and description:
                documents.append({"doc_id": doc.id, "title": title, "description": description})
            else:
                print(f"⚠️ Skipping document {doc.id}: Missing title or description.")
        print(f"📂 Retrieved {len(documents)} documents from Firestore.")
    except Exception as e:
        print(f"❌ Error fetching documents from Firestore: {e}")
    return documents

def main():
    global group_cache
    group_cache = load_cache(CACHE_FILE)
    print(f"Loaded cache with {len(group_cache)} entries.")
    
    documents = fetch_documents()
    if not documents:
        print("❌ No documents to process.")
        return

    print(f"🚀 Processing {len(documents)} documents with {NUM_WORKERS} workers (fresh start)...")
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = [executor.submit(process_document, doc) for doc in documents]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print("❌ Exception in worker:", e)

    save_cache(group_cache, CACHE_FILE)
    print("✅ All documents processed. Fresh category and group assignments updated.")

if __name__ == "__main__":
    main()
