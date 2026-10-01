import joblib
import pickle

from sentence_transformers import SentenceTransformer

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sklearn.metrics.pairwise import cosine_similarity


# =========================================================
# 1. LOAD INTENT MODEL
# =========================================================

intent_model = joblib.load(
    "intent_model.pkl"
)

intent_vectorizer = joblib.load(
    "tfidf_vectorizer.pkl"
)

print("Intent model loaded successfully!")


# =========================================================
# 2. LOAD DISTRESS MODEL
# =========================================================

distress_model = joblib.load(
    "distress_model.pkl"
)

distress_vectorizer = joblib.load(
    "distress_vectorizer.pkl"
)

print("Distress model loaded successfully!")


# =========================================================
# 3. LOAD RAG DATA
# =========================================================

with open(
    "rag_data.pkl",
    "rb"
) as file:

    rag_data = pickle.load(file)


chunks = rag_data["chunks"]

metadata = rag_data["metadata"]

embeddings = rag_data["embeddings"]


print("RAG data loaded successfully!")

print(
    "Total chunks:",
    len(chunks)
)

print(
    "Total metadata:",
    len(metadata)
)

print(
    "Embedding shape:",
    embeddings.shape
)


# =========================================================
# 4. LOAD EMBEDDING MODEL
# =========================================================

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

print(
    "Embedding model loaded successfully!"
)


# =========================================================
# 5. CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(

    title="Campus Desk API",

    description=(
        "AI Powered Student Support System"
    ),

    version="2.0"
)


# =========================================================
# 6. ENABLE CORS
# =========================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =========================================================
# 7. REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):

    question: str


# =========================================================
# 8. RAG RETRIEVAL
# =========================================================

def retrieve_documents(
    question,
    top_k=3
):

    # -----------------------------------------------------
    # Convert question into embedding
    # -----------------------------------------------------

    question_embedding = embedding_model.encode(
        [question]
    )


    # -----------------------------------------------------
    # Calculate cosine similarity
    # -----------------------------------------------------

    similarities = cosine_similarity(

        question_embedding,

        embeddings

    )[0]


    # -----------------------------------------------------
    # Get top matching chunks
    # -----------------------------------------------------

    top_indices = similarities.argsort()[
        -top_k:
    ][::-1]


    results = []


    for index in top_indices:

        results.append({

            "chunk": chunks[index],

            "score": float(
                similarities[index]
            ),

            "source": metadata[index]["source"],

            "index": int(index)

        })


    return results


# =========================================================
# 9. RAG ANSWER FUNCTION
# =========================================================

def get_rag_answer(
    question,
    top_k=3
):

    results = retrieve_documents(
        question,
        top_k
    )


    # -----------------------------------------------------
    # Best matching result
    # -----------------------------------------------------

    best_result = results[0]


    confidence = best_result["score"]


    # -----------------------------------------------------
    # Confidence threshold
    # -----------------------------------------------------

    if confidence < 0.30:

        return {

            "answer": (
                "I could not find a sufficiently reliable "
                "answer in the ABES knowledge base. "
                "Please contact the student support/help desk "
                "for verified information."
            ),

            "source": best_result["source"],

            "confidence": round(
                confidence,
                4
            )

        }


    # -----------------------------------------------------
    # Normal RAG answer
    # -----------------------------------------------------

    answer = (

        "According to the ABES information "
        "in the knowledge base:\n\n"

        + best_result["chunk"]

    )


    return {

        "answer": answer,

        "source": best_result["source"],

        "confidence": round(
            confidence,
            4
        )

    }


# =========================================================
# 10. MAIN CAMPUS DESK CHAT FUNCTION
# =========================================================

def campus_desk_chat(
    question
):


    # =====================================================
    # DISTRESS DETECTION
    # =====================================================

    distress_vector = (
        distress_vectorizer.transform(
            [question]
        )
    )


    distress_prediction = (
        distress_model.predict(
            distress_vector
        )[0]
    )


    # =====================================================
    # INTENT CLASSIFICATION
    # =====================================================

    intent_vector = (
        intent_vectorizer.transform(
            [question]
        )
    )


    intent_prediction = (
        intent_model.predict(
            intent_vector
        )[0]
    )


    # =====================================================
    # DISTRESS RESPONSE
    # =====================================================

    if distress_prediction == "distress":

        return {

            "answer": (
                "I'm sorry that you're feeling overwhelmed. "
                "This message has been flagged for student support. "
                "Please consider contacting a trusted person "
                "or the college support/help desk."
            ),

            "intent": intent_prediction,

            "distress": "distress",

            "source": (
                "Student Support Escalation"
            ),

            "confidence": None,

            "escalation": True

        }


    # =====================================================
    # RAG ANSWER
    # =====================================================

    rag_response = get_rag_answer(
        question,
        top_k=3
    )


    # =====================================================
    # FINAL NORMAL RESPONSE
    # =====================================================

    return {

        "answer": rag_response["answer"],

        "intent": intent_prediction,

        "distress": "normal",

        "source": rag_response["source"],

        "confidence": rag_response["confidence"],

        "escalation": False

    }


# =========================================================
# 11. CHAT API
# =========================================================

@app.post("/chat")
def chat(
    request: ChatRequest
):

    return campus_desk_chat(
        request.question
    )


# =========================================================
# 12. HOME API
# =========================================================

@app.get("/")
def home():

    return {

        "message":
        "Campus Desk API is running!",

        "status":
        "online",

        "version":
        "2.0"

    }


# =========================================================
# 13. HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {

        "status":
        "healthy",

        "intent_model":
        "loaded",

        "distress_model":
        "loaded",

        "rag":
        "active",

        "documents":
        len(set(
            item["source"]
            for item in metadata
        )),

        "chunks":
        len(chunks)

    }