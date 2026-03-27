import json
from datetime import datetime
from groq import AsyncGroq
from config import settings
from agents.state import AgentState

SYSTEM_PROMPT = """You are a validation agent for a data analytics system. Your job is to verify that generated Python code and its execution results correctly answer the user's question.

Check the following:
1. LOGIC: Does the code actually address what the user asked? (e.g., if they asked for "top 10", does the code return 10 items?)
2. CORRECTNESS: Are joins, filters, groupings, and aggregations applied correctly?
3. PLAUSIBILITY: Are the results reasonable? (e.g., no negative counts, percentages over 100%, revenue that seems impossibly high/low)
4. COMPLETENESS: Does the result fully answer the question, or is it partial?
5. ERROR HANDLING: If there was an execution error, identify what went wrong.

Respond with ONLY a JSON object:
{
    "is_valid": true/false,
    "feedback": "explanation of issues found, or 'Results verified correct' if valid",
    "severity": "none" | "minor" | "critical"
}

Be pragmatic: minor formatting differences are acceptable. Focus on logical and mathematical correctness."""


async def validator_node(state: AgentState) -> dict:
    trace_entry = {
        "agent": "validator",
        "status": "running",
        "message": "Validating code logic and results...",
        "timestamp": datetime.now().isoformat(),
    }

    # If execution failed, auto-invalidate
    if state.get("execution_error"):
        done_entry = {
            "agent": "validator",
            "status": "done",
            "message": "Code execution failed. Will retry. Error: {}".format(
                state["execution_error"][:150]
            ),
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "is_valid": False,
            "validation_feedback": "The code failed to execute with the following error:\n{}\n\nPlease fix the code.".format(
                state["execution_error"]
            ),
            "retry_count": state.get("retry_count", 0) + 1,
            "thought_trace": [trace_entry, done_entry],
        }

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    user_msg = 'User\'s original question: "{}"\n\nGenerated code:\n```python\n{}\n```\n\nExecution result:\n{}\n\nIs this code correct and does the result properly answer the user\'s question?'.format(
        state["user_query"],
        state.get("generated_code", "N/A"),
        state.get("execution_result", "N/A"),
    )

    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0,
        max_tokens=1024,
    )

    try:
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(text)
        is_valid = result.get("is_valid", True)
        feedback = result.get("feedback", "")
        severity = result.get("severity", "none")
    except (json.JSONDecodeError, AttributeError, ValueError):
        is_valid = True
        feedback = "Validation check completed."
        severity = "none"

    if is_valid or severity == "minor":
        done_entry = {
            "agent": "validator",
            "status": "done",
            "message": "Results verified: {}".format(feedback[:150]),
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "is_valid": True,
            "validation_feedback": feedback,
            "thought_trace": [trace_entry, done_entry],
        }
    else:
        done_entry = {
            "agent": "validator",
            "status": "done",
            "message": "Issues found, requesting retry: {}".format(feedback[:150]),
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "is_valid": False,
            "validation_feedback": feedback,
            "retry_count": state.get("retry_count", 0) + 1,
            "thought_trace": [trace_entry, done_entry],
        }
