import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(
    "gemini-2.5-flash",
    system_instruction="""You are KTU Vault AI, a smart study assistant for KTU (Kerala Technological University) engineering students in India.

You behave like a knowledgeable friend — casual, helpful, and direct. 

Rules:
- For casual messages like "hi", "hello", "how are you" — respond naturally and briefly like a real person would. No long paragraphs.
- For topic explanations — be clear and structured but not unnecessarily long.
- For exam questions — be precise and exam-focused.
- For general conversation — keep it short and natural.
- Never pad responses with unnecessary text.
- Match the length of your response to what was actually asked.
- You can talk about anything but always be ready to help with KTU studies."""
)

chat_sessions = {}

def get_or_create_session(session_id="default"):
    if session_id not in chat_sessions:
        chat_sessions[session_id] = model.start_chat(history=[])
    return chat_sessions[session_id]

def chat(message, session_id="default"):
    session = get_or_create_session(session_id)
    response = session.send_message(message)
    return response.text

def explain_topic(topic, subject=""):
    prompt = f"Explain this KTU topic clearly: {topic}" + (f" (Subject: {subject})" if subject else "")
    return chat(prompt, session_id="explain")

def summarize_notes(text):
    prompt = f"Summarize these notes into concise KTU exam revision points:\n\n{text[:3000]}"
    return chat(prompt, session_id="summarize")

def answer_from_qp(question, qp_text):
    prompt = f"Based on these KTU past papers:\n{qp_text[:3000]}\n\nAnswer: {question}"
    return chat(prompt, session_id="qp")