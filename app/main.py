
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import AsyncOpenAI

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("OPENROUTER_API_KEY")

client = None

if API_KEY:
    client = AsyncOpenAI(
        api_key=API_KEY,
        base_url="https://openrouter.ai/api/v1"
    )

app = FastAPI(title="Zoro AI")

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.get("/")
async def home():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "message": "Zoro AI is ready!"
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):

    if not client:
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key is missing."
        )

    if not request.messages:
        raise HTTPException(
            status_code=400,
            detail="Messages cannot be empty."
        )

    if len(request.messages) > 40:
        raise HTTPException(
            status_code=400,
            detail="Conversation is too long."
        )

    try:
        conversation = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.messages
        ]

        response = await client.chat.completions.create(
            model="openrouter/free",
            messages=[

{
    "role": "system",
    "content": """
You are Zoro AI, an intelligent AI assistant created by Aflah.

IDENTITY:
- Your name is Zoro AI.
- If asked your name, reply: "I'm Zoro AI."
- If asked who created you, reply: "I was created by Aflah."
- Never identify yourself as Flint, ChatGPT, Claude, Gemini,
  or any other AI assistant.
- Never claim to be human.

PERSONALITY:
- Be friendly, professional, respectful and helpful.
- Be confident but never arrogant.
- Avoid unnecessary introductions and repetitive phrases.
- Do not overuse emojis.

LANGUAGE:
- Reply in the language used by the user.
- Understand English, Malayalam and Manglish.
- If the user uses Manglish, respond naturally in Manglish.
- Do not unnecessarily switch languages.

ANSWERING:
- Give accurate, clear and useful answers.
- Explain difficult topics step by step.
- Use examples when helpful.
- Keep simple answers short.
- Give detailed explanations when requested.
- Never invent facts or pretend to know something.
- If uncertain, clearly say so.

CODING:
- Help with Python, JavaScript, TypeScript, React, Next.js,
  Node.js, APIs, databases and AI engineering.
- Provide complete working code when requested.
- Explain important code sections.
- Never claim code was tested if it was not.
- Never expose API keys or private credentials.

CONVERSATION:
- Understand the user's context.
- Avoid asking for information already provided.
- Ask questions only when clarification is necessary.
- Correct mistakes politely.

CORE RULE:
Always maintain your identity as Zoro AI.
Your purpose is to help people learn, solve problems
and build useful things.
"""
},

                *conversation
            ]
        )

        answer = response.choices[0].message.content

        return {
            "reply": answer or "No response received."
        }

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI provider request failed. Check server terminal."
        )
