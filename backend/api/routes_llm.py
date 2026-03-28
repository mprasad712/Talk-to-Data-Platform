from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llm_client import (
    get_all_provider_configs,
    get_active_provider,
    save_provider_config,
    remove_provider_config,
)

router = APIRouter()


class ProviderConfigRequest(BaseModel):
    provider: str
    api_key: str = ""
    model: str = ""
    extra: dict = {}


class SetActiveRequest(BaseModel):
    provider: str


@router.get("/llm/providers")
async def list_providers():
    """List all supported providers with their configuration status."""
    return {
        "providers": get_all_provider_configs(),
        "active": get_active_provider(),
    }


@router.post("/llm/configure")
async def configure_provider(req: ProviderConfigRequest):
    """Add or update a provider's configuration. Saves to .env file."""
    try:
        active = save_provider_config(
            provider_id=req.provider,
            api_key=req.api_key,
            model=req.model,
            extra=req.extra,
        )
        return {
            "status": "ok",
            "message": f"{active['name']} configured successfully",
            "active": active,
            "providers": get_all_provider_configs(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/llm/activate")
async def activate_provider(req: SetActiveRequest):
    """Switch the active LLM provider (must already be configured)."""
    providers = {p["id"]: p for p in get_all_provider_configs()}
    if req.provider not in providers:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {req.provider}")
    if not providers[req.provider]["configured"]:
        raise HTTPException(status_code=400, detail=f"Provider {req.provider} has no API key configured")

    from services.llm_client import ENV_PATH
    from dotenv import set_key
    set_key(str(ENV_PATH), "ACTIVE_LLM_PROVIDER", req.provider)

    return {
        "status": "ok",
        "active": get_active_provider(),
        "providers": get_all_provider_configs(),
    }


@router.delete("/llm/providers/{provider_id}")
async def delete_provider(provider_id: str):
    """Remove a provider's API key from .env."""
    try:
        remove_provider_config(provider_id)
        return {
            "status": "ok",
            "message": f"Provider {provider_id} removed",
            "active": get_active_provider(),
            "providers": get_all_provider_configs(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/llm/test")
async def test_provider(req: ProviderConfigRequest):
    """Test a provider's API key with a simple call."""
    from services.llm_client import llm_completion, save_provider_config

    # Temporarily save config to test
    try:
        save_provider_config(
            provider_id=req.provider,
            api_key=req.api_key,
            model=req.model,
            extra=req.extra,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = await llm_completion(
            messages=[
                {"role": "system", "content": "Respond with exactly: CONNECTION_OK"},
                {"role": "user", "content": "Test connection."},
            ],
            temperature=0,
            max_tokens=20,
        )
        return {"status": "ok", "message": f"Connection successful: {result[:50]}"}
    except Exception as e:
        return {"status": "error", "message": f"Connection failed: {str(e)[:200]}"}
