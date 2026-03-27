from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.orchestrator import orchestrator_node
from agents.data_identifier import data_identifier_node
from agents.code_generator import code_generator_node
from agents.code_executor import code_executor_node
from agents.validator import validator_node
from agents.synthesizer import synthesizer_node
from config import settings


def route_from_orchestrator(state: AgentState) -> str:
    """Route based on orchestrator's decision."""
    next_agent = state.get("next_agent", "code_generator")
    if next_agent in ("data_identifier", "code_generator", "synthesizer"):
        return next_agent
    return "code_generator"


def route_from_validator(state: AgentState) -> str:
    """Route based on validation result."""
    if state.get("is_valid"):
        return "synthesizer"
    if state.get("retry_count", 0) >= settings.MAX_RETRIES:
        # Max retries exceeded, synthesize with what we have
        return "synthesizer"
    return "code_generator"


def build_graph() -> StateGraph:
    """Build and compile the multi-agent LangGraph."""
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("data_identifier", data_identifier_node)
    graph.add_node("code_generator", code_generator_node)
    graph.add_node("code_executor", code_executor_node)
    graph.add_node("validator", validator_node)
    graph.add_node("synthesizer", synthesizer_node)

    # Entry point
    graph.set_entry_point("orchestrator")

    # Orchestrator routes conditionally
    graph.add_conditional_edges(
        "orchestrator",
        route_from_orchestrator,
        {
            "data_identifier": "data_identifier",
            "code_generator": "code_generator",
            "synthesizer": "synthesizer",
        },
    )

    # Data identifier flows back to orchestrator (which will then route to code_generator)
    graph.add_edge("data_identifier", "orchestrator")

    # Code generator always flows to executor
    graph.add_edge("code_generator", "code_executor")

    # Executor always flows to validator
    graph.add_edge("code_executor", "validator")

    # Validator conditionally routes
    graph.add_conditional_edges(
        "validator",
        route_from_validator,
        {
            "code_generator": "code_generator",
            "synthesizer": "synthesizer",
        },
    )

    # Synthesizer is the terminal node
    graph.add_edge("synthesizer", END)

    return graph.compile()


# Compiled graph instance
agent_graph = build_graph()
