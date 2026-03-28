import json
from datetime import datetime
from services.llm_client import llm_completion
from agents.state import AgentState
from services.file_manager import get_file_schemas, set_dataset_context, set_relationships

SYSTEM_PROMPT = """You are a data identification agent. Your job is to analyze CSV dataset schemas and produce a comprehensive context document that other agents will use to write correct code.

Given the schema information for uploaded CSV files, produce a JSON document with:

1. For each file:
   - file_name
   - description (infer what this data represents)
   - row_count
   - columns: [{name, dtype, description (inferred), null_count, unique_count, sample_values}]

2. Key observations:
   - Any data quality issues (high null counts, unexpected types)
   - Potential categorical vs numeric columns
   - Date/time columns if any

Return a well-structured JSON document. Be thorough but concise."""

RELATIONSHIP_PROMPT = """You are a data relationship detection agent. Given the schemas of multiple CSV files, identify ALL possible join relationships between them.

Think carefully about:
- Columns that represent the same entity even if named differently (e.g., "Sales Rep" in one file and "Sales Rep ID" in another)
- ID columns, foreign keys, and shared dimensions
- Look at sample_values to confirm columns actually share data
- Consider the data types and unique counts to determine relationship cardinality

Return ONLY a JSON array of relationships. Each relationship must have:
{
  "from_file": "filename.csv",
  "to_file": "filename.csv",
  "from_column": "column name in from_file",
  "to_column": "column name in to_file",
  "relationship_type": "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many",
  "join_type": "inner" | "left" | "right",
  "confidence": "high" | "medium" | "low",
  "reason": "brief explanation of why these columns are related"
}

If there is only one file or no relationships found, return an empty array: []
Return ONLY valid JSON, no markdown fences or explanation."""


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

    schema_text = json.dumps(schemas, indent=2)

    # Call 1: Schema analysis
    dataset_context = await llm_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Here are the schemas for the uploaded datasets:\n\n" + schema_text},
        ],
        temperature=0,
        max_tokens=4096,
    )
    if dataset_context.startswith("```"):
        dataset_context = dataset_context.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    # Cache in session
    set_dataset_context(session_id, dataset_context)

    # Call 2: Relationship detection (only if multiple files)
    relationships = []
    if len(schemas) > 1:
        rel_text = await llm_completion(
            messages=[
                {"role": "system", "content": RELATIONSHIP_PROMPT},
                {"role": "user", "content": "Detect relationships between these datasets:\n\n" + schema_text},
            ],
            temperature=0,
            max_tokens=2048,
        )
        if rel_text.startswith("```"):
            rel_text = rel_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        try:
            relationships = json.loads(rel_text)
            if not isinstance(relationships, list):
                relationships = []
            # Add display-friendly join_column field
            for rel in relationships:
                fc = rel.get("from_column", "")
                tc = rel.get("to_column", "")
                rel["join_column"] = fc if fc == tc else "{} <> {}".format(fc, tc)
        except (json.JSONDecodeError, ValueError):
            relationships = []

        set_relationships(session_id, relationships)

    rel_count = len(relationships)
    done_entry = {
        "agent": "data_identifier",
        "status": "done",
        "message": "Identified {} dataset(s) with their schemas{}.".format(
            len(schemas),
            " and {} relationship(s)".format(rel_count) if rel_count > 0 else "",
        ),
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "dataset_context": dataset_context,
        "thought_trace": [trace_entry, done_entry],
    }
