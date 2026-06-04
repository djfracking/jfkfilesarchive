#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import fitz
import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parent
REPO_ROOT = ROOT.parents[1]
DEFAULT_WORKDIR = ROOT / "work"
APPLE_VISION_SWIFT = REPO_ROOT / "scripts" / "benchmark_ocr" / "AppleVisionOCR.swift"


@dataclass
class DocumentRecord:
    doc_id: str
    source_url: str
    pdf_path: str
    text_path: str
    sha256: str
    bytes: int
    page_count: int
    embedded_chars: int
    ocr_chars: int
    final_chars: int
    ocr_engine: str
    processed_at: float


def ensure_dirs(workdir: Path) -> dict[str, Path]:
    paths = {
        "pdfs": workdir / "pdfs",
        "text": workdir / "text",
        "metadata": workdir / "metadata",
        "state": workdir / "state",
        "cache": workdir / "cache",
    }
    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)
    return paths


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_jsonl(path: Path, value) -> None:
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(value, ensure_ascii=False) + "\n")


def pdf_links_from_release_page(url: str) -> list[str]:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    links = []
    for link in soup.find_all("a", href=True):
        href = link["href"].strip()
        if href.lower().endswith(".pdf"):
            links.append(urljoin(url, href))
    return sorted(set(links))


def safe_pdf_name(url: str) -> str:
    name = Path(urlparse(url).path).name
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", name)


def doc_id_from_pdf_name(name: str) -> str:
    return re.sub(r"\.pdf$", "", name, flags=re.I)


def download_pdf(url: str, dest: Path, force: bool = False) -> None:
    if dest.exists() and dest.stat().st_size > 0 and not force:
        return
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        tmp = dest.with_suffix(dest.suffix + ".tmp")
        with tmp.open("wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)
        tmp.replace(dest)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_embedded_text(pdf_path: Path, max_pages: int | None = None) -> tuple[str, int]:
    doc = fitz.open(str(pdf_path))
    limit = min(doc.page_count, max_pages) if max_pages else doc.page_count
    pages = []
    for i in range(limit):
        pages.append(doc.load_page(i).get_text("text"))
    return "\n\n".join(pages).strip(), doc.page_count


def run_apple_vision(pdf_path: Path, max_pages: int | None, cache_dir: Path) -> str:
    if not APPLE_VISION_SWIFT.exists():
        raise RuntimeError(f"Missing Apple Vision runner: {APPLE_VISION_SWIFT}")
    env = os.environ.copy()
    env["HOME"] = str(cache_dir)
    env["TMPDIR"] = str(cache_dir / "tmp")
    (cache_dir / "tmp").mkdir(parents=True, exist_ok=True)
    cmd = ["swift", str(APPLE_VISION_SWIFT), str(pdf_path)]
    if max_pages:
        cmd.append(str(max_pages))
    proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"Apple Vision failed for {pdf_path}")
    pages = json.loads(proc.stdout)
    return "\n\n".join(page.get("text", "") for page in pages).strip()


def enough_text(text: str, min_chars: int) -> bool:
    compact = re.sub(r"\s+", "", text or "")
    return len(compact) >= min_chars


def ollama_generate(model: str, prompt: str, url: str = "http://localhost:11434/api/generate") -> str:
    response = requests.post(
        url,
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=180,
    )
    response.raise_for_status()
    return response.json().get("response", "").strip()


def enrich_with_ollama(model: str, doc_id: str, text: str) -> dict:
    excerpt = text[:6000]
    prompt = f"""You are cataloging declassified assassination-record documents.
Return compact JSON with keys: title, summary, people, places, agencies, tags.
Use only facts visible in the excerpt. Do not invent.

Document ID: {doc_id}

Excerpt:
{excerpt}
"""
    raw = ollama_generate(model, prompt)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {"raw": raw}
    return {"doc_id": doc_id, "model": model, "enrichment": parsed, "created_at": time.time()}


def process_urls(
    urls: Iterable[str],
    workdir: Path,
    limit: int | None,
    max_pages: int | None,
    ocr_engine: str,
    min_embedded_chars: int,
    force_download: bool,
    force_reprocess: bool,
    ollama_model: str | None,
) -> list[DocumentRecord]:
    paths = ensure_dirs(workdir)
    manifest_path = paths["state"] / "manifest.json"
    manifest = load_json(manifest_path, {"documents": {}})
    metadata_path = paths["metadata"] / "metadata.jsonl"
    enrichment_path = paths["metadata"] / "ollama_enrichment.jsonl"

    selected = list(urls)[:limit] if limit else list(urls)
    records: list[DocumentRecord] = []

    for idx, url in enumerate(selected, start=1):
        pdf_name = safe_pdf_name(url)
        doc_id = doc_id_from_pdf_name(pdf_name)
        pdf_path = paths["pdfs"] / pdf_name
        text_path = paths["text"] / f"{doc_id}.txt"

        print(f"[{idx}/{len(selected)}] {doc_id}")
        download_pdf(url, pdf_path, force=force_download)
        digest = sha256_file(pdf_path)
        existing = manifest["documents"].get(doc_id)
        if existing and existing.get("sha256") == digest and text_path.exists() and not force_reprocess:
            print("  unchanged; skipping")
            continue

        embedded, page_count = extract_embedded_text(pdf_path, max_pages=max_pages)
        ocr_text = ""
        final_text = embedded
        if ocr_engine == "apple_vision" and not enough_text(embedded, min_embedded_chars):
            print("  embedded text weak; running Apple Vision")
            ocr_text = run_apple_vision(pdf_path, max_pages=max_pages, cache_dir=paths["cache"])
            final_text = ocr_text or embedded
        elif ocr_engine == "apple_vision":
            print("  embedded text accepted")
        elif ocr_engine != "none":
            raise ValueError(f"Unsupported ocr engine: {ocr_engine}")

        text_path.write_text(final_text + "\n", encoding="utf-8")
        record = DocumentRecord(
            doc_id=doc_id,
            source_url=url,
            pdf_path=str(pdf_path),
            text_path=str(text_path),
            sha256=digest,
            bytes=pdf_path.stat().st_size,
            page_count=page_count,
            embedded_chars=len(embedded),
            ocr_chars=len(ocr_text),
            final_chars=len(final_text),
            ocr_engine=ocr_engine if ocr_text else "embedded",
            processed_at=time.time(),
        )
        records.append(record)
        append_jsonl(metadata_path, asdict(record))
        manifest["documents"][doc_id] = asdict(record)
        write_json(manifest_path, manifest)

        if ollama_model and final_text.strip():
            print(f"  enriching with Ollama model {ollama_model}")
            enrichment = enrich_with_ollama(ollama_model, doc_id, final_text)
            append_jsonl(enrichment_path, enrichment)

    return records


def main() -> int:
    parser = argparse.ArgumentParser(description="Incrementally stage new release PDFs and OCR/enrich them locally.")
    parser.add_argument("--release-url", default="https://www.archives.gov/research/jfk/release-2025")
    parser.add_argument("--workdir", type=Path, default=DEFAULT_WORKDIR)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--max-pages", type=int, default=None)
    parser.add_argument("--ocr-engine", choices=["none", "apple_vision"], default="apple_vision")
    parser.add_argument("--min-embedded-chars", type=int, default=500)
    parser.add_argument("--force-download", action="store_true")
    parser.add_argument("--force-reprocess", action="store_true")
    parser.add_argument("--ollama-model", default=None)
    args = parser.parse_args()

    print(f"Scraping PDF links from {args.release_url}")
    urls = pdf_links_from_release_page(args.release_url)
    print(f"Found {len(urls)} PDF links")
    records = process_urls(
        urls=urls,
        workdir=args.workdir,
        limit=args.limit,
        max_pages=args.max_pages,
        ocr_engine=args.ocr_engine,
        min_embedded_chars=args.min_embedded_chars,
        force_download=args.force_download,
        force_reprocess=args.force_reprocess,
        ollama_model=args.ollama_model,
    )
    print(f"Processed {len(records)} changed document(s)")
    for record in records:
        print(f"- {record.doc_id}: {record.final_chars} chars via {record.ocr_engine}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

