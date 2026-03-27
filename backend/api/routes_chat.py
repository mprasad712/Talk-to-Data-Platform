import json
import logging
import traceback
from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from agents.graph import agent_graph
from services.file_manager import get_file_paths, get_dataset_context, get_session

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    query: str


@router.post("/chat")
async def chat(request: ChatRequest):
    session = get_session(request.session_id)
    if not session:
        async def error_gen():
            yield {
                "event": "error",
                "data": json.dumps({"message": "Session not found. Please upload files first."}),
            }
            yield {"event": "done", "data": "{}"}
        return EventSourceResponse(error_gen())

    file_paths = get_file_paths(request.session_id)
    dataset_context = get_dataset_context(request.session_id)

    initial_state = {
        "user_query": request.query,
        "session_id": request.session_id,
        "dataset_file_paths": file_paths,
        "dataset_context": dataset_context,
        "next_agent": None,
        "generated_code": None,
        "execution_result": None,
        "execution_error": None,
        "is_valid": None,
        "validation_feedback": None,
        "retry_count": 0,
        "final_answer": None,
        "thought_trace": [],
    }

    async def event_generator():
        try:
            logger.info("Starting agent graph for query: %s", request.query)
            async for event in agent_graph.astream(
                initial_state,
                stream_mode="updates",
            ):
                for node_name, update in event.items():
                    if node_name == "__end__":
                        continue

                    logger.info("Node completed: %s", node_name)

                    # Stream thought trace entries
                    new_traces = update.get("thought_trace", [])
                    for trace in new_traces:
                        yield {
                            "event": "thought",
                            "data": json.dumps(trace),
                        }

                    # Stream generated code if available
                    if update.get("generated_code"):
                        yield {
                            "event": "code",
                            "data": json.dumps({
                                "code": update["generated_code"],
                            }),
                        }

                    # Stream final answer
                    if update.get("final_answer"):
                        yield {
                            "event": "answer",
                            "data": json.dumps({
                                "content": update["final_answer"],
                            }),
                        }

        except Exception as e:
            error_msg = str(e)
            logger.error("Agent graph error: %s\n%s", error_msg, traceback.format_exc())
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": "Error: {}".format(error_msg),
                }),
            }

        yield {
            "event": "done",
            "data": "{}",
        }

    return EventSourceResponse(event_generator())
