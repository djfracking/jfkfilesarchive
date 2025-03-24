#!/usr/bin/env python3
import os
import json
from collections import defaultdict
import re
from tqdm import tqdm
import spacy
from dateutil import parser as date_parser

############################
# Configuration
############################
SPACY_MODEL = "en_core_web_sm"  # Lighter spaCy model
BATCH_SIZE = 1                 # Process smaller batches to avoid memory overload
N_PROCESS_CPU = 6              # Number of processes for parallel processing
CHUNK_SIZE = 1000000           # Max size per chunk (1 million characters)

def custom_date_parser(date_str):
    """
    Custom date parser to handle military-style dates (e.g., 12JUL93 -> 12-07-1993)
    and fallback to dateutil for other formats.
    """
    # Handle CIA-style military dates, like 12JUL93 -> 12-07-1993
    military_date_pattern = r"(\d{2})([A-Za-z]{3})(\d{2})"
    match = re.match(military_date_pattern, date_str.strip())
    if match:
        day, month_str, year = match.groups()
        month_dict = {
            "JAN": "01", "FEB": "02", "MAR": "03", "APR": "04", "MAY": "05", "JUN": "06",
            "JUL": "07", "AUG": "08", "SEP": "09", "OCT": "10", "NOV": "11", "DEC": "12"
        }
        month = month_dict.get(month_str.upper(), "01")
        year = f"20{year}"  # Assuming the year is in the 2000s
        return f"{year}-{month}-{day}"
    
    # Handle fuzzy or incomplete dates using dateutil
    try:
        dt = date_parser.parse(date_str, fuzzy=True)
        return dt.date().isoformat()
    except Exception:
        return None  # If parsing fails, return None

def chunk_text(text, chunk_size=CHUNK_SIZE):
    """
    Splits long text into smaller chunks of up to chunk_size characters.
    """
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

def build_timeline_index(text_folder, index_folder, output_filename="timeline_index.json"):
    """
    Uses spaCy's small model to parse .txt files, extracting DATE entities.
    Then tries to parse them into ISO format with dateutil. Final timeline index is
    stored in JSON, sorted by date.
    """

    n_process = N_PROCESS_CPU
    print(f"Using CPU for spaCy model with n_process={n_process}...")

    print(f"Loading spaCy model: {SPACY_MODEL}")
    nlp = spacy.load(SPACY_MODEL)
    nlp.max_length = 20000000  # Set max length to a higher value (20MB text files)
    print("Model loaded.\n")

    # We'll store date_index[iso_date][filename] = count
    date_index = defaultdict(lambda: defaultdict(int))

    os.makedirs(index_folder, exist_ok=True)

    # Gather .txt files
    txt_files = sorted(f for f in os.listdir(text_folder) if f.lower().endswith(".txt"))
    print(f"Found {len(txt_files)} text files in '{text_folder}'.")

    # 1) Read all files into memory, and split into smaller chunks if necessary
    file_texts = []
    for txt_file in tqdm(txt_files, desc="Reading files"):
        full_path = os.path.join(text_folder, txt_file)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            # Split large text into smaller chunks
            chunks = chunk_text(text)
            for chunk in chunks:
                file_texts.append((txt_file, chunk))
        except Exception as e:
            print(f"Error reading {full_path}: {e}")

    # 2) Process in batch with nlp.pipe
    raw_texts = [text for (_, text) in file_texts]

    print(f"\nStarting spaCy pipeline with batch_size={BATCH_SIZE}, n_process={n_process}...")
    doc_iter = nlp.pipe(raw_texts, batch_size=BATCH_SIZE, n_process=n_process)

    for (txt_file, _), doc in tqdm(zip(file_texts, doc_iter), total=len(file_texts), desc="Processing docs"):
        for ent in doc.ents:
            if ent.label_ == "DATE":
                date_str = ent.text.strip()
                iso_str = custom_date_parser(date_str)
                if iso_str:
                    date_index[iso_str][txt_file] += 1

    # 3) Sort the date keys
    sorted_dates = sorted(date_index.keys())
    final_data = {}
    for d in sorted_dates:
        final_data[d] = dict(date_index[d])

    # 4) Save JSON
    output_path = os.path.join(index_folder, output_filename)
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, indent=2)
        print(f"\nTimeline index saved to {output_path}")
    except Exception as e:
        print(f"Error writing {output_path}: {e}")

def main():
    script_dir = os.path.dirname(__file__)
    text_folder = r"C:\Users\\Desktop\JFK\extracted_texts"  # Specify your text folder
    index_folder = os.path.join(script_dir, "indexes")
    output_name = "timeline_index.json"

    build_timeline_index(text_folder, index_folder, output_filename=output_name)

if __name__ == "__main__":
    main()
