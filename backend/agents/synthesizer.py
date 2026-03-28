from datetime import datetime
from groq import AsyncGroq
from config import settings
from agents.state import AgentState
from services.file_manager import get_relationships

SYSTEM_PROMPT = """You are an insight synthesis agent. Your job is to take data analysis results and present them clearly to a non-technical business user.

Guidelines:
1. Lead with the key finding - answer the question directly in the first sentence.
2. Use specific numbers and percentages from the results.
3. Add business context where helpful (e.g., "This represents the top-performing segment...").
4. If the result is a table/dataframe, summarize the key takeaways and notable patterns. Do NOT reproduce the table — the raw data table is displayed separately in the UI.
5. Highlight notable patterns, outliers, or trends.
6. Keep it concise but insightful - aim for 3-5 sentences for simple queries, more for complex ones.
7. Use bullet points or numbered lists for multiple findings.
8. If the data shows something unexpected, call it out.

Format your response in clean markdown. Do NOT include markdown tables — those are rendered separately."""


async def synthesizer_node(state: AgentState) -> dict:
    trace_entry = {
        "agent": "synthesizer",
        "status": "running",
        "message": "Preparing your answer with business insights...",
        "timestamp": datetime.now().isoformat(),
    }

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # Handle different scenarios
    if state.get("execution_result"):
        user_msg = 'User\'s question: "{}"\n\nThe analysis code produced this result:\n{}\n\nDataset context:\n{}\n\nPlease synthesize these results into a clear, insightful answer for a business user.'.format(
            state["user_query"],
            state["execution_result"],
            (state.get("dataset_context") or "N/A")[:2000],
        )
    elif state.get("dataset_context"):
        # Include relationship info if available
        rel_info = ""
        rels = get_relationships(state.get("session_id", ""))
        if rels:
            rel_lines = []
            for r in rels:
                reason = r.get('reason', '')
            from_col = r.get('from_column', r.get('join_column', ''))
            to_col = r.get('to_column', from_col)
            col_desc = from_col if from_col == to_col else f"{from_col} <> {to_col}"
            rel_lines.append(f"  - {r['from_file']} <-> {r['to_file']} via '{col_desc}' ({r.get('relationship_type', 'unknown')}){': ' + reason if reason else ''}")
            rel_info = "\n\nDetected relationships between files:\n" + "\n".join(rel_lines)
            rel_info += "\n\nNote: The relationship diagram is already shown visually in the UI. Describe the relationships in text — do NOT create tables for this."

        user_msg = 'User\'s question: "{}"\n\nHere is the information about the available datasets:\n{}{}\n\nPlease answer the user\'s question based on this dataset information. Keep it concise and describe the data structure, columns, and relationships clearly.'.format(
            state["user_query"],
            state["dataset_context"],
            rel_info,
        )
    elif state.get("dataset_file_paths"):
        # Files uploaded but context not yet built
        filenames = [p.rsplit("/", 1)[-1].rsplit("\\", 1)[-1] for p in state["dataset_file_paths"]]
        user_msg = 'User\'s question: "{}"\n\nThe user has uploaded {} file(s): {}. However the data schema has not been analyzed yet. Let the user know their files are uploaded and they can ask questions about them.'.format(
            state["user_query"],
            len(filenames),
            ", ".join(filenames),
        )
    else:
        user_msg = 'User\'s question: "{}"\n\nNo datasets have been uploaded yet. Please let the user know they need to upload CSV files to start analyzing data. Be friendly and explain what kinds of questions they can ask once data is uploaded.'.format(
            state["user_query"],
        )

    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=2048,
    )

    final_answer = response.choices[0].message.content.strip()

    done_entry = {
        "agent": "synthesizer",
        "status": "done",
        "message": "Answer ready.",
        "timestamp": datetime.now().isoformat(),
    }

    return {
        "final_answer": final_answer,
        "thought_trace": [trace_entry, done_entry],
    }
