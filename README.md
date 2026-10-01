Campus Desk --- AI-Powered Student Support

An AI-powered university student support chatbot combining NLP-based
query classification, distress detection, and Retrieval-Augmented
Generation (RAG) over university knowledge documents.

📌 Project Overview

Campus Desk is an AI/ML-based student support system designed to
help university students get quick, relevant answers to common
campus-related questions.

The current prototype focuses on: - Examinations - College / academic
fees - Hostel - Placement - Attendance - Transport - General campus
support

The system classifies a student's query, checks for distress-related
messages, retrieves relevant information from a university knowledge
base, and returns the answer with its source and retrieval confidence.

🎯 Problem Statement

University support desks receive many repetitive questions about
examinations, fees, hostel facilities, attendance, placements, and
campus services. Static FAQ systems may be difficult to maintain and may
not handle different ways of asking the same question.

Campus Desk provides a centralized AI-assisted interface that: 1.
Understands the student's query. 2. Classifies the query intent. 3.
Checks for distress-related messages. 4. Searches the university
knowledge base. 5. Retrieves relevant information using semantic
similarity. 6. Shows the source and confidence score. 7. Routes
distress-related messages toward student support.

💡 Key Features

AI Query Classification

The prototype supports 10 intents: - exam_schedule - fee_query -
attendance - hostel_rules - cgpa_query - course_registration -
scholarship - library - transport - general_help

Distress Detection

A separate TF-IDF + Logistic Regression classifier identifies distress
and normal messages. Distress-related messages are routed toward
student support instead of being treated as ordinary information
requests.

RAG-Based Knowledge Retrieval

Relevant chunks are retrieved from university documents using Sentence
Transformer embeddings and cosine similarity.

Source-Aware Answers

The chatbot displays the document source used for the retrieved
response.

Confidence and Fallback

The system exposes the best retrieval similarity score and uses a
configurable threshold to avoid presenting low-confidence retrieval as a
sufficiently reliable answer.

Interactive Dashboard

The frontend provides quick actions, chat, AI status, intent,
confidence, source, and system information.

🧠 AI / ML Pipeline

Student Question
       ↓
Distress Detection
       ↓
Intent Classification
       ↓
Semantic Query Embedding
       ↓
Cosine Similarity Retrieval
       ↓
Relevant Knowledge Chunk
       ↓
Source + Confidence
       ↓
Chatbot Response

Intent Classification

Question
   ↓
TF-IDF Vectorization
   ↓
Logistic Regression
   ↓
Intent

Distress Classification

Question
   ↓
TF-IDF Vectorization
   ↓
Balanced Logistic Regression
   ↓
Distress / Normal

RAG Pipeline

University Documents
        ↓
Text Extraction / OCR
        ↓
Cleaning
        ↓
Chunking
        ↓
Sentence Embeddings
        ↓
Stored RAG Knowledge Base
        ↓
Query Embedding
        ↓
Cosine Similarity
        ↓
Top Relevant Chunk

🛠️ Technologies Used

Technology              Purpose

Python                  AI/ML and backend development
Scikit-learn            ML models and TF-IDF
Logistic Regression     Intent and distress classification
TF-IDF                  Text feature extraction
Sentence Transformers   Semantic embeddings
all-MiniLM-L6-v2      Embedding model
Cosine Similarity       Semantic retrieval
RAG                     Knowledge-base retrieval
FastAPI                 Backend REST API
Pydantic                API request validation
HTML                    Frontend structure
CSS                     Dashboard styling
JavaScript              Frontend interaction and API communication
PyMuPDF                 PDF processing
Tesseract OCR           OCR for scanned/image-based PDFs
Joblib                  ML model/vectorizer serialization
Pickle                  RAG data serialization
Git / GitHub            Version control and project hosting

📚 Current Knowledge Base

The current prototype uses five category-oriented PDF sources: -
Academic Calendar and Examination - Hostel Rules - Campus Placement
Record - College Fees - Hostel Fee Structure

The knowledge base is a prototype project dataset. Retrieved
information should be verified against current official university
information before real-world use.

📊 Machine Learning Data

Intent Dataset

The intent dataset contains labeled student questions using:

text
label

It covers the 10 student-support intents listed above.

Distress Dataset

The distress dataset contains:

text
label

with: - distress - normal

The current distress dataset is small and is treated as a prototype
dataset rather than a production clinical or psychological dataset.

🔧 Model Training

Intent Model

TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    max_features=5000
)

LogisticRegression(max_iter=1000)

Distress Model

TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    max_features=3000
)

LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

🔎 RAG Implementation

The RAG data stores:

chunks
metadata
embeddings

Each document is extracted, OCR-processed when required, cleaned, split
into overlapping chunks, converted into sentence embeddings, and stored
with its source filename.

For a query, the same embedding model creates a query vector. Cosine
similarity is then used to identify the most relevant document chunks.

The current retrieval configuration uses the top 3 retrieved chunks and
selects the best result for the displayed answer.

🚀 Project Structure

Campus_Desk/
│
├── backend/
│   ├── main.py
│   ├── intent_model.pkl
│   ├── tfidf_vectorizer.pkl
│   ├── distress_model.pkl
│   ├── distress_vectorizer.pkl
│   └── rag_data.pkl
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── screenshots/
│   ├── campus-desk-home.png
│   ├── campus-desk-chat.png
│   └── campus-desk-hostel-response.png
│
├── .gitignore
└── README.md

⚙️ Installation

Clone the repository

git clone https://github.com/Palak4244/Campus_Desk.git
cd Campus_Desk

Install backend dependencies

pip install fastapi uvicorn scikit-learn joblib sentence-transformers pypdf

PyMuPDF and Tesseract are used for OCR/document preparation when
required.

▶️ Run the Backend

Open Terminal 1:

cd "C:\Users\Palak Singh\Desktop\Campus_desk\backend"
python -m uvicorn main:app --reload

Backend:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/health

Chat API:

POST /chat

Example:

{
  "question": "What is the hostel fee for a four seater room?"
}

🌐 Run the Frontend

Open Terminal 2:

cd "C:\Users\Palak Singh\Desktop\Campus_desk\frontend"
python -m http.server 5500 --bind 127.0.0.1

Open:

http://127.0.0.1:5500/

The frontend communicates with:

http://127.0.0.1:8000/chat

🖥️ Screenshots

Campus Desk Dashboard



Chat Interface



RAG-Based Hostel Response



🔌 API Response Example

Normal query:

{
  "answer": "Retrieved information...",
  "intent": "hostel_rules",
  "distress": "normal",
  "source": "Hostel Fee Structure.pdf",
  "confidence": 0.70,
  "escalation": false
}

Distress routing:

{
  "answer": "Student support message...",
  "intent": "general_help",
  "distress": "distress",
  "source": "Student Support Escalation",
  "confidence": null,
  "escalation": true
}

🏗️ System Architecture

                    ┌───────────────────────┐
                    │       Student         │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    Web Dashboard      │
                    │    HTML + CSS + JS    │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │       FastAPI         │
                    │        Backend        │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
          ┌─────────────────┐     ┌─────────────────┐
          │ Distress Model  │     │  Intent Model   │
          │ TF-IDF + LR     │     │ TF-IDF + LR     │
          └────────┬────────┘     └────────┬────────┘
                   │                       │
                   └───────────┬───────────┘
                               ▼
                    ┌───────────────────────┐
                    │    RAG Retrieval      │
                    │ Sentence Embeddings   │
                    │ + Cosine Similarity   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ University Knowledge  │
                    │       Documents       │
                    └───────────────────────┘

🔐 Limitations

The ML datasets are custom prototype datasets.

The distress dataset is small and class-imbalanced.

Retrieval quality depends on the available documents.

The similarity score is a retrieval confidence indicator, not a
guaranteed factuality score.

The knowledge base can become outdated when university policies
change.

The current prototype does not connect to a production ERP/database.

The system does not guarantee that every retrieved answer is
currently official.

Production use would require stronger authentication, access
control, monitoring, and data protection.

🔮 Future Scope

Hindi and Hinglish query support

Larger and more diverse training datasets

LLM-based RAG

Improved retrieval and reranking

Document version management

University ERP/LMS integration

Role-based access control

Student-specific personalization

Notifications and reminders

Admin analytics dashboard

Continuous model retraining

Production deployment and monitoring

🎓 Academic Context

Project: Campus Desk --- AI-Powered Chatbot for University Student
Support

Domain: Digital-Data-AI / AI & Machine Learning

Student: Palak Singh

Year: 3rd Year

Branch: Computer Science & Engineering

Institute: ABES Engineering College, Ghaziabad

Supervisor: Ankit Sir --- Data Scientist

Academic Year: 2026--2027

👩‍💻 Author

Palak Singh
B.Tech --- Computer Science & Engineering
ABES Engineering College, Ghaziabad

📄 License

This project is developed for academic/project demonstration purposes.