import json
from pathlib import Path
from datetime import datetime

BASE_URL = "https://jfkfilesarchive.com"
STATIC_PATHS = [
    "/", "/privacy", "/terms", "/methods", "/leaderboard",
    "/search", "/signin", "/signup", "/bookmarks", "/archive"
]
DOCS_JSON = Path("data/docs_index.json")
OUTPUT = Path("public/sitemap.xml")

def load_docs():
    with open(DOCS_JSON, encoding="utf-8") as f:
        return json.load(f)

def build_url(path, lastmod=None, priority=0.8):
    xml = f"  <url>\n    <loc>{BASE_URL}{path}</loc>"
    if lastmod:
        xml += f"\n    <lastmod>{lastmod}</lastmod>"
    xml += f"\n    <priority>{priority:.1f}</priority>\n  </url>"
    return xml

def main():
    now = datetime.utcnow().date().isoformat()
    docs = load_docs()
    urls = []

    # Static pages
    for path in STATIC_PATHS:
        urls.append(build_url(path, lastmod=now, priority=1.0 if path=="/" else 0.7))

    # Document pages
    for doc in docs:
        urls.append(build_url(f"/doc/{doc['id']}", lastmod=now, priority=0.5))

    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    sitemap += "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
    sitemap += "\n".join(urls)
    sitemap += "\n</urlset>"

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(sitemap, encoding="utf-8")
    print(f"✅ Generated sitemap with {len(urls)} URLs at {OUTPUT}")

if __name__ == "__main__":
    main()
