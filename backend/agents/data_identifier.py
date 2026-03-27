import json
from datetime import datetime
from groq import AsyncGroq
from config import settings
from agents.state import AgentState
from services.file_manager import get_file_schemas, set_dataset_context

SYSTEM_PROMPT = """You are a data identification agent. Your job is to analyze CSV dataset schemas and produce a comprehensive context document that other agents will use to write correct code.

Given the schema information for uploaded CSV files, produce a JSON document with:

1. For each file:
   - file_name
   - description (infer what this data represents)
   - row_count
   - columns: [{name, dtype, description (inferred), null_count, unique_count, sample_values}]

2. Detected relationships/join keys between files:
   - Which columns can be used to join datasets
   - The join type recommendation (left, inner, etc.)

3. Key observations:
   - Any data quality issues (high null counts, unexpected types)
   - Potential categorical vs numeric columns
   - Date/time columns if any

Return a well-structured JSON document. Be thorough but concise."""


async def data_identifier_node(state: AgentState) -> dict:
    trace_entry = {
        "agent": "data_identifier",
        "status": "running",
        "message": "Analyzing uploaded datasets: detecting columns, types, and relationships...",
        "timestamp": datetime.now().isoformat(),
    }

    session_id = state["session_id"]
    schemas = get_file_schemas(session_id)

    if not schemas:
        done_entry = {
            "agent": "data_identifier",
            "status": "error",
            "message": "No files uploaded to analyze.",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "dataset_context": None,
            "thought_trace": [trace_entry, done_entry],
        }

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    schema_text = json.dumps(schemas, indent=2)

    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Here are the schemas for the uploaded datasets:\n\n" + schema_text},
        ],
        temperature=0,
        max_tokens=4096,
    )

    dataset_context = response.choices[0].message.content.strip()

    # Clean markdown code fences if present
    if dataset_context.startswith("```"):
        dataset_context = dataset_context.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    # Cache in session
    set_dataset_context(session_id, dataset_context)

    done_entry = {
        "agent": "data_identifier",
        "status": "done",
        "message": "Identified {} datasets with their schemas and relationships.".format(len(schemas)),
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "dataset_context": dataset_context,
        "thought_trace": [trace_entry, done_entry],
    }
