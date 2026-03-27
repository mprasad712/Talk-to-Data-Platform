from datetime import datetime
from groq import AsyncGroq
from config import settings
from agents.state import AgentState

SYSTEM_PROMPT = """You are an insight synthesis agent. Your job is to take data analysis results and present them clearly to a non-technical business user.

Guidelines:
1. Lead with the key finding - answer the question directly in the first sentence.
2. Use specific numbers and percentages from the results.
3. Add business context where helpful (e.g., "This represents the top-performing segment...").
4. If the result is a table/dataframe, summarize the key takeaways, don't just repeat the data.
5. Highlight notable patterns, outliers, or trends.
6. Keep it concise but insightful - aim for 3-5 sentences for simple queries, more for complex ones.
7. Use bullet points or numbered lists for multiple findings.
8. If the data shows something unexpected, call it out.

Format your response in clean markdown. Use tables only when they add clarity."""


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
        user_msg = 'User\'s question: "{}"\n\nHere is the information about the available datasets:\n{}\n\nPlease answer the user\'s question based on this dataset information.'.format(
            state["user_query"],
            state["dataset_context"],
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
