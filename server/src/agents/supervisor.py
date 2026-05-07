from langchain_google_genai import ChatGoogleGenerativeAI
from src.graph.state import ResearchState, StreamEvent
from dotenv import load_dotenv
from functools import lru_cache
import os

load_dotenv()


@lru_cache(maxsize=1)
def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.3,
    )

DECOMPOSE_PROMPT = """You are a research planning expert.

Break the following research query into {count} specific, searchable sub-questions.
Each sub-question should target a distinct angle of the topic.
Return ONLY a numbered list, one sub-question per line. No preamble, no explanation.

Query: {query}
"""

DEPTH_TO_COUNT = {"quick": 3, "deep": 5, "exhaustive": 8}


async def supervisor_agent(state: ResearchState) -> ResearchState:
    depth = state.get("depth", "deep")
    count = DEPTH_TO_COUNT.get(depth, 5)

    event: StreamEvent = {
        "type": "status",
        "message": f"Breaking query into {count} sub-questions...",
        "data": None,
    }

    prompt = DECOMPOSE_PROMPT.format(query=state["query"], count=count)

    try:
        response = await _get_llm().ainvoke(prompt)
        raw = response.content.strip()

        sub_questions = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            # Strip leading "1. " / "1) " / "- " patterns
            for prefix in ["- ", ". ", ") "]:
                if prefix in line[:4]:
                    line = line.split(prefix, 1)[-1].strip()
                    break
            if line:
                sub_questions.append(line)

        done_event: StreamEvent = {
            "type": "status",
            "message": f"Supervisor identified {len(sub_questions)} sub-questions",
            "data": {"sub_questions": sub_questions},
        }

        return {
            **state,
            "sub_questions": sub_questions,
            "status": "decomposing",
            "events": [event, done_event],
        }

    except Exception as e:
        error_event: StreamEvent = {
            "type": "error",
            "message": f"Supervisor failed: {str(e)}",
            "data": None,
        }
        return {
            **state,
            "error": str(e),
            "status": "failed",
            "events": [event, error_event],
        }
