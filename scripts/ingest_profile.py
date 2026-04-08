"""Ingest personal profile data into Qdrant collection.

Creates a personal profile chunk with structured data (name, email, phone, etc.)
and inserts it into the Qdrant collection for the Firefox extension to retrieve.
"""

import asyncio
import uuid
import os
import sys

sys.path.insert(0, "/app")

from qdrant_client import QdrantClient
from openai import OpenAI


QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "resume")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_BASE_URL = os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai/v1")
MISTRAL_EMBEDDING_MODEL = os.getenv("MISTRAL_EMBEDDING_MODEL", "mistral-embed")


PROFILE_DATA = {
    # Flat fields for form QA testing (NEW - required for 001-form-qa-field-testing)
    "firstname": "Osiozekha",
    "lastname": "Aliu",
    "email": "aliu@dev-hh.de",
    "phone": "+49 177 639 40 82",
    "birthdate": "28.06.1976",
    "city": "Hamburg",
    "postcode": "22399",
    "street": "Schleusentwiete 1",
    "salary": "75000",
    "availability": "01.05.2026",
    "t": "p",
    "text": "Osiozekha Aliu | Full-Stack & AI Automation\nContact: Hamburg | aliu@dev-hh.de | github.com/aliuosio | 20 yrs Exp.\nGehaltsvorstellung / Salary Expectation: 75.000 EUR jährlich / per year\nVerfügbar ab / Available from: 01.05.2026\n\nSenior E-Commerce & Backend Developer with 20 years of professional experience, including 13 years as freelance web developer focused on Magento 1 & 2. Backend specialist with expertise in Linux, Docker, and workflow automation (n8n). Currently working with AI technologies including RAG systems, LLM fine-tuning, and context engineering.",
    "d": "back",
    "tech": [
        "PHP",
        "Python",
        "Bash",
        "JavaScript",
        "React",
        "Vue.js",
        "Docker",
        "n8n",
        "Magento",
        "Symfony",
        "Laravel",
    ],
    "role": "Senior Developer",
    "lang": "en",
    "profile": {
        "fn": "Osiozekha Aliu",
        "em": "aliu@dev-hh.de",
        "ph": "+49 177 639 40 82",
        "adr": {
            "st": "Schleusentwiete 1",
            "zip": "22399",
            "city": "Hamburg",
            "cc": "DE",
        },
        "avail": "2026-04-01",
        "sal": 75000,
        "social": {"gh": "aliuosio", "li": None},
    },
}


def generate_embedding(text: str) -> list[float]:
    client = OpenAI(
        api_key=MISTRAL_API_KEY,
        base_url=MISTRAL_BASE_URL,
    )

    response = client.embeddings.create(
        model=MISTRAL_EMBEDDING_MODEL,
        input=text,
    )

    return response.data[0].embedding


def ingest_profile():
    print(f"Connecting to Qdrant at {QDRANT_URL}...")
    client = QdrantClient(url=QDRANT_URL)

    print(f"Checking collection '{COLLECTION_NAME}'...")
    collections = client.get_collections()
    collection_names = [c.name for c in collections.collections]

    if COLLECTION_NAME not in collection_names:
        print(f"ERROR: Collection '{COLLECTION_NAME}' not found!")
        print(f"Available collections: {collection_names}")
        return False

    print(f"Generating embedding for profile text...")
    embedding = generate_embedding(PROFILE_DATA["text"])
    print(f"Generated {len(embedding)}-dimensional embedding")

    point_id = str(uuid.uuid4())
    print(f"Upserting profile with ID: {point_id}")

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            {
                "id": point_id,
                "vector": embedding,
                "payload": PROFILE_DATA,
            }
        ],
    )

    print(f"Successfully ingested profile data!")
    # Backward-compatible nested fields
    print(f"  - Name: {PROFILE_DATA['profile']['fn']}")
    print(f"  - Email: {PROFILE_DATA['profile']['em']}")
    print(f"  - Phone: {PROFILE_DATA['profile']['ph']}")
    print(f"  - City: {PROFILE_DATA['profile']['adr']['city']}")
    print(f"  - GitHub: {PROFILE_DATA['profile']['social']['gh']}")
    # Flat fields for QA testing (NEW - top-level fields)
    print(f"  - Firstname: {PROFILE_DATA['firstname']}")
    print(f"  - Lastname: {PROFILE_DATA['lastname']}")
    print(f"  - Email (flat): {PROFILE_DATA['email']}")
    print(f"  - Phone (flat): {PROFILE_DATA['phone']}")
    print(f"  - Birthdate (flat): {PROFILE_DATA['birthdate']}")
    print(f"  - City (flat): {PROFILE_DATA['city']}")
    print(f"  - Postcode: {PROFILE_DATA['postcode']}")
    print(f"  - Street: {PROFILE_DATA['street']}")

    return True


if __name__ == "__main__":
    success = ingest_profile()
    sys.exit(0 if success else 1)
