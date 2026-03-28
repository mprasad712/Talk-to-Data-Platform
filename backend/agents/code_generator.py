from datetime import datetime
from services.llm_client import llm_completion
from agents.state import AgentState

SYSTEM_PROMPT = """You are a Python code generation agent for data analysis. Your job is to write a self-contained Python script using pandas to answer the user's question about their datasets.

STRICT RULES:
1. Use ONLY pandas (imported as pd) and numpy (imported as np). No other libraries.
2. Read CSV files from the EXACT file paths provided. Use encoding='utf-8', errors='replace' for read_csv.
3. Store your FINAL answer in a variable called `RESULT`. This is mandatory.
4. RESULT should be a meaningful output: a DataFrame (preferred for tabular data), Series, number, or string.
5. DO NOT use print() for the final answer - assign to RESULT instead.
6. When joining datasets, use the join keys identified in the dataset context.

DATA QUALITY — ALWAYS do this after reading each CSV:
- Drop rows where ALL values are NaN: df.dropna(how='all', inplace=True)
- For the columns you're analyzing, drop rows where those specific columns are NaN/blank
- Convert monetary/numeric columns: pd.to_numeric(df[col], errors='coerce')
- Strip whitespace from string columns: df[col] = df[col].str.strip()
- Filter out blank/empty string values from groupby or filter columns
- When user asks "top N", return EXACTLY N rows (use .head(N))

RESULT FORMAT:
- For "top N" or "list" queries: return a DataFrame with clear column names, sorted appropriately
- For single values: return the value directly
- For summaries: return a DataFrame with labeled rows/columns
- Reset index before assigning to RESULT so the table looks clean: RESULT = df.reset_index(drop=True) or RESULT = df.reset_index()

OUTPUT FORMAT:
Return ONLY the Python code, no explanations. Do not wrap in markdown code fences.

Example:
import pandas as pd
import numpy as np

df = pd.read_csv("path/to/file.csv", encoding="utf-8", errors="replace")
df.dropna(how='all', inplace=True)
df['Revenue'] = pd.to_numeric(df['Revenue'], errors='coerce')
df = df.dropna(subset=['Revenue'])
RESULT = df.nlargest(10, 'Revenue')[['Company', 'Revenue']].reset_index(drop=True)
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

    file_paths_str = "\n".join(
        "- {}".format(p) for p in state.get("dataset_file_paths", [])
    )

    user_msg = 'User question: "{}"\n\nAvailable dataset files:\n{}\n\nDataset context (schemas, join keys, data types):\n{}\n{}\n\nWrite Python/Pandas code to answer this question. Remember: assign the final answer to RESULT.'.format(
        state["user_query"],
        file_paths_str,
        state.get("dataset_context", "No context available"),
        retry_info,
    )

    code = await llm_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.1,
        max_tokens=4096,
    )
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
