# Incremental Document Pipeline

Local-first pipeline for adding new NARA JFK/RFK/MLK document releases cheaply.

The default mode is safe: it stages PDFs, text, metadata, and Ollama enrichment locally under `scripts/pipeline/work/`. It does not write to Firebase or replace search until those steps are explicitly added.

## Install

Use the OCR benchmark venv if it already exists:

```bash
scripts/benchmark_ocr/.venv/bin/pip install -r scripts/pipeline/requirements.txt
```

Or create a new venv and install:

```bash
python3.12 -m venv scripts/pipeline/.venv
scripts/pipeline/.venv/bin/pip install -r scripts/pipeline/requirements.txt
```

## Run a Small JFK Update Test

```bash
scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --limit 3 \
  --max-pages 2 \
  --ocr-engine apple_vision
```

## Optional Ollama Enrichment

Run Ollama locally, then pass a model:

```bash
ollama serve
ollama pull llama3.1:8b

scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --limit 3 \
  --max-pages 2 \
  --ocr-engine apple_vision \
  --ollama-model llama3.1:8b
```

## Optional Firebase Upload

First do a dry run:

```bash
scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --limit 3 \
  --max-pages 2 \
  --ocr-engine apple_vision \
  --upload-firebase \
  --firebase-dry-run
```

Then run the real upload with either Application Default Credentials or a service account JSON:

```bash
scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --limit 3 \
  --max-pages 2 \
  --ocr-engine apple_vision \
  --upload-firebase \
  --firebase-credentials /path/to/service-account.json \
  --skip-existing-remote
```

## Outputs

- `work/pdfs/` - downloaded PDFs
- `work/text/` - extracted/OCR text files
- `work/metadata/metadata.jsonl` - per-document metadata records
- `work/metadata/ollama_enrichment.jsonl` - optional title/summary/category records
- `work/state/manifest.json` - source URL, hashes, and processing timestamps

## Current Design

1. Scrape release page PDF links.
2. Download only files missing from local manifest.
3. Try embedded text extraction first with PyMuPDF.
4. If embedded text is weak, run Apple Vision OCR locally.
5. Optionally run local Ollama enrichment over the staged text.
6. Later phases can upload to Firebase and replace Algolia using static/Firebase search indexes.

When `--upload-firebase` is enabled, the pipeline uploads the PDF to Firebase Storage and merges the text/metadata into the configured Firestore collection. The default collection is `2025JFK`.
