import os
import io
import json
import datetime
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from google.cloud import vision
from google.oauth2 import service_account
from PIL import Image, ImageOps

# Settings
MAX_REQUESTS = 100000  # Overall daily limit to avoid surprise billing
MAX_WORKERS = 6       # Number of parallel processes
LOG_FILE = "image_ocr_log.json"
MAPPING_FILE = "image_ocr_mapping.json"

def load_log(log_path):
    """Load or create a daily processing log for images."""
    if os.path.exists(log_path):
        with open(log_path, "r", encoding="utf-8") as f:
            log = json.load(f)
        # Reset if the date isn’t today
        today = datetime.date.today().isoformat()
        if log.get("date") != today:
            log = {"date": today, "images_processed": 0, "files": {}}
    else:
        today = datetime.date.today().isoformat()
        log = {"date": today, "images_processed": 0, "files": {}}
    return log

def save_log(log, log_path):
    """Save the daily processing log."""
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=4)

def preprocess_image(image_path):
    """
    Optional: load image via Pillow and apply transformations (e.g., grayscale, threshold).
    Returning the processed image as a PIL Image object.
    """
    with Image.open(image_path) as img:
        gray = ImageOps.grayscale(img)
        # More advanced transformations can go here
        return gray

def perform_ocr_on_image(image_path, credentials_path):
    """
    Runs OCR on a single image using Google Cloud Vision.
    Returns a dictionary containing: 
    {
        "image_file": str,
        "text": str or None,
        "error": str or None
    }
    """
    result = {"image_file": os.path.basename(image_path), "text": None, "error": None}

    # Initialize credentials and client here (done per-process)
    try:
        creds = service_account.Credentials.from_service_account_file(credentials_path)
        client = vision.ImageAnnotatorClient(credentials=creds)
    except Exception as e:
        result["error"] = f"Failed to init Vision client: {e}"
        return result

    try:
        # Optional: run the preprocess function
        pil_img = preprocess_image(image_path)
        img_byte_arr = io.BytesIO()
        pil_img.save(img_byte_arr, format="JPEG")
        content = img_byte_arr.getvalue()
        
        image = vision.Image(content=content)
        response = client.document_text_detection(
            image=image,
            image_context={"language_hints": ["en"]}
        )
        if response.error.message:
            result["error"] = f"OCR error: {response.error.message}"
        else:
            result["text"] = response.full_text_annotation.text
    except Exception as e:
        result["error"] = f"Exception during OCR: {e}"

    return result

def main():
    # Directories
    images_dir = r"C:\Users\\Desktop\JFK\preprocessed_images"  # Where your 100k images live
    output_dir = r"C:\Users\\Desktop\JFK\extracted_texts"
    os.makedirs(output_dir, exist_ok=True)

    # Paths for logs/mappings
    log_path = os.path.join(output_dir, LOG_FILE)
    mapping_path = os.path.join(output_dir, MAPPING_FILE)

    # Load daily log
    log = load_log(log_path)
    images_processed = log["images_processed"]
    file_log = log["files"]

    # Load or create a mapping from image filenames to text files
    if os.path.exists(mapping_path):
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
    else:
        mapping = {}

    if images_processed >= MAX_REQUESTS:
        print("OCR page limit already reached for today. Exiting.")
        return

    # Gather images
    all_images = [
        f for f in os.listdir(images_dir)
        if f.lower().endswith((".jpg", ".jpeg"))
    ]
    all_images.sort()
    print(f"Found {len(all_images)} images to process (no limit).")

    start_time = time.time()

    # Build the tasks but skip if already processed
    to_process = []
    for image_file in all_images:
        if images_processed >= MAX_REQUESTS:
            print("Reached overall daily limit. Stopping OCR.")
            break
        
        if image_file in file_log:
            # Already processed or errored in log
            continue
        
        to_process.append(image_file)

    print(f"Processing {len(to_process)} new images in parallel with {MAX_WORKERS} workers...")
    credentials_path = r"C:\Users\\Desktop\DV\popularis health technologies\Popularis\popularishealth.json"

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit tasks
        future_to_image = {}
        for img_file in to_process:
            img_path = os.path.join(images_dir, img_file)
            future = executor.submit(perform_ocr_on_image, img_path, credentials_path)
            future_to_image[future] = img_file
        
        # Gather results
        for future in as_completed(future_to_image):
            img_file = future_to_image[future]
            result_dict = future.result()
            if result_dict["error"]:
                print(f"Error OCRing {img_file}: {result_dict['error']}")
                file_log[img_file] = "ERROR: " + result_dict["error"]
            else:
                text = result_dict["text"]
                # Derive txt file name from base_name, e.g. "doc_page_2.jpg" -> "doc.txt"
                base_name = img_file.rsplit("_page_", 1)[0]
                txt_filename = f"{base_name}.txt"
                txt_filepath = os.path.join(output_dir, txt_filename)

                # Append recognized text
                with open(txt_filepath, "a", encoding="utf-8") as f:
                    f.write(f"\n\n--- Image {img_file} ---\n")
                    f.write(text)

                file_log[img_file] = "OK"
                mapping[img_file] = txt_filename
                print(f"Extracted text appended to {txt_filename}")

            images_processed += 1
            if images_processed >= MAX_REQUESTS:
                print("Reached overall daily limit during parallel processing. Stopping.")
                break

    elapsed = time.time() - start_time
    print(f"\nProcessed {images_processed} images in total for this run.")
    print(f"Took {elapsed:.2f} seconds.")

    # Update log
    log["images_processed"] = images_processed
    log["files"] = file_log
    save_log(log, log_path)

    # Update mapping
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=4)

    print(f"Logs saved to {log_path}")
    print(f"Mapping saved to {mapping_path}")

if __name__ == "__main__":
    main()
