# Zoro AI

A minimal AI chat assistant built with **FastAPI**, **OpenRouter**, and a vanilla HTML/CSS/JavaScript frontend.

## Features

- Chat with an AI assistant through the OpenRouter API
- Conversation context is sent with each request
- Premium, responsive chat interface for desktop and mobile
- Animated response-generation indicator and polished loading states
- Conversation history saved locally in the browser (up to 30 chats)
- New conversation, switch between chats, and clear the current chat
- Suggested prompts and keyboard shortcut (`Ctrl/⌘ + K`)
- Simple health-check endpoint

## Tech stack

- Python
- FastAPI
- OpenAI Python SDK (configured for OpenRouter)
- HTML, CSS, JavaScript

## Requirements

- Python 3.10+
- An OpenRouter API key

## Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/zoro-ai.git
   cd zoro-ai
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

   On Windows:

   ```powershell
   .venv\\Scripts\\Activate.ps1
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Add your own OpenRouter API key to `.env`:

   ```env
   OPENROUTER_API_KEY=your_actual_key
   ```

5. Start the server:

   ```bash
   uvicorn app.main:app --reload
   ```

6. Open `http://127.0.0.1:8000` in your browser.

API documentation is available at `http://127.0.0.1:8000/docs`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Serves the chat interface |
| GET | `/api/health` | Basic health check |
| POST | `/api/chat` | Sends conversation messages to the AI provider |

## Notes

- The backend expects `OPENROUTER_API_KEY` in the environment.
- The model is configured as `openrouter/free`; the provider may route requests to different available free models.
- Conversation history is stored in the current browser using localStorage. It is not synced across devices or accounts. Clearing browser site data removes this local history.
- Do not commit `.env` or publish API keys.
- AI responses can be inaccurate. Verify important information.

## Project status

This is a learning project. It has a polished frontend and a minimal API integration, but it is not production-ready: it does not include authentication, server-side user accounts, rate limiting, or synced chat storage.
