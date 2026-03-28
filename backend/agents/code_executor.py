from datetime import datetime
from agents.state import AgentState
from services.sandbox import execute_code


async def code_executor_node(state: AgentState) -> dict:
    trace_entry = {
        "agent": "code_executor",
        "status": "running",
        "message": "Executing generated Python code...",
        "timestamp": datetime.now().isoformat(),
    }

    code = state.get("generated_code", "")
    if not code:
        error_entry = {
            "agent": "code_executor",
            "status": "error",
            "message": "No code to execute.",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "execution_result": None,
            "execution_error": "No code was generated to execute.",
            "thought_trace": [trace_entry, error_entry],
        }

    result = execute_code(code)

    if result["success"]:
        done_entry = {
            "agent": "code_executor",
            "status": "done",
            "message": "Code executed successfully.",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "execution_result": result["result"],
            "execution_result_markdown": result.get("result_markdown"),
            "execution_error": None,
            "thought_trace": [trace_entry, done_entry],
        }
    else:
        error_entry = {
            "agent": "code_executor",
            "status": "error",
            "message": f"Execution failed: {result['error'][:200]}",
            "timestamp": datetime.now().isoformat(),
        }
        return {
            "execution_result": None,
            "execution_error": result["error"],
            "thought_trace": [trace_entry, error_entry],
        }
