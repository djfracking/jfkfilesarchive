#!/usr/bin/env python3
import os
import re
import json
from collections import defaultdict
from tqdm import tqdm

############################
# Configuration
############################
SPACY_MODEL = "en_core_web_trf"  # or "en_core_web_sm" for a smaller model
USE_GPU = False                   # Set to False if you only have CPU
MAX_CHAR_LENGTH = 1_000_000       # Chunk size for spaCy

def chunk_text(text, max_length):
    """Yield chunks of text with a given maximum length."""
    for i in range(0, len(text), max_length):
        yield text[i:i+max_length]

def is_valid_entity(ent_text, ent_label):
    """Filter out low-signal or noisy named entities."""
    if len(ent_text) < 3:
        return False
    if any(char.isdigit() for char in ent_text):
        return False
    if re.fullmatch(r"[^\w]+", ent_text):
        return False
    if ent_label not in {"PERSON", "ORG", "GPE", "FAC", "EVENT", "WORK_OF_ART"}:
        return False
    return True

def build_named_entity_index(text_folder, index_folder, output_filename="ner_index.json"):
    """
    Processes each .txt file in `text_folder` using spaCy NER, 
    then saves a JSON index at `index_folder/output_filename`.

    The JSON index structure is:
        {
          "Lee Harvey Oswald": {
            "PERSON": {"fileA.txt": 3, "fileB.txt": 1}
          },
          "CIA": {
            "ORG": {"fileB.txt": 2}
          }
        }
    """
    import spacy

    # Optionally enforce GPU usage
    if USE_GPU:
        spacy.require_gpu()
        print("Using GPU for spaCy model...")
    else:
        print("Using CPU for spaCy model...")

    print(f"Loading spaCy model: {SPACY_MODEL}")
    nlp = spacy.load(SPACY_MODEL)
    nlp.max_length = 10_000_000  # Increase limit to handle long files
    print("Model loaded.\n")

    # Data structure: ent_index[ent_text][ent_label][filename] = count
    ent_index = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    # Ensure output directory exists
    os.makedirs(index_folder, exist_ok=True)

    # Gather .txt files
    txt_files = [f for f in os.listdir(text_folder) if f.lower().endswith(".txt")]
    txt_files.sort()
    print(f"Found {len(txt_files)} text files in '{text_folder}'.")

    for txt_file in tqdm(txt_files, desc="Processing files"):
        full_path = os.path.join(text_folder, txt_file)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading {full_path}: {e}")
            continue

        try:
            for chunk in chunk_text(text, MAX_CHAR_LENGTH):
                doc = nlp(chunk)
                for ent in doc.ents:
                    ent_text = ent.text.strip()
                    ent_label = ent.label_
                    if is_valid_entity(ent_text, ent_label):
                        ent_index[ent_text][ent_label][txt_file] += 1
        except Exception as e:
            print(f"Error processing {txt_file}: {e}")
            continue

    # Convert nested defaultdicts -> normal dict
    final_data = {}
    for ent_text, label_dict in ent_index.items():
        label_data = {}
        for label, file_counts in label_dict.items():
            label_data[label] = dict(file_counts)
        final_data[ent_text] = label_data

    # Write to JSON
    output_path = os.path.join(index_folder, output_filename)
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, indent=2)
        print(f"\n✅ Named Entity index saved to {output_path}")
    except Exception as e:
        print(f"Error writing {output_path}: {e}")

def main():
    text_folder = r"C:\Users\\Desktop\JFK\extracted_texts"
    index_folder = r"C:\Users\\Desktop\JFK"
    output_name = "ner_index.json"

    os.makedirs(text_folder, exist_ok=True)
    os.makedirs(index_folder, exist_ok=True)

    build_named_entity_index(text_folder, index_folder, output_filename=output_name)

if __name__ == "__main__":
    main()
