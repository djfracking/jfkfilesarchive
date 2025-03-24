#!/usr/bin/env python3
import os
import re
import json
from collections import defaultdict

def build_reverse_index(text_folder, index_folder, output_name="reverse_word_index.json"):
    """
    Scans .txt files in `text_folder`, builds a reverse word index, and
    saves it as JSON in `index_folder`.

    The index structure is:
      {
        "word1": { "fileA.txt": 3, "fileB.txt": 10 },
        "word2": { "fileA.txt": 1, ... }
      }

    Args:
      text_folder (str): Relative or absolute path to folder with extracted .txt files.
      index_folder (str): Where to save the JSON index file.
      output_name (str): Filename for the JSON index. Default 'reverse_word_index.json'.
    """
    # Ensure the index folder exists
    os.makedirs(index_folder, exist_ok=True)

    # This dict will map word -> {filename -> count}
    reverse_index = defaultdict(lambda: defaultdict(int))

    # Gather all .txt files in the text_folder
    txt_files = [f for f in os.listdir(text_folder) if f.lower().endswith(".txt")]
    txt_files.sort()

    print(f"Found {len(txt_files)} .txt files in '{text_folder}'. Building reverse index...")

    # For each file, parse and update the index
    for txt_file in txt_files:
        full_path = os.path.join(text_folder, txt_file)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading {full_path}: {e}")
            continue

        # Split on non-alphanumeric to get basic word tokens
        # e.g. "CIA" remains "CIA", "files," => "files"
        tokens = re.split(r"[^a-zA-Z0-9]+", text)

        # Update the counts in the index
        for token in tokens:
            # ignore empty tokens
            if not token:
                continue
            # Lowercase to standardize, but you can skip this if you want case sensitivity
            word = token.lower()
            reverse_index[word][txt_file] += 1

    # Convert the defaultdict structure to a normal dict for JSON serialization
    final_index = {}
    for word, file_dict in reverse_index.items():
        final_index[word] = dict(file_dict)

    # Save the index as JSON
    output_path = os.path.join(index_folder, output_name)
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_index, f, indent=2)
        print(f"Reverse index saved to {output_path}")
    except Exception as e:
        print(f"Error writing index file {output_path}: {e}")

def main():
    # Relative paths from this script's directory
    text_folder = os.path.join(os.path.dirname(__file__), "../../extracted_texts")
    index_folder = os.path.join(os.path.dirname(__file__), "./indexes")

    build_reverse_index(text_folder, index_folder, output_name="reverse_word_index.json")

if __name__ == "__main__":
    main()
