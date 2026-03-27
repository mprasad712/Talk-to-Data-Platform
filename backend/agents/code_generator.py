from datetime import datetime
from groq import AsyncGroq
from config import settings
from agents.state import AgentState

SYSTEM_PROMPT = """You are a Python code generation agent for data analysis. Your job is to write a self-contained Python script using pandas to answer the user's question about their datasets.

STRICT RULES:
1. Use ONLY pandas (imported as pd) and numpy (imported as np). No other libraries.
2. Read CSV files from the EXACT file paths provided. Use encoding='utf-8', errors='replace' for read_csv.
3. Store your FINAL answer in a variable called `RESULT`. This is mandatory.
4. RESULT should be a meaningful output: a DataFrame, Series, number, or string that directly answers the question.
5. Handle potential issues: NaN values, type conversions, case-insensitive matching where appropriate.
6. DO NOT use print() for the final answer - assign to RESULT instead.
7. When joining datasets, use the join keys identified in the dataset context.
8. For revenue/monetary calculations, ensure the column is numeric (use pd.to_numeric with errors='coerce').
9. If a column might have mixed types, clean it before using it.

OUTPUT FORMAT:
Return ONLY the Python code, no explanations. Do not wrap in markdown code fences.

Example:
import pandas as pd
import numpy as np

df = pd.read_csv("path/to/file.csv", encoding="utf-8", errors="replace")
RESULT = df.groupby("Category")["Revenue"].sum().sort_values(ascending=False).head(10)
"""


async def code_generator_node(state: AgentState) -> dict:
    retry_info = ""
    if state.get("validation_feedback") and state.get("retry_count", 0) > 0:
        retry_info = "\n\nPREVIOUS ATTEMPT FAILED. Validator feedback:\n{}\n\nPrevious code that failed:\n{}\n\nFix the issues and try again.".format(
            state["validation_feedback"], state.get("generated_code", "N/A")
        )

    trace_entry = {
        "agent": "code_generator",
        "status": "running",
        "message": "Writing Python code to answer your question...{}".format(
            " (retry attempt)" if retry_info else ""
        ),
        "timestamp": datetime.now().isoformat(),
    }

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    file_paths_str = "\n".join(
        "- {}".format(p) for p in state.get("dataset_file_paths", [])
    )

    user_msg = 'User question: "{}"\n\nAvailable dataset files:\n{}\n\nDataset context (schemas, join keys, data types):\n{}\n{}\n\nWrite Python/Pandas code to answer this question. Remember: assign the final answer to RESULT.'.format(
        state["user_query"],
        file_paths_str,
        state.get("dataset_context", "No context available"),
        retry_info,
    )

    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.1,
        max_tokens=4096,
    )

    code = response.choices[0].message.content.strip()
    # Clean markdown code fences if present
    if code.startswith("```"):
        lines = code.split("\n")
        code = "\n".join(lines[1:-1]) if len(lines) > 2 else code

    done_entry = {
        "agent": "code_generator",
        "status": "done",
        "message": "Code generated successfully.",
        "code": code,
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "generated_code": code,
        "thought_trace": [trace_entry, done_entry],
    }
