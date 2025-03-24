import os
import firebase_admin
from firebase_admin import credentials, firestore
import requests
import json
from tqdm import tqdm

# CONFIG
TEXT_FOLDER = r"C:\Users\\Desktop\JFK\extracted_texts"
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"
LOG_FILE = "title_generation.log"

# INIT
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def read_first_words_from_txt(filepath, limit=1000):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            words = f.read().split()
            return " ".join(words[:limit])
    except Exception as e:
        print(f"❌ Failed to read file {filepath}: {e}")
        return ""

import json
import requests

def generate_title(text):
    prompt = f"Give a clear and concise title (under 15 words) for the following document excerpt:\n\n{text}"
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt},
            stream=True  # important!
        )

        full_title = ""
        for line in response.iter_lines():
            if not line:
                continue
            try:
                data = json.loads(line.decode("utf-8"))
                chunk = data.get("response", "")
                full_title += chunk
            except json.JSONDecodeError as e:
                print("⚠️ JSON decode error:", e)
                print("🧨 Problematic line:", line.decode("utf-8"))

        cleaned = full_title.strip().strip('"')
        return cleaned if cleaned else None
    except Exception as e:
        print(f"❌ Ollama request error: {e}")
        return None



def log_to_file(message):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(message + "\n")

def process_documents():
    files = [f for f in os.listdir(TEXT_FOLDER) if f.endswith(".txt")]
    print(f"📂 Found {len(files)} text files to process...\n")

    for filename in tqdm(files, desc="Processing files"):
        doc_id = filename.replace(".txt", "")
        filepath = os.path.join(TEXT_FOLDER, filename)

        try:
            text = read_first_words_from_txt(filepath)
            if not text:
                print(f"⚠️ Skipping {filename}: empty or unreadable.")
                continue

            title = generate_title(text)

            if title and len(title) > 4:  # Avoid junk like "Here"
                db.collection("2025JFK").document(doc_id).set({"title": title}, merge=True)
                print(f"✅ {doc_id} — Title saved: {title}")
                log_to_file(f"{doc_id}: {title}")
            else:
                print(f"⚠️ {doc_id} — No valid title generated.")
                log_to_file(f"{doc_id}: FAILED - Empty or short title")
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
            log_to_file(f"{doc_id}: ERROR - {e}")

if __name__ == "__main__":
    process_documents()
