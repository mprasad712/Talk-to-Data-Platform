import json
from datetime import datetime
from services.llm_client import llm_completion
from agents.state import AgentState

SYSTEM_PROMPT = """You are an orchestration agent for a data analytics chatbot. Your ONLY job is to route the user's query to the correct agent.

You have these agents available:
1. "data_identifier" - Analyzes uploaded CSV files to detect schemas, data types, and join keys. MUST be called first when files are uploaded but dataset_context is not yet available.
2. "code_generator" - Writes Python/Pandas code to answer analytical questions about the data.
3. "synthesizer" - Answers simple conversational questions (greetings, "what can you do?") OR presents data insights when dataset_context is available.

Rules (follow in order):
- If NO files are uploaded: route to "synthesizer" (to explain they need to upload files)
- If files are uploaded AND dataset_context is null/empty: ALWAYS route to "data_identifier" first, regardless of the question. The data must be analyzed before any question can be answered.
- If dataset_context exists AND the question is about the structure of the uploaded files (schema, columns, relationships between files): route to "synthesizer"
- If dataset_context exists AND the question requires looking at actual values, rows, or content within the data: route to "code_generator". When in doubt between synthesizer and code_generator, prefer "code_generator" — it is better to run code and give a precise answer than to guess from schema metadata.
- If the user asks a pure greeting/help question with no data aspect: route to "synthesizer"

Respond with ONLY a JSON object:
{"next_agent": "<agent_name>", "reasoning": "<brief explanation>"}
"""


async def orchestrator_node(state: AgentState) -> dict:
    trace_entry = {
        "agent": "orchestrator",
        "status": "running",
        "message": "Analyzing your question and deciding the best approach...",
        "timestamp": datetime.now().isoformat(),
    }

    context_status = "available" if state.get("dataset_context") else "not available"
    file_count = len(state.get("dataset_file_paths", []))

    # Include recent chat history for follow-up context
    history_str = ""
    if state.get("chat_history"):
        history_lines = []
        for msg in state["chat_history"][-6:]:
            prefix = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append("{}: {}".format(prefix, msg["content"][:150]))
        history_str = "\n- Recent conversation:\n" + "\n".join(history_lines)

    user_msg = 'User query: "{}"\n\nCurrent state:\n- Files uploaded: {}\n- Dataset context (schema info): {}\n- File paths: {}{}\n\nWhich agent should handle this?'.format(
        state["user_query"], file_count, context_status, state.get("dataset_file_paths", []), history_str
    )

    text = await llm_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0,
        max_tokens=256,
    )

    try:
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)
        next_agent = result.get("next_agent", "code_generator")
        reasoning = result.get("reasoning", "")
    except (json.JSONDecodeError, AttributeError, ValueError):
        next_agent = "code_generator" if state.get("dataset_context") else "data_identifier"
        reasoning = "Fallback routing"

    done_entry = {
        "agent": "orchestrator",
        "status": "done",
        "message": "Routing to {}: {}".format(next_agent, reasoning),
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "next_agent": next_agent,
        "thought_trace": [trace_entry, done_entry],
    }
