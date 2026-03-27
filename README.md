# BCN Data Analytics - Multi-Agent AI Chatbot

An end-to-end AI-powered data analytics chatbot that uses a multi-agent architecture to analyze business datasets (CRM, Sales, Sales Rep) and answer questions with clear business insights.

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Backend

```bash
cd backend
pip install -r requirements.txt

# Set your Google API key
# Edit .env file and replace 'your-google-api-key-here' with your actual key
# Or export it: export GOOGLE_API_KEY=your-key-here

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000` (auto-proxies API calls to backend)

## Architecture Overview

### Multi-Agent Design (LangGraph)

The system uses **5 specialized nodes** in a LangGraph `StateGraph`, each with a single clear responsibility:

```
User Query → Orchestrator → Data Identifier → Orchestrator → Code Generator → Code Executor → Validator → Synthesizer → Answer
```

| Agent | Type | Responsibility |
|-------|------|----------------|
| **Orchestrator** | LLM (Gemini) | Routes queries to the correct agent based on current state. Decides if schema detection is needed or can skip to code generation. |
| **Data Identifier** | LLM (Gemini) | Analyzes uploaded CSVs to detect columns, data types, join keys, and relationships. Results are cached per session. |
| **Code Generator** | LLM (Gemini) | Writes self-contained Python/Pandas scripts to answer analytical questions. Receives validator feedback on retries. |
| **Code Executor** | Deterministic | Runs generated code in a sandboxed `exec()` with restricted builtins (pandas/numpy only). No LLM involved. |
| **Validator** | LLM (Gemini) | Cross-checks code logic and result plausibility. Can trigger up to 2 retries with specific feedback. |
| **Synthesizer** | LLM (Gemini) | Converts validated results into clear, non-technical business insights with context. |

### Why This Agent Split?

1. **Maps 1:1 to required capabilities**: Identify, Generate, Validate, Synthesize — plus an Orchestrator for routing
2. **Separation of concerns**: The Code Generator never executes code; the Executor never generates it; the Validator reviews independently — eliminating self-confirming bias
3. **Focused prompts**: Each agent has a tightly scoped system prompt, reducing hallucination
4. **Retry loop**: Validator → Code Generator feedback loop (max 2 retries) ensures self-correction

### State Flow

All agents communicate through a shared `AgentState` TypedDict. Key fields:
- `dataset_context`: Cached schema analysis (set once per file upload, reused across queries)
- `generated_code` / `execution_result`: Flow from Code Generator → Executor → Validator
- `thought_trace`: Append-only log streamed to the frontend in real-time via SSE
- `validation_feedback` + `retry_count`: Enable the retry loop

### API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload CSV files, auto-detect schema |
| `/api/datasets/{session_id}` | GET | List uploaded files with schemas |
| `/api/datasets/{session_id}/{filename}` | DELETE | Remove a file |
| `/api/chat` | POST | SSE stream — thought trace events + final answer |
| `/api/health` | GET | Health check |

### Frontend

Three-panel React layout with Tailwind CSS:
- **Left**: File Management (drag-and-drop upload, file list with metadata)
- **Center**: Chat Interface (message list, suggested queries, markdown rendering)
- **Right**: Thought Trace (real-time agent activity timeline with color-coded status)

### Tech Stack

- **Backend**: Python, FastAPI, LangGraph, LangChain, Google Gemini, Pandas
- **Frontend**: React 18, Vite, Tailwind CSS, React Markdown
- **Streaming**: Server-Sent Events (SSE) via sse-starlette

## Project Structure

```
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Settings (API keys, paths)
│   ├── requirements.txt
│   ├── api/
│   │   ├── routes_upload.py       # File upload endpoints
│   │   └── routes_chat.py         # SSE streaming chat endpoint
│   ├── agents/
│   │   ├── state.py               # AgentState TypedDict
│   │   ├── graph.py               # LangGraph StateGraph wiring
│   │   ├── orchestrator.py        # Query routing agent
│   │   ├── data_identifier.py     # Schema detection agent
│   │   ├── code_generator.py      # Pandas code generation agent
│   │   ├── code_executor.py       # Sandboxed code execution
│   │   ├── validator.py           # Result validation agent
│   │   └── synthesizer.py         # Insight synthesis agent
│   └── services/
│       ├── file_manager.py        # CSV storage & schema extraction
│       └── sandbox.py             # Restricted exec() environment
├── frontend/
│   └── src/
│       ├── App.jsx                # Root component
│       ├── api/client.js          # API client + SSE consumer
│       ├── hooks/                 # useChat, useFileManager
│       └── components/            # Layout, FilePanel, ChatPanel, ThoughtTrace
├── data/                          # Sample CSV datasets
└── README.md
```

## Dependencies

### Backend (requirements.txt)
- fastapi, uvicorn, sse-starlette, python-multipart
- langgraph, langchain-google-genai, langchain-core
- pandas, numpy
- pydantic-settings, python-dotenv

### Frontend (package.json)
- react, react-dom, react-markdown
- vite, tailwindcss, autoprefixer, postcss
