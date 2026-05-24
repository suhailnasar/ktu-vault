from flask import Blueprint, request, jsonify, send_file
from models import Session, Resource
from services.pdf_parser import extract_text_from_pdf
import os

resource_bp = Blueprint("resources", __name__)

@resource_bp.route("/upload", methods=["POST"])
def upload_resource():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    semester = request.form.get("semester")
    branch = request.form.get("branch")
    subject_code = request.form.get("subject_code")
    subject_name = request.form.get("subject_name")
    category = request.form.get("category")
    title = request.form.get("title")

    folder = f"data/{category}"
    os.makedirs(folder, exist_ok=True)
    file_path = f"{folder}/{file.filename}"
    file.save(file_path)

    extracted_text = extract_text_from_pdf(file_path)

    session = Session()
    resource = Resource(
        semester=int(semester),
        branch=branch,
        subject_code=subject_code,
        subject_name=subject_name,
        category=category,
        title=title,
        file_path=file_path,
        extracted_text=extracted_text
    )
    session.add(resource)
    session.commit()

    return jsonify({
        "message": "Resource uploaded successfully",
        "title": title,
        "category": category
    })

@resource_bp.route("/search", methods=["GET"])
def search_resources():
    semester = request.args.get("semester")
    branch = request.args.get("branch")
    subject_code = request.args.get("subject_code")
    category = request.args.get("category")
    keyword = request.args.get("keyword")

    session = Session()
    query = session.query(Resource)

    if semester:
        query = query.filter(Resource.semester == int(semester))
    if category:
        query = query.filter(Resource.category == category)
    if subject_code:
        query = query.filter(Resource.subject_code == subject_code)
    if keyword:
        query = query.filter(
            Resource.title.contains(keyword) |
            Resource.subject_name.contains(keyword)
        )

    results = query.all()

    if branch:
        results = [r for r in results if branch in [b.strip() for b in r.branch.split(',')]]

    return jsonify([{
        "id": r.id,
        "title": r.title,
        "subject_name": r.subject_name,
        "subject_code": r.subject_code,
        "category": r.category,
        "semester": r.semester,
        "branch": r.branch,
        "file_path": r.file_path
    } for r in results])

@resource_bp.route("/file/<int:resource_id>", methods=["GET"])
def serve_file(resource_id):
    session = Session()
    resource = session.query(Resource).filter_by(id=resource_id).first()

    if not resource:
        return jsonify({"error": "Resource not found"}), 404

    abs_path = os.path.abspath(resource.file_path)

    if not os.path.exists(abs_path):
        return jsonify({"error": f"File not found at {abs_path}"}), 404

    return send_file(
        abs_path,
        mimetype="application/pdf",
        as_attachment=False
    )