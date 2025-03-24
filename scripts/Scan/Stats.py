import os
import csv

def get_text_stats(text):
    """
    Given a text string, return a dictionary of useful stats:
    - word_count: Count of whitespace-separated words
    - char_count: Total character count (including whitespace)
    - char_no_space_count: Total characters excluding whitespace
    - line_count: Number of lines
    """
    lines = text.splitlines()
    line_count = len(lines)
    
    words = text.split()
    word_count = len(words)
    
    char_count = len(text)
    char_no_space_count = len(text.replace(" ", "").replace("\n", ""))

    return {
        "word_count": word_count,
        "char_count": char_count,
        "char_no_space_count": char_no_space_count,
        "line_count": line_count
    }

def main():
    # Folder containing the extracted text files
    text_folder = r"C:\Users\\Desktop\JFK\extracted_texts"
    
    # Output CSV file for stats
    output_csv = os.path.join(text_folder, "text_stats.csv")
    
    # List all .txt files in the folder
    txt_files = [
        f for f in os.listdir(text_folder)
        if f.lower().endswith(".txt")
    ]
    
    # Container to hold stats for each file
    stats_list = []
    
    total_word_count = 0
    total_char_count = 0
    total_char_no_space_count = 0
    total_line_count = 0
    
    for txt_file in txt_files:
        txt_path = os.path.join(text_folder, txt_file)
        
        # Read the text
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            print(f"Error reading {txt_path}: {e}")
            continue
        
        # Compute stats
        file_stats = get_text_stats(text)
        # Store them with the filename
        file_stats["filename"] = txt_file
        stats_list.append(file_stats)
        
        # Accumulate for summary
        total_word_count += file_stats["word_count"]
        total_char_count += file_stats["char_count"]
        total_char_no_space_count += file_stats["char_no_space_count"]
        total_line_count += file_stats["line_count"]
    
    num_files = len(stats_list)
    
    # Print a quick report to console
    print("Filename,Words,Chars (incl. whitespace),Chars (excl. whitespace),Lines")
    for s in stats_list:
        print(f"{s['filename']},"
              f"{s['word_count']},"
              f"{s['char_count']},"
              f"{s['char_no_space_count']},"
              f"{s['line_count']}")

    # Summary across all files
    print("\nSUMMARY:")
    print(f"Total files processed: {num_files}")
    print(f"Total words: {total_word_count}")
    print(f"Total chars (incl. whitespace): {total_char_count}")
    print(f"Total chars (excl. whitespace): {total_char_no_space_count}")
    print(f"Total lines: {total_line_count}")
    
    if num_files > 0:
        avg_words = total_word_count / num_files
        avg_chars = total_char_count / num_files
        avg_chars_no_space = total_char_no_space_count / num_files
        avg_lines = total_line_count / num_files
        
        print(f"Avg words per file: {avg_words:.2f}")
        print(f"Avg chars (incl. space) per file: {avg_chars:.2f}")
        print(f"Avg chars (excl. space) per file: {avg_chars_no_space:.2f}")
        print(f"Avg lines per file: {avg_lines:.2f}")
    
    # Optionally, write them to a CSV
    with open(output_csv, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        # Header row
        writer.writerow(["filename", "word_count", "char_count", "char_no_space_count", "line_count"])
        
        for s in stats_list:
            writer.writerow([
                s["filename"],
                s["word_count"],
                s["char_count"],
                s["char_no_space_count"],
                s["line_count"]
            ])
        
        # Add a summary row at the bottom if you like
        writer.writerow([])
        writer.writerow(["SUMMARY"])
        writer.writerow(["Total files processed", num_files])
        writer.writerow(["Total words", total_word_count])
        writer.writerow(["Total chars (incl. space)", total_char_count])
        writer.writerow(["Total chars (excl. space)", total_char_no_space_count])
        writer.writerow(["Total lines", total_line_count])
        
        if num_files > 0:
            writer.writerow(["Avg words per file", f"{avg_words:.2f}"])
            writer.writerow(["Avg chars (incl. space) per file", f"{avg_chars:.2f}"])
            writer.writerow(["Avg chars (excl. space) per file", f"{avg_chars_no_space:.2f}"])
            writer.writerow(["Avg lines per file", f"{avg_lines:.2f}"])
    
    print(f"\nStats and summary written to {output_csv}")

if __name__ == "__main__":
    main()
