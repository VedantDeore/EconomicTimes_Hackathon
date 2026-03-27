from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from bson import ObjectId
from datetime import datetime, timezone

from app.engines.ai_client import ai_client
from app.database import get_database

ws_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)

    async def send_message(self, session_id: str, message: str):
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_text(message)


manager = ConnectionManager()

FINANCE_SYSTEM_PROMPT = """You are ET, an AI-powered personal finance mentor for India.
You help users with financial planning, investments, tax optimization, and wealth building.
You understand Indian financial instruments (PPF, NPS, ELSS, FDs, mutual funds),
Indian tax laws (all sections of Income Tax Act), and Indian insurance products.
Always provide amounts in INR (₹). Be specific, actionable, and empathetic.
Never give generic advice — always personalize based on the user's situation."""


@ws_router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    db = get_database()

    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            user_id = data.get("user_id", "")

            # Get user context
            context = ""
            if user_id:
                profile = await db.financial_profiles.find_one(
                    {"user_id": ObjectId(user_id)}
                )
                if profile:
                    income = profile.get("annual_income", {}).get("gross", 0)
                    risk = profile.get("risk_profile", "moderate")
                    context = f"\n\nUser context: Annual income ₹{income:,.0f}, Risk profile: {risk}"

            # Generate AI response
            full_prompt = f"{user_message}{context}"
            response = await ai_client.generate(full_prompt, FINANCE_SYSTEM_PROMPT)

            await manager.send_message(
                session_id,
                response,
            )

            # Save chat history
            if user_id:
                await db.life_events.update_one(
                    {"user_id": ObjectId(user_id)},
                    {
                        "$push": {
                            "chat_history": {
                                "$each": [
                                    {"role": "user", "content": user_message, "timestamp": datetime.now(timezone.utc)},
                                    {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc)},
                                ]
                            }
                        }
                    },
                    upsert=True,
                )

    except WebSocketDisconnect:
        manager.disconnect(session_id)
