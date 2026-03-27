import google.generativeai as genai
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()


class AIClient:
    """Unified AI client wrapper for Gemini and OpenAI."""

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        if self.provider == "gemini":
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-1.5-pro")
        else:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        """Generate AI response from the configured provider."""
        try:
            if self.provider == "gemini":
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                response = self.model.generate_content(full_prompt)
                return response.text
            else:
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=4000,
                )
                return response.choices[0].message.content
        except Exception as e:
            return f"AI generation failed: {str(e)}"

    async def generate_json(self, prompt: str, system_prompt: str = "") -> str:
        """Generate structured JSON response."""
        json_instruction = "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation."
        return await self.generate(prompt + json_instruction, system_prompt)


# Singleton
ai_client = AIClient()
