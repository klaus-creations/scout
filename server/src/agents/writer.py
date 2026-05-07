from langchain_google_genai import ChatGoogleGenerativeAI
from src.graph.state import ResearchState, StreamEvent
from dotenv import load_dotenv
from functools import lru_cache
import os

load_dotenv()


@lru_cache(maxsize=1)
def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.4,
    )

REPORT_PROMPT = """You are an expert research analyst. Write a structured, well-cited research report.

## Original Query
{query}

## Source Material
{sources_text}

## Instructions
- Write a complete Markdown report with these exact sections:
  # [Title]
  ## Overview
  ## Key Findings
  ## Analysis
  ## Risks & Limitations
  ## Conclusion
  ## Sources

- Cite sources inline using [1], [2] etc. matching the source numbers below.
- Be factual, specific, and avoid filler sentences.
- The Sources section must list every cited source as:
  [N] Title — URL

Do not add any preamble before the title. Start directly with # [Title].
"""

SUMMARY_PROMPT = """Write a 2-3 sentence executive summary of this research report.
Be concise and specific. No bullet points.

Report:
{report}
"""


def _build_sources_text(state: ResearchState) -> str:
    sources = state.get("sources", [])
    lines = []
    for i, source in enumerate(sources, 1):
        full_text = source.get("_full_text") or source.get("excerpt", "")  # type: ignore[typeddict-item]
        lines.append(
            f"[{i}] {source.get('title', 'Untitled')} — {source['url']}\n"
            f"{full_text[:1500]}\n"
        )
    return "\n---\n".join(lines)


def _extract_title(report_content: str) -> str:
    for line in report_content.splitlines():
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return "Research Report"


async def writer_agent(state: ResearchState) -> ResearchState:
    start_event: StreamEvent = {
        "type":    "status",
        "message": "Writing report...",
        "data":    {"source_count": len(state.get("sources", []))},
    }

    if not state.get("findings") and not state.get("sources"):
        error_event: StreamEvent = {
            "type":    "error",
            "message": "No findings or sources to write from",
            "data":    None,
        }
        return {
            **state,
            "error":          "No content to write from",
            "status":         "failed",
            "report_content": "",
            "report_title":   "",
            "report_summary": "",
            "events":         [start_event, error_event],
        }

    sources_text = _build_sources_text(state)

    try:
        # Generate full report
        report_prompt = REPORT_PROMPT.format(
            query=state["query"],
            sources_text=sources_text,
        )
        report_response  = await _get_llm().ainvoke(report_prompt)
        report_content   = report_response.content.strip()
        report_title     = _extract_title(report_content)

        section_event: StreamEvent = {
            "type":    "section_done",
            "message": "Report drafted",
            "data":    {"word_count": len(report_content.split())},
        }

        # Generate summary
        summary_response = await _get_llm().ainvoke(
            SUMMARY_PROMPT.format(report=report_content[:3000])
        )
        report_summary = summary_response.content.strip()

        done_event: StreamEvent = {
            "type":    "status",
            "message": f"Report complete — {len(report_content.split())} words, "
                       f"{len(state.get('sources', []))} sources",
            "data":    {
                "title":        report_title,
                "word_count":   len(report_content.split()),
                "source_count": len(state.get("sources", [])),
            },
        }

        return {
            **state,
            "report_title":   report_title,
            "report_content": report_content,
            "report_summary": report_summary,
            "status":         "writing",
            "events":         [start_event, section_event, done_event],
        }

    except Exception as e:
        error_event = {
            "type":    "error",
            "message": f"Writer failed: {str(e)}",
            "data":    None,
        }
        return {
            **state,
            "error":          str(e),
            "status":         "failed",
            "report_content": "",
            "report_title":   "",
            "report_summary": "",
            "events":         [start_event, error_event],
        }
