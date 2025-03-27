import os
import firebase_admin
from firebase_admin import credentials, firestore
import json
from tqdm import tqdm

# CONFIGURATION
CREDS_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"  # Update with your actual path
OUTPUT_JSON = r"C:\Users\\Desktop\2025JFK_export.json"             # Desired output file path
COLLECTION_NAME = "2025JFK"

# INITIALIZE FIREBASE ADMIN
cred = credentials.Certificate(CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

def default_serializer(obj):
    # Convert datetime objects (e.g. Firestore's DatetimeWithNanoseconds) to ISO format strings.
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def export_collection(collection_name, output_path):
    # Fetch all documents in the collection
    docs = list(db.collection(collection_name).stream())
    print(f"Found {len(docs)} documents in the '{collection_name}' collection.")

    export_data = []
    for doc in tqdm(docs, desc=f"Exporting {collection_name}"):
        data = doc.to_dict() or {}
        # Safely remove the 'text' field (if it exists)
        data.pop("text", None)
        # Add the document id as objectID (Algolia expects a unique key, typically 'objectID')
        data["objectID"] = doc.id
        export_data.append(data)

    # Write the export_data array to a JSON file with a custom serializer
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2, default=default_serializer)
    
    print(f"Exported {len(export_data)} documents to '{output_path}'.")

if __name__ == "__main__":
    export_collection(COLLECTION_NAME, OUTPUT_JSON)