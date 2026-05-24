from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.resource_routes import resource_bp
from routes.ai_routes import ai_bp
import os

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

app.register_blueprint(resource_bp, url_prefix="/api/resources")
app.register_blueprint(ai_bp, url_prefix="/api/ai")

@app.route("/")
def home():
    return send_from_directory("../frontend", "index.html")

@app.route("/<path:path>")
def serve_frontend(path):
    file_path = os.path.join("../frontend", path)
    if os.path.exists(file_path):
        return send_from_directory("../frontend", path)
    return send_from_directory("../frontend", "index.html")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000, threaded=True)