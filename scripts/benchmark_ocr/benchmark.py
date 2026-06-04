#!/usr/bin/env python3
import argparse
from html.parser import HTMLParser
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SAMPLES = ROOT / "samples"
OUTPUTS = ROOT / "outputs"
APPLE_SWIFT = ROOT / "AppleVisionOCR.swift"
VENV = ROOT / ".venv"
VENV_BIN = VENV / "bin"
CACHE = OUTPUTS / "cache"

SAMPLE_URLS = [
    "https://www.archives.gov/files/research/jfk/releases/2025/0318/104-10003-10041.pdf",
    "https://www.archives.gov/files/research/jfk/releases/2025/0318/104-10004-10143.pdf",
    "https://www.archives.gov/files/research/jfk/releases/2025/0318/104-10012-10035.pdf",
]


class _HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        data = data.strip()
        if data:
            self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.parts.append("\n")
        elif tag == "input":
            self.parts.append("[checkbox]")


def html_to_text(html):
    parser = _HTMLTextExtractor()
    parser.feed(html or "")
    return " ".join(parser.parts).replace(" \n ", "\n")


def extract_surya_text(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    pieces = []
    for pages in data.values():
        for page in pages:
            blocks = page.get("blocks", [])
            blocks = sorted(blocks, key=lambda b: b.get("reading_order", 0))
            for block in blocks:
                text = html_to_text(block.get("html", ""))
                if text:
                    pieces.append(text)
    return "\n".join(pieces)


def benchmark_env():
    env = os.environ.copy()
    CACHE.mkdir(parents=True, exist_ok=True)
    env.update({
        "HOME": str(CACHE),
        "XDG_CACHE_HOME": str(CACHE / "xdg"),
        "HF_HOME": str(CACHE / "huggingface"),
        "TRANSFORMERS_CACHE": str(CACHE / "huggingface" / "transformers"),
        "PADDLE_HOME": str(CACHE / "paddle"),
        "PADDLEOCR_HOME": str(CACHE / "paddleocr"),
        "PADDLEX_HOME": str(CACHE / "paddlex"),
        "PATH": f"{VENV_BIN}:{env.get('PATH', '')}",
    })
    return env


def run(cmd, cwd=ROOT, timeout=None, env=None):
    start = time.time()
    proc = subprocess.run(
        cmd,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        env=env,
    )
    return {
        "cmd": cmd,
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
        "elapsed_seconds": time.time() - start,
    }


def safe_name(url):
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", url.rsplit("/", 1)[-1])


def download_samples(urls):
    SAMPLES.mkdir(parents=True, exist_ok=True)
    downloaded = []
    for url in urls:
        path = SAMPLES / safe_name(url)
        if path.exists() and path.stat().st_size > 0:
            downloaded.append(path)
            continue
        print(f"Downloading {url}")
        with urllib.request.urlopen(url) as response:
            path.write_bytes(response.read())
        downloaded.append(path)
    return downloaded


def available_engines():
    env = benchmark_env()
    engines = {
        "apple_vision": shutil.which("swift") is not None and APPLE_SWIFT.exists(),
        "surya": shutil.which("surya_ocr", path=env["PATH"]) is not None or import_available("surya", env=env),
        "paddleocr": shutil.which("paddleocr", path=env["PATH"]) is not None or import_available("paddleocr", env=env),
    }
    return engines


def import_available(module_name, env=None):
    try:
        result = run([sys.executable, "-c", f"import {module_name}"], timeout=20, env=env)
        return result["returncode"] == 0
    except subprocess.TimeoutExpired:
        return False


def metrics(text):
    chars = len(text)
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]*", text)
    garbage = re.findall(r"[^A-Za-z0-9\\s.,;:'\"!?()\\[\\]{}\\-_/&%$#@*+=<>|`~]", text)
    return {
        "chars": chars,
        "words": len(words),
        "unique_words": len({w.lower() for w in words}),
        "garbage_chars": len(garbage),
        "garbage_ratio": round(len(garbage) / chars, 5) if chars else 0,
        "mentions": {
            "cia": len(re.findall(r"\\bCIA\\b", text, flags=re.I)),
            "fbi": len(re.findall(r"\\bFBI\\b", text, flags=re.I)),
            "oswald": len(re.findall(r"\\bOswald\\b", text, flags=re.I)),
            "kennedy": len(re.findall(r"\\bKennedy\\b", text, flags=re.I)),
        },
    }


def run_apple_vision(pdf, max_pages):
    result = run(["swift", str(APPLE_SWIFT), str(pdf), str(max_pages)], timeout=300)
    if result["returncode"] != 0:
        return {"error": result}
    pages = json.loads(result["stdout"])
    full_text = "\n\n".join(page.get("text", "") for page in pages)
    return {
        "engine": "apple_vision",
        "pages": pages,
        "elapsed_seconds": result["elapsed_seconds"],
        "metrics": metrics(full_text),
    }


def run_surya(pdf, max_pages):
    env = benchmark_env()
    surya_ocr = shutil.which("surya_ocr", path=env["PATH"])
    if surya_ocr:
        out_dir = OUTPUTS / "surya_raw" / pdf.stem
        out_dir.mkdir(parents=True, exist_ok=True)
        page_range = f"0-{max_pages - 1}" if max_pages > 1 else "0"
        result = run(
            [surya_ocr, str(pdf), "--output_dir", str(out_dir), "--page_range", page_range],
            timeout=900,
            env=env,
        )
        text = ""
        for path in out_dir.rglob("results.json"):
            text += extract_surya_text(path) + "\n"
        return {
            "engine": "surya",
            "elapsed_seconds": result["elapsed_seconds"],
            "returncode": result["returncode"],
            "stderr_tail": result["stderr"][-2000:],
            "metrics": metrics(text),
        }
    return {"engine": "surya", "error": "Surya is not installed or no surya_ocr CLI was found."}


def run_paddleocr(pdf, max_pages):
    env = benchmark_env()
    out_dir = OUTPUTS / "paddle_raw" / pdf.stem
    out_dir.mkdir(parents=True, exist_ok=True)
    code = r"""
import json
import sys
from pathlib import Path

import fitz
from paddleocr import PaddleOCR

pdf = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
max_pages = int(sys.argv[3])
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(str(pdf))
images = []
for i in range(min(max_pages, doc.page_count)):
    page = doc.load_page(i)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    image_path = out_dir / f"page_{i + 1}.png"
    pix.save(str(image_path))
    images.append(image_path)

ocr = PaddleOCR(lang="en")
all_text = []
raw = []
for image_path in images:
    result = ocr.predict(str(image_path))
    raw.append(str(result))
    page_text = []
    for item in result if isinstance(result, list) else [result]:
        if isinstance(item, dict):
            for key in ("rec_texts", "texts", "text"):
                value = item.get(key)
                if isinstance(value, list):
                    page_text.extend(str(v) for v in value)
                elif isinstance(value, str):
                    page_text.append(value)
        elif hasattr(item, "json"):
            data = item.json
            if isinstance(data, dict) and isinstance(data.get("rec_texts"), list):
                page_text.extend(str(v) for v in data["rec_texts"])
    all_text.append("\n".join(page_text))

(out_dir / "paddle_text.txt").write_text("\n\n".join(all_text), encoding="utf-8")
(out_dir / "paddle_raw.txt").write_text("\n\n".join(raw), encoding="utf-8")
print(json.dumps({"pages": len(images), "chars": sum(len(t) for t in all_text)}))
"""
    result = run(
        [str(VENV_BIN / "python"), "-c", code, str(pdf), str(out_dir), str(max_pages)],
        timeout=900,
        env=env,
    )
    text = ""
    for path in out_dir.rglob("paddle_text.txt"):
        text += path.read_text(encoding="utf-8", errors="ignore") + "\n"
    return {
        "engine": "paddleocr",
        "elapsed_seconds": result["elapsed_seconds"],
        "returncode": result["returncode"],
        "stdout": result["stdout"][-2000:],
        "stderr_tail": result["stderr"][-2000:],
        "metrics": metrics(text or result["stdout"]),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--download-samples", action="store_true")
    parser.add_argument("--sample-url", action="append", default=[])
    parser.add_argument("--engines", nargs="+", default=["apple_vision"])
    parser.add_argument("--max-pages", type=int, default=2)
    parser.add_argument("--limit-samples", type=int, default=None)
    args = parser.parse_args()

    OUTPUTS.mkdir(parents=True, exist_ok=True)
    urls = args.sample_url or SAMPLE_URLS
    pdfs = download_samples(urls) if args.download_samples else sorted(SAMPLES.glob("*.pdf"))
    if args.limit_samples:
        pdfs = pdfs[:args.limit_samples]
    if not pdfs:
        raise SystemExit("No sample PDFs found. Run with --download-samples.")

    availability = available_engines()
    summary = {
        "availability": availability,
        "max_pages": args.max_pages,
        "samples": [str(path) for path in pdfs],
        "results": [],
    }

    for pdf in pdfs:
        for engine in args.engines:
            if not availability.get(engine, False):
                summary["results"].append({
                    "sample": str(pdf),
                    "engine": engine,
                    "skipped": True,
                    "reason": "engine unavailable",
                })
                continue

            print(f"Running {engine} on {pdf.name}")
            if engine == "apple_vision":
                result = run_apple_vision(pdf, args.max_pages)
            elif engine == "surya":
                result = run_surya(pdf, args.max_pages)
            elif engine == "paddleocr":
                result = run_paddleocr(pdf, args.max_pages)
            else:
                result = {"error": f"Unknown engine: {engine}"}

            result["sample"] = str(pdf)
            summary["results"].append(result)

            out_path = OUTPUTS / f"{pdf.stem}.{engine}.json"
            out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    (OUTPUTS / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
