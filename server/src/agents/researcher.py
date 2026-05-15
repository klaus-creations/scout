import asyncio
import os
from datetime import datetime, timezone

import httpx

from src.graph.state import (
    ResearchState,
    StreamEvent,
    FindingItem,
    SourceItem,
)


DEPTH_TO_RESULTS = {
    "quick": 3,
    "deep": 5,
    "exhaustive": 8,
}


async def _search_one(
    sub_question: str,
    max_results: int,
) -> tuple[list[FindingItem], list[SourceItem], StreamEvent]:

    try:
        headers = {
            "X-API-Key": os.getenv("YOU_API_KEY"),
        }

        params = {
            "query": sub_question,
            "count": max_results,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                "https://ydc-index.io/v1/search",
                headers=headers,
                params=params,
            )

        response.raise_for_status()

        result = response.json()

        findings: list[FindingItem] = []
        sources: list[SourceItem] = []

        # Parse You.com v1/search response structure
        web_results = (
            result.get("results", {}).get("web", [])
            if isinstance(result.get("results"), dict)
            else []
        )

        for r in web_results:

            url = r.get("url", "")
            title = r.get("title", "")
            snippets = r.get("snippets", [])
            content = snippets[0] if snippets else (
                r.get("description") or r.get("content") or ""
            )

            source: SourceItem = {
                "url": url,
                "title": title,
                "excerpt": content[:400],
                "agent": "researcher",
                "fetched_at": datetime.now(timezone.utc).isoformat(),
            }

            finding: FindingItem = {
                "sub_question": sub_question,
                "content": content,
                "source_url": url,
                "relevance_score": r.get("score", 0.0),
            }

            sources.append(source)
            findings.append(finding)

        event: StreamEvent = {
            "type": "status",
            "message": (
                f"Searched: "
                f"{sub_question[:60]}"
                f"{'...' if len(sub_question) > 60 else ''}"
            ),
            "data": {
                "results_count": len(findings),
            },
        }

        return findings, sources, event

    except Exception as e:

        error_event: StreamEvent = {
            "type": "error",
            "message": (
                f"Search failed for "
                f"'{sub_question[:50]}': {str(e)}"
            ),
            "data": None,
        }

        return [], [], error_event


async def researcher_agent(state: ResearchState) -> ResearchState:

    sub_questions = state.get("sub_questions", [])

    if not sub_questions:
        return {
            **state,
            "error": "No sub-questions to research",
            "status": "failed",
            "events": [],
        }

    depth = state.get("depth", "deep")
    max_results = DEPTH_TO_RESULTS.get(depth, 5)

    start_event: StreamEvent = {
        "type": "status",
        "message": (
            f"Searching "
            f"{len(sub_questions)} sub-questions in parallel..."
        ),
        "data": None,
    }

    # Run searches concurrently
    tasks = [
        _search_one(q, max_results)
        for q in sub_questions
    ]

    results = await asyncio.gather(*tasks)

    new_findings: list[FindingItem] = []
    new_sources: list[SourceItem] = []

    search_events: list[StreamEvent] = [start_event]

    # Deduplicate URLs
    seen_urls = {
        s["url"]
        for s in state.get("sources", [])
    }

    for findings, sources, event in results:

        search_events.append(event)

        new_findings.extend(findings)

        for source in sources:

            if source["url"] not in seen_urls:

                seen_urls.add(source["url"])

                new_sources.append(source)

                source_event: StreamEvent = {
                    "type": "source",
                    "message": (
                        f"Found: "
                        f"{source['title'] or source['url']}"
                    ),
                    "data": {
                        "url": source["url"],
                        "title": source["title"],
                    },
                }

                search_events.append(source_event)

    done_event: StreamEvent = {
        "type": "status",
        "message": (
            f"Collected {len(new_sources)} "
            f"unique sources so far"
        ),
        "data": {
            "total_sources": (
                len(state.get("sources", []))
                + len(new_sources)
            )
        },
    }

    search_events.append(done_event)

    return {
        **state,
        "findings": (
            state.get("findings", [])
            + new_findings
        ),
        "sources": (
            state.get("sources", [])
            + new_sources
        ),
        "iterations": (
            state.get("iterations", 0) + 1
        ),
        "status": "searching",
        "events": search_events,
    }
