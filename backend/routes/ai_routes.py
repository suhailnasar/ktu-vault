from flask import Blueprint, request, jsonify
from services.gemini_service import explain_topic, summarize_notes, answer_from_qp
from models import Session, Resource

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/explain", methods=["POST"])
def explain():
    data = request.json
    topic = data.get("topic", "")
    subject = data.get("subject", "")

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    from services.gemini_service import chat
    result = chat(topic)
    return jsonify({"explanation": result})

@ai_bp.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    resource_id = data.get("resource_id")

    session = Session()
    resource = session.query(Resource).filter_by(id=resource_id).first()

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    summary = summarize_notes(resource.extracted_text)
    return jsonify({"summary": summary})

@ai_bp.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question", "")
    subject_code = data.get("subject_code", "")

    session = Session()
    papers = session.query(Resource).filter_by(
        subject_code=subject_code,
        category="qp"
    ).all()

    combined_text = "\n\n".join([r.extracted_text for r in papers if r.extracted_text])

    if not combined_text:
        return jsonify({"error": "No question papers found for this subject"}), 404

    result = answer_from_qp(question, combined_text)
    return jsonify({"answer": result})
@ai_bp.route("/chat-with-resource", methods=["POST"])
def chat_with_resource():
    data = request.json
    message = data.get("message", "")
    resource_id = data.get("resource_id")

    session = Session()
    resource = session.query(Resource).filter_by(id=resource_id).first()

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    from services.gemini_service import chat
    prompt = f"""The user has shared this document with you:
Title: {resource.title}
Subject: {resource.subject_name}

Document content:
{resource.extracted_text[:4000]}

User message: {message}"""

    result = chat(prompt, session_id=f"resource_{resource_id}")
    return jsonify({"explanation": result})


@ai_bp.route("/chat-with-file", methods=["POST"])
def chat_with_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    message = request.form.get("message", "Summarize this document")

    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        file.save(tmp.name)
        from services.pdf_parser import extract_text_from_pdf
        extracted = extract_text_from_pdf(tmp.name)

    from services.gemini_service import chat
    prompt = f"""The user has uploaded a document named "{file.filename}".

Document content:
{extracted[:4000]}

User message: {message}"""

    result = chat(prompt, session_id="uploaded_file")
    return jsonify({"explanation": result})
@ai_bp.route("/chat-with-image", methods=["POST"])
def chat_with_image():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    message = request.form.get("message", "What does this image show? If it's a question paper, read and explain the questions.")

    import base64
    image_data = base64.b64encode(image_file.read()).decode("utf-8")
    mime_type = image_file.content_type or "image/jpeg"

    import google.generativeai as genai
    from dotenv import load_dotenv
    import os
    load_dotenv()
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content([
        {
            "inline_data": {
                "mime_type": mime_type,
                "data": image_data
            }
        },
        message
    ])

    return jsonify({"explanation": response.text})