import os
import firebase_admin
from firebase_admin import credentials, firestore
import json
from tqdm import tqdm

# CONFIGURATION
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"  # Update with your actual path
OUTPUT_JSON = r"C:\Users\\Desktop\2025JFK_export.json"             # Desired output file path
COLLECTION_NAME = "2025JFK"
MAX_BYTES = 9 * 700  # 9KB limit per record

# INITIALIZE FIREBASE ADMIN
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def default_serializer(obj):
    # Convert datetime objects to ISO format strings.
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def split_text_by_bytes(text, max_bytes=MAX_BYTES):
    """Splits text into chunks so that each chunk's UTF-8 encoding is no more than max_bytes."""
    chunks = []
    current_chunk = ""
    current_bytes = 0
    for char in text:
        char_bytes = len(char.encode('utf-8'))
        # If adding this character would exceed the limit and we have content in current_chunk, push current_chunk.
        if current_bytes + char_bytes > max_bytes and current_chunk:
            chunks.append(current_chunk)
            current_chunk = char
            current_bytes = char_bytes
        else:
            current_chunk += char
            current_bytes += char_bytes
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def export_collection(collection_name, output_path):
    # Fetch all documents in the collection.
    docs = list(db.collection(collection_name).stream())
    print(f"Found {len(docs)} documents in the '{collection_name}' collection.")

    export_data = []
    for doc in tqdm(docs, desc=f"Exporting {collection_name}"):
        data = doc.to_dict() or {}
        group_id = doc.id  # Use original doc ID as group identifier.
        # We'll remove the full text from the base record.
        full_text = data.pop("text", None)
        
        # Base record: without the text.
        base_record = data.copy()
        base_record["objectID"] = doc.id
        base_record["groupID"] = group_id

        if full_text:
            text_bytes = len(full_text.encode("utf-8"))
            if text_bytes <= MAX_BYTES:
                # If text is within limit, add it to the base record.
                base_record["text"] = full_text
                export_data.append(base_record)
            else:
                # Split the text into chunks.
                chunks = split_text_by_bytes(full_text, MAX_BYTES)
                # For each chunk, create a new record.
                for i, chunk in enumerate(chunks):
                    record = data.copy()  # Copy the rest of the fields.
                    record["objectID"] = f"{doc.id}_part{i+1}"
                    record["groupID"] = group_id
                    record["text"] = chunk
                    export_data.append(record)
        else:
            # No text field exists, simply add the base record.
            export_data.append(base_record)

    # Write the export_data array to a JSON file with a custom serializer.
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2, default=default_serializer)
    
    print(f"Exported {len(export_data)} records to '{output_path}'.")

if __name__ == "__main__":
    export_collection(COLLECTION_NAME, OUTPUT_JSON)
