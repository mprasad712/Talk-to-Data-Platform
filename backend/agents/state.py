from typing import TypedDict, Optional, Annotated, Dict, List


def merge_traces(left: List[dict], right: List[dict]) -> List[dict]:
    """Merge thought traces by appending new entries."""
    return left + right


class AgentState(TypedDict):
    # Input
    user_query: str
    session_id: str
    dataset_file_paths: List[str]

    # Data Identifier output (cached across queries in same session)
    dataset_context: Optional[str]  # JSON: schemas, join keys, samples

    # Orchestrator output
    next_agent: Optional[str]  # Routing target

    # Code Generator output
    generated_code: Optional[str]  # Python/Pandas source code

    # Code Executor output
    execution_result: Optional[str]  # Stringified result
    execution_error: Optional[str]  # Traceback if exec failed

    # Validator output
    is_valid: Optional[bool]
    validation_feedback: Optional[str]  # Feedback for retry

    # Retry tracking
    retry_count: int  # Max 2

    # Synthesizer output
    final_answer: Optional[str]  # Natural-language answer

    # Streaming / thought trace
    thought_trace: Annotated[List[dict], merge_traces]
