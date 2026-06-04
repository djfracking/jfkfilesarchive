# OCR Benchmark

Small local benchmark harness for comparing cheap OCR options on NARA PDF pages.

## Layout

- `samples/` - downloaded PDFs
- `outputs/` - text and JSON results
- `AppleVisionOCR.swift` - macOS Vision OCR runner for PDFs/images
- `benchmark.py` - orchestrates downloads and OCR engines

## Quick Start

```bash
python3 scripts/benchmark_ocr/benchmark.py --download-samples --engines apple_vision
```

Optional engines:

```bash
python3 scripts/benchmark_ocr/benchmark.py --engines apple_vision surya paddleocr
```

The script skips unavailable engines and writes a summary to `outputs/summary.json`.

