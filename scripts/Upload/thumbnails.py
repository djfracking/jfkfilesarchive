import os
import io
from pathlib import Path
from firebase_admin import credentials, initialize_app, storage, firestore
from PyPDF2 import PdfReader
from pdf2image import convert_from_path
from PIL import Image
from datetime import datetime

# === CONFIG ===
PDF_FOLDER = r"C:\Users\\Desktop\JFK\pdfs"
CRED_PATH = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
BUCKET_NAME = "chatjfkfiles.firebasestorage.app"
MAX_PAGES = 3
THUMB_WIDTH = 300  # pixels
POPPLER_PATH = r"C:\poppler\poppler-24.08.0\Library\bin"

# === Firebase Init ===
cred = credentials.Certificate(CRED_PATH)
initialize_app(cred, {"storageBucket": BUCKET_NAME})
bucket = storage.bucket()
db = firestore.client()

def resize_image(image, width):
    w_percent = (width / float(image.size[0]))
    h_size = int(float(image.size[1]) * float(w_percent))
    return image.resize((width, h_size), Image.Resampling.LANCZOS)

def process_pdf(file_path):
    filename = Path(file_path).stem
    print(f"📄 Processing {filename}...")

    try:
        images = convert_from_path(file_path, first_page=1, last_page=MAX_PAGES, poppler_path=POPPLER_PATH)
    except Exception as e:
        print(f"❌ Failed to convert {filename}: {e}")
        return

    thumb_urls = []
    for i, img in enumerate(images):
        thumb = resize_image(img, THUMB_WIDTH)

        # Save to in-memory bytes
        img_bytes = io.BytesIO()
        thumb.save(img_bytes, format="JPEG", quality=85)
        img_bytes.seek(0)

        storage_path = f"thumbnails/{filename}/images/thumb{i+1}.jpg"
        blob = bucket.blob(storage_path)
        blob.upload_from_file(img_bytes, content_type="image/jpeg")
        blob.make_public()

        print(f"✅ Uploaded thumbnail {i+1} for {filename}")
        thumb_urls.append(blob.public_url)

    # Update Firestore
    doc_ref = db.collection("2025JFK").document(filename)
    doc_ref.set({"thumbnails": thumb_urls, "updatedAt": datetime.utcnow()}, merge=True)

    print(f"🔥 Firestore updated for {filename}\n")

def main():
    for file in os.listdir(PDF_FOLDER):
        if file.lower().endswith(".pdf"):
            process_pdf(os.path.join(PDF_FOLDER, file))

if __name__ == "__main__":
    main()
