# KTU Vault 📚

> AI-powered study companion for KTU engineering students

KTU Vault is a full-stack web application that gives Kerala Technological University students a centralized platform to access notes, question papers, model QPs, and syllabi — organized by semester, branch, and subject. Built with an AI chatbot powered by Google Gemini for topic explanations, exam pattern analysis, and document-based Q&A.

---

## Features

- **Resource Library** — Notes, question papers, model QPs, and syllabi organized by semester, branch, and subject
- **AI Chat (VaultAI)** — Powered by Google Gemini 2.5 Flash for topic explanations, exam Q&A, and document analysis
- **PDF Viewer** — Built-in viewer with module-wise reading progress tracker
- **Smart Search** — Search across all resources by keyword, subject, or category
- **Branch Filter** — Browse resources specific to your branch (CSE, CSD, IT, AI-ML, EEE, EIE, ECE and more)
- **File Upload to AI** — Upload images or PDFs from device or pick directly from the library to ask AI
- **Continue Reading** — Tracks your reading progress and shows where you left off
- **Mobile First** — Fully responsive, works seamlessly on mobile browsers
- **PWA Ready** — Can be installed on Android as a home screen app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| Database | SQLite + SQLAlchemy |
| PDF Parsing | PyMuPDF (fitz) |
| AI | Google Gemini 2.5 Flash API |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Cross-Origin | Flask-CORS |
| Production Server | Gunicorn |
| Deployment | Render (backend) |
| Version Control | Git + GitHub |

---

## Project Structure


ktu-companion/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── models.py               # SQLAlchemy database models
│   ├── requirements.txt
│   ├── routes/
│   │   ├── resource_routes.py  # Upload, search, serve files
│   │   └── ai_routes.py        # AI explain, chat, summarize
│   ├── services/
│   │   ├── gemini_service.py   # Gemini API wrapper
│   │   └── pdf_parser.py       # PDF text extraction
│   └── data/                   # Uploaded PDFs (local only)
│       ├── notes/
│       ├── question_papers/
│       ├── model_qp/
│       └── syllabus/
│
└── frontend/
    ├── index.html              # Home page
    ├── library.html            # Resource library
    ├── browse.html             # Semester/branch/subject browser
    ├── ai.html                 # AI chat interface
    ├── viewer.html             # PDF viewer with progress tracker
    ├── css/
    │   └── main.css
    └── js/
        ├── api.js              # Centralized API calls
        ├── index.js
        ├── library.js
        ├── browse.js
        ├── ai.js
        └── viewer.js


---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/resources/upload | Upload a PDF resource |
| GET | /api/resources/search | Search resources by filters |
| GET | /api/resources/file/<id> | Serve a PDF file |
| POST | /api/ai/explain` | AI topic explanation |
| POST | /api/ai/chat-with-resource | AI chat with vault resource context |
| POST | /api/ai/chat-with-file | AI chat with uploaded file |
| POST |`/api/ai/chat-with-image | AI vision — read image of QP |
| POST | /api/ai/summarize | Summarize a resource |
| POST | /api/ai/ask | Ask AI from past papers |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Git

### Steps

bash
# Clone the repository
git clone https://github.com/suhailnasar/ktu-vault.git
cd ktu-vault

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt


### Environment Variables

Create a .env file inside the backend folder:


GEMINI_API_KEY=your_gemini_api_key_here


Get your free Gemini API key at: https://aistudio.google.com/app/apikey

### Run

bash
cd backend
python app.py


Open http://127.0.0.1:5000 in your browser.



## Uploading Resources

Use Postman or any HTTP client to upload PDFs:

**POST** http://127.0.0.1:5000/api/resources/upload

Body (form-data):

| Key | Value |
|---|---|
| semester | 3 |
| branch | CSE,CSD,AI-ML (comma-separated) |
| subject_code | PCCST303 |
| subject_name | Data Structures and Algorithms |
| category | notes / qp / model_qp / syllabus |
| title | DSA Module 1 Notes |
| file | (select PDF file) |

---

## Supported Branches (S3)

- CSE, CSD, IT
- AI-ML, AI-DS
- CSE(DS), CSE(AI), CSE(Cyber)
- ECE, EEE, EIE, ME, CE

---

## Screenshots

> Coming soon

---

## Roadmap

- [x] Resource library with PDF viewer
- [x] AI-powered topic explanations
- [x] Branch and semester filtering
- [x] Module progress tracker
- [x] AI chat with document context
- [x] Image upload for AI vision
- [ ] User authentication
- [ ] Cloud storage for PDFs
- [ ] PWA manifest and offline support
- [ ] More semesters and branches

---

## Author

**Mohammed Suhail**
B.Tech CSD Student, FISAT
IIT Madras BS Data Science (concurrent)

GitHub: [@suhailnasar](https://github.com/suhailnasar)

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

> Built for KTU students, by a KTU student.
