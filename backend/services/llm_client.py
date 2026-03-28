"""
Unified LLM client that supports multiple providers:
- Groq
- OpenAI
- Google Gemini
- Anthropic Claude
- Azure OpenAI
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv, set_key

ENV_PATH = Path(__file__).parent.parent / ".env"

# Provider registry: provider_id -> config
PROVIDERS = {
    "groq": {
        "name": "Groq",
        "env_key": "GROQ_API_KEY",
        "env_model": "GROQ_MODEL",
        "default_model": "llama-3.3-70b-versatile",
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
    },
    "openai": {
        "name": "OpenAI",
        "env_key": "OPENAI_API_KEY",
        "env_model": "OPENAI_MODEL",
        "default_model": "gpt-4o",
        "models": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "o1-mini",
        ],
    },
    "gemini": {
        "name": "Google Gemini",
        "env_key": "GEMINI_API_KEY",
        "env_model": "GEMINI_MODEL",
        "default_model": "gemini-2.0-flash",
        "models": [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
        ],
    },
    "claude": {
        "name": "Anthropic Claude",
        "env_key": "ANTHROPIC_API_KEY",
        "env_model": "CLAUDE_MODEL",
        "default_model": "claude-sonnet-4-20250514",
        "models": [
            "claude-sonnet-4-20250514",
            "claude-haiku-4-20250514",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
        ],
    },
    "azure": {
        "name": "Azure OpenAI",
        "env_key": "AZURE_OPENAI_API_KEY",
        "env_model": "AZURE_OPENAI_MODEL",
        "default_model": "gpt-4o",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-35-turbo"],
        "extra_env": {
            "AZURE_OPENAI_ENDPOINT": "",
            "AZURE_OPENAI_API_VERSION": "2024-06-01",
        },
    },
}


def _reload_env():
    """Reload .env file to pick up changes."""
    load_dotenv(ENV_PATH, override=True)


def get_all_provider_configs():
    """Return all providers with their current configuration status."""
    _reload_env()
    result = []
    for pid, pinfo in PROVIDERS.items():
        api_key = os.getenv(pinfo["env_key"], "")
        model = os.getenv(pinfo["env_model"], pinfo["default_model"])
        extra = {}
        if "extra_env" in pinfo:
            for k in pinfo["extra_env"]:
                extra[k] = os.getenv(k, "")

        result.append({
            "id": pid,
            "name": pinfo["name"],
            "configured": bool(api_key),
            "api_key_set": bool(api_key),
            "api_key_preview": f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else ("****" if api_key else ""),
            "model": model,
            "available_models": pinfo["models"],
            "extra": extra,
        })
    return result


def get_active_provider():
    """Return the currently active provider ID and model."""
    _reload_env()
    active = os.getenv("ACTIVE_LLM_PROVIDER", "groq")
    if active not in PROVIDERS:
        active = "groq"
    pinfo = PROVIDERS[active]
    model = os.getenv(pinfo["env_model"], pinfo["default_model"])
    return {"provider": active, "model": model, "name": pinfo["name"]}


def save_provider_config(provider_id: str, api_key: str, model: str, extra: dict = None):
    """Save or update a provider's config in .env file."""
    if provider_id not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider_id}")

    pinfo = PROVIDERS[provider_id]

    # Ensure .env exists
    if not ENV_PATH.exists():
        ENV_PATH.touch()

    # Write API key
    if api_key:
        set_key(str(ENV_PATH), pinfo["env_key"], api_key)

    # Write model
    if model:
        set_key(str(ENV_PATH), pinfo["env_model"], model)

    # Write extra env vars (e.g., Azure endpoint)
    if extra and "extra_env" in pinfo:
        for k, v in extra.items():
            if k in pinfo["extra_env"] and v:
                set_key(str(ENV_PATH), k, v)

    # Set as active provider
    set_key(str(ENV_PATH), "ACTIVE_LLM_PROVIDER", provider_id)

    # Reload env
    _reload_env()

    return get_active_provider()


def remove_provider_config(provider_id: str):
    """Remove a provider's API key from .env (deactivate it)."""
    if provider_id not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider_id}")

    pinfo = PROVIDERS[provider_id]

    if not ENV_PATH.exists():
        return

    # Read current .env
    lines = ENV_PATH.read_text(encoding="utf-8").splitlines()
    keys_to_remove = {pinfo["env_key"], pinfo["env_model"]}
    if "extra_env" in pinfo:
        keys_to_remove.update(pinfo["extra_env"].keys())

    filtered = [l for l in lines if not any(l.startswith(f"{k}=") for k in keys_to_remove)]
    ENV_PATH.write_text("\n".join(filtered) + "\n", encoding="utf-8")

    # Remove from os.environ so they don't linger after .env reload
    for k in keys_to_remove:
        os.environ.pop(k, None)

    # If this was the active provider, fall back to groq
    _reload_env()
    active = os.getenv("ACTIVE_LLM_PROVIDER", "groq")
    if active == provider_id:
        set_key(str(ENV_PATH), "ACTIVE_LLM_PROVIDER", "groq")
        _reload_env()


async def llm_completion(messages: list, temperature: float = 0, max_tokens: int = 2048) -> str:
    """
    Unified LLM completion call. Routes to the active provider.
    Returns the text content of the response.
    """
    _reload_env()
    active = os.getenv("ACTIVE_LLM_PROVIDER", "groq")
    pinfo = PROVIDERS.get(active, PROVIDERS["groq"])

    api_key = os.getenv(pinfo["env_key"], "")
    model = os.getenv(pinfo["env_model"], pinfo["default_model"])

    if not api_key:
        raise ValueError(f"No API key configured for {pinfo['name']}. Please add your API key in LLM Settings.")

    if active == "groq":
        return await _call_groq(api_key, model, messages, temperature, max_tokens)
    elif active == "openai":
        return await _call_openai(api_key, model, messages, temperature, max_tokens)
    elif active == "gemini":
        return await _call_gemini(api_key, model, messages, temperature, max_tokens)
    elif active == "claude":
        return await _call_claude(api_key, model, messages, temperature, max_tokens)
    elif active == "azure":
        return await _call_azure(api_key, model, messages, temperature, max_tokens)
    else:
        raise ValueError(f"Unsupported provider: {active}")


async def _call_groq(api_key, model, messages, temperature, max_tokens):
    from groq import AsyncGroq
    client = AsyncGroq(api_key=api_key)
    response = await client.chat.completions.create(
        model=model, messages=messages, temperature=temperature, max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


async def _call_openai(api_key, model, messages, temperature, max_tokens):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    response = await client.chat.completions.create(
        model=model, messages=messages, temperature=temperature, max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


async def _call_gemini(api_key, model, messages, temperature, max_tokens):
    from google import genai
    client = genai.Client(api_key=api_key)

    # Convert OpenAI-style messages to Gemini format
    system_instruction = None
    contents = []
    for m in messages:
        if m["role"] == "system":
            system_instruction = m["content"]
        elif m["role"] == "user":
            contents.append({"role": "user", "parts": [{"text": m["content"]}]})
        elif m["role"] == "assistant":
            contents.append({"role": "model", "parts": [{"text": m["content"]}]})

    config = {
        "temperature": temperature,
        "max_output_tokens": max_tokens,
    }
    if system_instruction:
        config["system_instruction"] = system_instruction

    response = client.models.generate_content(
        model=model, contents=contents, config=config,
    )
    return response.text.strip()


async def _call_claude(api_key, model, messages, temperature, max_tokens):
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)

    # Separate system message
    system_text = ""
    chat_messages = []
    for m in messages:
        if m["role"] == "system":
            system_text = m["content"]
        else:
            chat_messages.append({"role": m["role"], "content": m["content"]})

    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_text,
        messages=chat_messages,
        temperature=temperature,
    )
    return response.content[0].text.strip()


async def _call_azure(api_key, model, messages, temperature, max_tokens):
    from openai import AsyncAzureOpenAI
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01")

    if not endpoint:
        raise ValueError("Azure OpenAI endpoint not configured. Set AZURE_OPENAI_ENDPOINT in LLM Settings.")

    client = AsyncAzureOpenAI(
        api_key=api_key,
        azure_endpoint=endpoint,
        api_version=api_version,
    )
    response = await client.chat.completions.create(
        model=model, messages=messages, temperature=temperature, max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
