#!/usr/bin/env python3
import os
import re
import json
from collections import defaultdict

############################
# Configuration
############################
MIN_N = 1
MAX_N = 4  # We'll build unigrams (1) through 4-grams
MIN_TOKEN_LEN = 1
USE_LOWERCASE = True
SKIP_UPPERCASE = False
STOPWORDS = set()  # e.g., {"the", "and", "of"}

############################
# Main Index-Building Function
############################
def build_1to4gram_index(
    text_folder,
    index_folder,
    output_name="1to4gram_index.json"
):
    """
    Builds multi-level n-gram indexes for n in [1..4].
    
    The final JSON structure:
    {
      "1": { "word": {"fileA.txt": count, ...}, ... },
      "2": { "word1 word2": {"fileA.txt": count, ...}, ... },
      "3": { "word1 word2 word3": {...} },
      "4": { "word1 word2 word3 word4": {...} }
    }

    Args:
      text_folder (str): path to .txt files
      index_folder (str): path to save the JSON index
      output_name (str): filename for the index JSON
    """
    os.makedirs(index_folder, exist_ok=True)

    # We'll store data in a dict: ngram_index[str(n)][ngram][filename] = count
    ngram_index = {str(n): defaultdict(lambda: defaultdict(int)) for n in range(MIN_N, MAX_N+1)}

    # Gather .txt files
    txt_files = [f for f in os.listdir(text_folder) if f.lower().endswith(".txt")]
    txt_files.sort()

    print(f"Found {len(txt_files)} .txt files in '{text_folder}'. Building 1..4-gram index...")

    for txt_file in txt_files:
        full_path = os.path.join(text_folder, txt_file)
        try:
            with open(full_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading {full_path}: {e}")
            continue

        # Tokenize
        raw_tokens = re.split(r"[^a-zA-Z0-9]+", text)

        # Filter / normalize tokens
        tokens = []
        for t in raw_tokens:
            if not t:  # skip empty
                continue
            # Optionally skip uppercase tokens
            if SKIP_UPPERCASE and t.isupper():
                continue
            # Skip short tokens
            if len(t) < MIN_TOKEN_LEN:
                continue
            # Check stopwords
            check_word = t.lower() if USE_LOWERCASE else t
            if check_word in STOPWORDS:
                continue
            # Lowercase if configured
            final_token = t.lower() if USE_LOWERCASE else t
            tokens.append(final_token)

        length = len(tokens)
        # Build n-grams for n=1..4
        for n in range(MIN_N, MAX_N+1):
            if length < n:
                break
            for i in range(length - n + 1):
                ngram_tuple = tuple(tokens[i : i + n])
                ngram_str = " ".join(ngram_tuple)
                ngram_index[str(n)][ngram_str][txt_file] += 1

    # Convert defaultdicts → normal dict
    output_data = {}
    for n_str, ngram_dict in ngram_index.items():
        converted = {}
        for ng_str, file_counts in ngram_dict.items():
            converted[ng_str] = dict(file_counts)
        output_data[n_str] = converted

    # Save JSON
    out_path = os.path.join(index_folder, output_name)
    try:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2)
        print(f"\n1–4-gram index saved to {out_path}")
    except Exception as e:
        print(f"Error writing {out_path}: {e}")

############################
# main() for direct usage
############################
def main():
    # Example usage:
    script_dir = os.path.dirname(__file__)
    text_folder = os.path.join(script_dir, "../../extracted_texts")  # Adjust path
    index_folder = os.path.join(script_dir, "indexes")

    build_1to4gram_index(
        text_folder=text_folder,
        index_folder=index_folder,
        output_name="1to4gram_index.json"
    )

if __name__ == "__main__":
    main()
