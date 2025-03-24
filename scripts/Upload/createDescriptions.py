import os
import json
import requests
from tqdm import tqdm
import firebase_admin
from firebase_admin import credentials, firestore

# Config
TEXT_FOLDER = r"C:\Users\\Desktop\JFK\extracted_texts"
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

# Init Firebase
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def read_first_words_from_txt(filepath, limit=1000):
    with open(filepath, "r", encoding="utf-8") as f:
        words = f.read().split()
        return " ".join(words[:limit])

def generate_description(text, doc_id):
    prompt = (
        f"Summarize the following document excerpt in 2–3 concise and informative sentences. "
        f"Do not begin with phrases like 'This document' or 'The following excerpt.' Be direct and professional.\n\n"
        f"{text}"
    )

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": MODEL_NAME, "prompt": prompt},
            stream=True
        )
    except Exception as e:
        print(f"❌ [Request Error] {doc_id}: {e}")
        return ""

    output = ""
    for line in response.iter_lines():
        if line:
            try:
                data = json.loads(line.decode("utf-8"))
                output += data.get("response", "")
            except Exception as e:
                print(f"❌ [Chunk Error] {doc_id}: {e}")

    output = output.strip().strip('"')
    return output

def process_documents():
    files = [f for f in os.listdir(TEXT_FOLDER) if f.endswith(".txt")]
    print(f"📂 Found {len(files)} text files to process...\n")

    for filename in tqdm(files, desc="Processing files"):
        doc_id = filename.replace(".txt", "")
        filepath = os.path.join(TEXT_FOLDER, filename)

        try:
            text = read_first_words_from_txt(filepath)
            description = generate_description(text, doc_id)

            if description and len(description.split()) > 3:
                db.collection("2025JFK").document(doc_id).set({
                    "description": description
                }, merge=True)
                print(f"✅ [{doc_id}] Description: {description}")
            else:
                print(f"⚠️ [{doc_id}] No valid description generated.")

        except Exception as e:
            print(f"❌ [{doc_id}] Processing error: {e}")

if __name__ == "__main__":
    process_documents()
