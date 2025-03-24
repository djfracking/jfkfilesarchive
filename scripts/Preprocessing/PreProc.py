import os
import json
import time
from pdf2image import convert_from_path, pdfinfo_from_path
from concurrent.futures import ProcessPoolExecutor, as_completed
from tqdm import tqdm

# Settings
DPI = 600
CHUNK_SIZE = 25  # pages to process per chunk
IMAGE_FORMAT = "jpeg"
POPPLER_PATH = r"C:\poppler\poppler-24.08.0\Library\bin"  # your specified Poppler path
INPUT_FOLDER = r"C:\Users\\Desktop\JFK\pdfs"
OUTPUT_FOLDER = r"C:\Users\\Desktop\JFK\preprocessed_images"
MAPPING_FILE = os.path.join(OUTPUT_FOLDER, "pdf_to_images_mapping.json")
ERROR_FILE = os.path.join(OUTPUT_FOLDER, "errored_pdfs.json")
MAX_WORKERS = 6  # Adjust as needed

def process_pdf_to_images(pdf_path, output_folder, dpi=DPI, image_format=IMAGE_FORMAT):
    """
    Converts a PDF into images in CHUNK_SIZE-page chunks to avoid large file issues.
    Returns (pdf_base, list_of_image_filenames) on success,
    or {"pdf": pdf_basename, "error": error_message} on failure.

    Args:
        pdf_path (str): Full path to the PDF file.
        output_folder (str): Folder where the images will be saved.
        dpi (int): Resolution for conversion.
        image_format (str): Format for the saved images.
    """
    pdf_basename = os.path.basename(pdf_path)
    pdf_base = os.path.splitext(pdf_basename)[0]

    # Step 1: Get total number of pages via pdfinfo_from_path
    try:
        info = pdfinfo_from_path(pdf_path, poppler_path=POPPLER_PATH)
        total_pages = int(info["Pages"])
    except Exception as e:
        error_msg = f"Failed to retrieve page count for {pdf_basename}: {e}"
        print(error_msg)
        return {"pdf": pdf_basename, "error": error_msg}

    image_files = []

    # Step 2: Process the PDF in chunks of CHUNK_SIZE pages
    for start_page in range(1, total_pages + 1, CHUNK_SIZE):
        end_page = min(start_page + CHUNK_SIZE - 1, total_pages)
        try:
            # Convert the chunk of pages
            pages = convert_from_path(
                pdf_path,
                dpi=dpi,
                poppler_path=POPPLER_PATH,
                first_page=start_page,
                last_page=end_page
            )
        except Exception as e:
            error_msg = f"Error converting pages {start_page}-{end_page} of {pdf_basename}: {e}"
            print(error_msg)
            return {"pdf": pdf_basename, "error": error_msg}

        # Step 3: Save each page in this chunk
        for i, page in enumerate(pages, start=start_page):
            image_filename = f"{pdf_base}_page_{i}.{image_format}"
            image_filepath = os.path.join(output_folder, image_filename)
            try:
                page.save(image_filepath, image_format.upper())
                print(f"Saved {image_filepath}")
                image_files.append(image_filename)
            except Exception as e:
                # Log error for a single page, but continue processing other pages
                error_msg = f"Error saving {image_filepath}: {e}"
                print(error_msg)

    return pdf_base, image_files

def already_processed(pdf_path, output_folder, image_format=IMAGE_FORMAT):
    """
    Checks if a PDF appears to have been processed by looking for any image file 
    in the output folder that starts with the PDF's base name.
    
    Args:
        pdf_path (str): Full path to the PDF file.
        output_folder (str): Folder where images are saved.
        image_format (str): Image file format.
        
    Returns:
        bool: True if at least one image file exists for the PDF, else False.
    """
    pdf_base = os.path.splitext(os.path.basename(pdf_path))[0]
    for filename in os.listdir(output_folder):
        if filename.lower().endswith(f".{image_format}") and filename.startswith(pdf_base):
            return True
    return False

def main():
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    # Load existing mapping and error logs if available; otherwise, initialize empty dictionaries.
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r", encoding="utf-8") as f:
            mapping = json.load(f)
    else:
        mapping = {}
    
    if os.path.exists(ERROR_FILE):
        with open(ERROR_FILE, "r", encoding="utf-8") as f:
            error_log = json.load(f)
    else:
        error_log = {}

    # List all PDF files in the input folder, sorted ascending.
    pdf_files = sorted([
        os.path.join(INPUT_FOLDER, f)
        for f in os.listdir(INPUT_FOLDER)
        if f.lower().endswith(".pdf")
    ])
    
    # Filter out PDFs that already have at least one processed image.
    unprocessed_pdfs = []
    for pdf in pdf_files:
        if not already_processed(pdf, OUTPUT_FOLDER, image_format=IMAGE_FORMAT):
            unprocessed_pdfs.append(pdf)
        else:
            print(f"Skipping already processed PDF: {pdf}")
    
    total_to_process = len(unprocessed_pdfs)
    if total_to_process == 0:
        print("All PDFs appear to have been processed. Exiting.")
        return

    print(f"Starting parallel PDF-to-image conversion at {DPI} dpi using {MAX_WORKERS} cores...")
    print(f"Total unprocessed PDFs: {total_to_process}")
    
    start_time = time.time()
    mapping_updates = {}
    
    # Use a progress bar to track processing.
    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_pdf = {
            executor.submit(process_pdf_to_images, pdf, OUTPUT_FOLDER): pdf
            for pdf in unprocessed_pdfs
        }
        for future in tqdm(as_completed(future_to_pdf), total=total_to_process, desc="Processing PDFs"):
            pdf = future_to_pdf[future]
            try:
                result = future.result()
            except Exception as e:
                pdf_name = os.path.basename(pdf)
                error_msg = f"Exception while processing {pdf}: {e}"
                print(error_msg)
                error_log[pdf_name] = error_msg
                continue

            # Check if result indicates an error dict
            if isinstance(result, dict) and "error" in result:
                pdf_name = result.get("pdf", os.path.basename(pdf))
                error_msg = result["error"]
                print(f"Failed to process {pdf_name}: {error_msg}")
                error_log[pdf_name] = error_msg
            else:
                pdf_base, image_list = result
                mapping_updates[os.path.basename(pdf)] = image_list

    elapsed = time.time() - start_time
    avg_time = elapsed / total_to_process
    remaining = total_to_process - len(mapping_updates) - len(error_log)
    estimated_remaining = avg_time * remaining if remaining > 0 else 0

    print(f"\nProcessing complete in {elapsed:.2f} seconds.")
    print(f"Average time per PDF: {avg_time:.2f} seconds.")
    if remaining > 0:
        print(f"Estimated time remaining for {remaining} PDFs: {estimated_remaining:.2f} seconds.")
    
    # Update the mapping with new processed PDFs.
    mapping.update(mapping_updates)
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=4)
    print(f"Mapping saved to {MAPPING_FILE}")
    
    # Save the error log.
    with open(ERROR_FILE, "w", encoding="utf-8") as f:
        json.dump(error_log, f, indent=4)
    print(f"Error log saved to {ERROR_FILE}")

if __name__ == "__main__":
    main()
