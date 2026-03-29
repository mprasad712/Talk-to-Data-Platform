## Steps to start backend:
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm start


## Details:
# Coro BAIN & COMPANY - Multi-Agent AI Data Analytics Chatbot

An end-to-end AI-powered system built on a multi-agent LangGraph architecture. Users upload CSV datasets ask analytical questions in natural language, and the system automatically detects schemas, generates Python/Pandas code, validates results, and delivers clear business insights.

## Setup Instructions

### Prerequisites

- Python 3.12
- Node.js 22
- An OpenAI API key (the project uses your own OpenAI key for all LLM calls)
- An API key is given , please use the tool directly , everything is working in .env file

### Backend

bash
cd backend
pip install -r requirements.txt

Create or edit the `.env` file in `backend/` and add your OpenAI API key:(currently i have given the api key , please use that)

env
ACTIVE_LLM_PROVIDER='openai'
OPENAI_API_KEY='sk-proj-your-key-here'
OPENAI_MODEL='gpt-4o'

Start the backend:

uvicorn main:app --reload

Backend runs at `http://localhost:8000`

### Frontend

cd frontend
npm install
npm start


Frontend runs at `http://localhost:3000`

## Multi-Agent Architecture

The system uses 6 specialized agents coordinated via a LangGraph StateGraph. Each agent has a single, well-defined responsibility they communicate through a shared `AgentState` and are orchestrated in a directed graph with conditional routing.

### Agent Flow

User Query → Orchestrator → Data Identifier → Code Generator → Code Executor → Validator → Synthesizer → Final Answer

The 6 Agents:
Orchestrator (LLM):
Acts like the manager of the system. It understands the user’s question and decides which agent should handle the next step.
Data Identifier (LLM):
Looks at the uploaded data and understands it — columns, data types, sample values, and relationships between files. This runs once and is reused later.
Code Generator (LLM):
Writes Python (Pandas) code to answer the user’s question. If something goes wrong, it improves the code based on feedback.
Code Executor (No LLM):
Runs the generated code in a safe environment. It captures outputs, results, and any errors.
Validator (LLM):
Checks whether the result makes sense and matches the user’s question. If not, it asks for fixes (up to 2 retries).
Synthesizer (LLM):
Converts the final result into simple, clear insights that a user can easily understand.

## Memory & State Management

All agents communicate through a single shared `AgentState` (a TypedDict). This state flows through the LangGraph pipeline and accumulates outputs from each agent.

user_query → What the user is asking in simple language.
session_id → A unique ID that keeps track of the user’s uploaded data.
chat_history → Previous messages so the system remembers the conversation.
dataset_context → A stored summary of the data (columns, types, relationships) so it doesn’t have to re-check every time.
generated_code → The Python code written to answer the question
execution_result → The output after running that code.
is_valid / validation_feedback → Whether the result looks correct, and if not, what needs fixing.
retry_count → How many times the system has tried to fix errors (max 2 tries).
thought_trace → A live step-by-step log showing what each agent is doing.
final_answer → The final, simple explanation or business insight shown to the user.

## Frontend Layout

Three-panel React interface with Tailwind CSS and dark/light theme support:

- Left Panel — File Management: drag-and-drop CSV upload, file list with metadata, detected relationships.
- Center Panel — Chat Interface: message list, suggested queries, markdown rendering with tables, code blocks.
- Right Panel — Thought Trace: real-time agent activity timeline showing each agent's work as it happens.