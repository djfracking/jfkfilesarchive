#!/usr/bin/env python3
import os
import re
import glob
from tqdm import tqdm
from PyPDF2 import PdfReader
from google.oauth2 import service_account
from google.cloud import firestore, storage

def upload_pdfs_and_text_to_firestore(
    creds_path,
    text_folder,
    pdf_folder,
    bucket_name,
    gcs_folder="2025JFK",
    collection_name="2025JFK"
):
    print(f"Using credentials from: {creds_path}")
    creds = service_account.Credentials.from_service_account_file(creds_path)

    # Initialize Firestore and Storage clients
    db = firestore.Client(credentials=creds)
    storage_client = storage.Client(credentials=creds)
    bucket = storage_client.bucket(bucket_name)

    # Gather text files
    text_files = glob.glob(os.path.join(text_folder, "*.txt"))
    print(f"Found {len(text_files)} text files.")

    for txt_path in tqdm(text_files, desc="Uploading"):
        base_name = os.path.splitext(os.path.basename(txt_path))[0]
        pdf_name = f"{base_name}.pdf"
        pdf_path = os.path.join(pdf_folder, pdf_name)

        if not os.path.exists(pdf_path):
            print(f"Missing PDF for {base_name}, skipping.")
            continue

        # Upload PDF to GCS
        gcs_pdf_path = f"{gcs_folder}/{pdf_name}"
        blob = bucket.blob(gcs_pdf_path)
        try:
            blob.upload_from_filename(pdf_path, content_type="application/pdf")
            blob.make_public()
            pdf_url = blob.public_url
        except Exception as e:
            print(f"Failed to upload PDF {pdf_path}: {e}")
            continue

        # Read text and gather stats
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"Failed to read text file {txt_path}: {e}")
            continue

        word_count = len(re.findall(r"\w+", text))

        # Get page count from PDF
        try:
            with open(pdf_path, "rb") as pdf_file:
                pdf_reader = PdfReader(pdf_file)
                page_count = len(pdf_reader.pages)
        except Exception as e:
            print(f"Warning: Could not get page count for {pdf_path}: {e}")
            page_count = 0

        # Firestore doc
        doc_data = {
            "file_name": base_name,
            "pdf_url": pdf_url,
            "word_count": word_count,
            "page_count": page_count,
            "text": text
        }

        try:
            db.collection(collection_name).document(base_name).set(doc_data)
        except Exception as e:
            print(f"Failed to write Firestore doc for {base_name}: {e}")

def main():
    creds_path = r"C:\Users\\Desktop\chatjfkfiles-9364c3addedd.json"
    text_folder = r"C:\Users\\Desktop\JFK\extracted_texts"
    pdf_folder = r"C:\Users\\Desktop\JFK\pdfs"
    bucket_name = "chatjfkfiles.firebasestorage.app"

    upload_pdfs_and_text_to_firestore(
        creds_path,
        text_folder,
        pdf_folder,
        bucket_name,
        gcs_folder="2025JFK",
        collection_name="2025JFK"
    )

if __name__ == "__main__":
    main()
