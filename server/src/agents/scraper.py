import httpx
from bs4 import BeautifulSoup
from src.graph.state import ResearchState, StreamEvent, SourceItem
from datetime import datetime, timezone
import asyncio

SCRAPE_TIMEOUT  = 10       # seconds per request
MAX_CONTENT_LEN = 8_000    # chars to keep per page
MAX_CONCURRENT  = 5        # parallel scrapes

SKIP_EXTENSIONS = (".pdf", ".doc", ".docx", ".xls", ".ppt", ".zip")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "aside", "form", "noscript", "iframe"]):
        tag.decompose()

    # Prefer article/main content if it exists
    main = soup.find("article") or soup.find("main") or soup.body
    if main is None:
        return ""

    text = main.get_text(separator="\n", strip=True)
    # Collapse blank lines
    lines = [l for l in text.splitlines() if l.strip()]
    return "\n".join(lines)[:MAX_CONTENT_LEN]


async def _scrape_one(
    client: httpx.AsyncClient,
    source: SourceItem,
) -> tuple[SourceItem, StreamEvent]:
    url = source["url"]

    if any(url.lower().endswith(ext) for ext in SKIP_EXTENSIONS):
        event: StreamEvent = {
            "type":    "status",
            "message": f"Skipped (binary file): {url[:60]}",
            "data":    None,
        }
        return source, event

    try:
        response = await client.get(url, headers=HEADERS, timeout=SCRAPE_TIMEOUT, follow_redirects=True)
        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type:
            event = {
                "type":    "status",
                "message": f"Skipped (not HTML): {url[:60]}",
                "data":    None,
            }
            return source, event

        full_text = _extract_text(response.text)

        enriched: SourceItem = {
            **source,
            "excerpt":    full_text[:400],          # update excerpt with real content
            "agent":      "scraper",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

        # Attach full text for the writer (not persisted to DB, only in-memory)
        enriched["_full_text"] = full_text          # type: ignore[typeddict-unknown-key]

        event = {
            "type":    "status",
            "message": f"Read: {source.get('title') or url[:60]}",
            "data":    {"url": url, "chars": len(full_text)},
        }
        return enriched, event

    except httpx.TimeoutException:
        event = {
            "type":    "status",
            "message": f"Timeout: {url[:60]}",
            "data":    None,
        }
        return source, event
    except Exception as e:
        event = {
            "type":    "status",
            "message": f"Failed ({type(e).__name__}): {url[:60]}",
            "data":    None,
        }
        return source, event


async def scraper_agent(state: ResearchState) -> ResearchState:
    sources = state.get("sources", [])

    # Only scrape sources that haven't been enriched by scraper yet
    to_scrape = [s for s in sources if s.get("agent") == "researcher"]

    if not to_scrape:
        skip_event: StreamEvent = {
            "type":    "status",
            "message": "No new pages to scrape",
            "data":    None,
        }
        return {**state, "events": [skip_event]}

    start_event: StreamEvent = {
        "type":    "status",
        "message": f"Reading {len(to_scrape)} pages...",
        "data":    None,
    }

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    scrape_events: list[StreamEvent] = [start_event]
    failed_urls: list[str] = list(state.get("failed_urls", []))

    async def bounded_scrape(source):
        async with semaphore:
            return await _scrape_one(client, source)

    async with httpx.AsyncClient() as client:
        tasks   = [bounded_scrape(s) for s in to_scrape]
        results = await asyncio.gather(*tasks)

    enriched_map: dict[str, SourceItem] = {}
    for enriched_source, event in results:
        scrape_events.append(event)
        enriched_map[enriched_source["url"]] = enriched_source
        if event["type"] == "error":
            failed_urls.append(enriched_source["url"])

    # Merge enriched sources back into the full list
    updated_sources = [
        enriched_map.get(s["url"], s) for s in sources
    ]

    done_event: StreamEvent = {
        "type":    "status",
        "message": f"Finished reading pages. {len(failed_urls)} failed.",
        "data":    {"scraped": len(to_scrape), "failed": len(failed_urls)},
    }
    scrape_events.append(done_event)

    return {
        **state,
        "sources":     updated_sources,
        "failed_urls": failed_urls,
        "status":      "scraping",
        "events":      scrape_events,
    }
