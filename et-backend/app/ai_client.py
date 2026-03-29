"""AI client — Groq primary, HuggingFace fallback. Synchronous."""

import json
import requests as http_requests
from app.config import get_settings

settings = get_settings()

# ── Model configuration ──────────────────────────────────────────────

GROQ_MODEL = "llama-3.3-70b-versatile"
HF_MODEL = "Qwen/Qwen2.5-72B-Instruct"
_HF_API_URL = "https://api-inference.huggingface.co/v1/chat/completions"

# ── Groq client ──────────────────────────────────────────────────────

_groq_client = None
if settings.GROQ_API_KEY:
    try:
        from groq import Groq
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
        print(f"[AI] Groq initialized with model: {GROQ_MODEL}", flush=True)
    except Exception as e:
        print(f"[AI] Groq init failed: {e}", flush=True)
        _groq_client = None

_hf_available = bool(settings.HF_TOKEN)
if _hf_available:
    print(f"[AI] HuggingFace fallback enabled with model: {HF_MODEL}", flush=True)


# ── Groq generation ─────────────────────────────────────────────────

def _groq_generate(prompt: str, system_prompt: str = "", json_mode: bool = False) -> str:
    if not _groq_client:
        raise RuntimeError("Groq client not configured")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    kwargs: dict = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = _groq_client.chat.completions.create(**kwargs)
    return response.choices[0].message.content or ""


# ── HuggingFace generation ───────────────────────────────────────────

def _hf_generate(prompt: str, system_prompt: str = "", json_mode: bool = False) -> str:
    if not _hf_available:
        raise RuntimeError("HuggingFace token not configured")

    messages = []
    if system_prompt:
        sys_text = system_prompt
        if json_mode:
            sys_text += "\nYou MUST respond with valid JSON only. No markdown, no explanation."
        messages.append({"role": "system", "content": sys_text})
    messages.append({"role": "user", "content": prompt})

    payload: dict = {
        "model": HF_MODEL,
        "messages": messages,
        "max_tokens": 4096,
        "temperature": 0.3,
        "stream": False,
    }

    resp = http_requests.post(
        _HF_API_URL,
        headers={
            "Authorization": f"Bearer {settings.HF_TOKEN}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"] or ""


# ── Public API ───────────────────────────────────────────────────────

def generate(prompt: str, system_prompt: str = "") -> str:
    """Generate text. Tries Groq first, then HuggingFace."""
    if _groq_client:
        try:
            return _groq_generate(prompt, system_prompt)
        except Exception as e:
            print(f"[AI] Groq failed: {e}", flush=True)

    if _hf_available:
        try:
            return _hf_generate(prompt, system_prompt)
        except Exception as e:
            print(f"[AI] HuggingFace failed: {e}", flush=True)

    return "AI is temporarily unavailable. Please try again in a moment."


def generate_json(prompt: str, system_prompt: str = "") -> str:
    """Generate JSON. Tries Groq (json_mode) first, then HuggingFace."""
    json_instruction = "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, no code fences."
    full_prompt = prompt + json_instruction

    if _groq_client:
        try:
            return _groq_generate(full_prompt, system_prompt, json_mode=True)
        except Exception as e:
            print(f"[AI-JSON] Groq failed: {e}", flush=True)

    if _hf_available:
        try:
            result = _hf_generate(full_prompt, system_prompt, json_mode=True)
            # Clean up HF response: strip markdown code fences if present
            cleaned = result.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines).strip()
            return cleaned
        except Exception as e:
            print(f"[AI-JSON] HuggingFace failed: {e}", flush=True)

    return "{}"


def generate_with_tools(
    messages: list[dict],
    tools: list[dict],
    system_prompt: str = "",
) -> dict:
    """Generate with tool-calling (Groq native, HF fallback to plain text)."""
    if _groq_client:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(messages)

        try:
            response = _groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=all_messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=4096,
            )

            choice = response.choices[0]
            if choice.message.tool_calls:
                return {
                    "type": "tool_calls",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "function": tc.function.name,
                            "arguments": json.loads(tc.function.arguments),
                        }
                        for tc in choice.message.tool_calls
                    ],
                }
            return {"type": "text", "content": choice.message.content or ""}
        except Exception as e:
            print(f"[AI-Tools] Groq failed: {e}", flush=True)

    user_msg = messages[-1].get("content", "") if messages else ""
    return {"type": "text", "content": generate(user_msg, system_prompt)}
