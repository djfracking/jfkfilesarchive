# Pipeline Next Steps

## 1. New Document Ingest

The initial pipeline stages documents locally:

```bash
scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --ocr-engine apple_vision
```

Productionizing this should continue with:

- Larger dry runs with `--firebase-dry-run`
- Real Firebase upload with `--upload-firebase`
- Remote duplicate skipping with `--skip-existing-remote`
- resumable batches, e.g. `--offset` in addition to `--limit`

## 2. Ollama Re-Analysis

Run enrichment only after text is staged. Keep the model configurable:

```bash
scripts/benchmark_ocr/.venv/bin/python scripts/pipeline/update_release.py \
  --release-url https://www.archives.gov/research/jfk/release-2025 \
  --limit 10 \
  --max-pages 2 \
  --ocr-engine apple_vision \
  --ollama-model llama3.1:8b
```

Recommended local model tests:

- `llama3.1:8b` for cheap titles/summaries
- `qwen2.5:14b` or newer equivalent for better entity extraction
- a small embedding model later for semantic search

Persist enrichment as a separate record first, then merge into Firestore only after spot-checking.

## 3. Replace Algolia

The repo already has a Firebase Functions search path under `functions/src/search`. Algolia is currently only wired directly in:

- `src/pages/SearchResults.jsx`
- `src/components/Searchbar.jsx`

Lowest-risk replacement sequence:

1. Add a client wrapper such as `src/search/searchClient.js`.
2. Implement Firebase callable search using existing `mainSearch`.
3. Move `SearchResults.jsx` off `react-instantsearch-dom`.
4. Replace suggestions with local `historicalSearchIndex` / query-log suggestions.
5. Remove `algoliasearch` and `react-instantsearch-dom` dependencies.

If the Firestore index search is too slow or expensive, the next cheap option is a generated static search index:

- metadata/title index in Firebase Hosting as compressed JSON
- term shards like `search-index/a.json`, `search-index/os.json`
- client fetches only needed shards
