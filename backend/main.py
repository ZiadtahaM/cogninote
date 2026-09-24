from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import pytesseract
from PIL import Image
import io
import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId

# Configure Tesseract OCR path (adjust if your installation is different)
TESSERACT_CMD = os.getenv("TESSERACT_CMD", r'C:\Program Files\Tesseract-OCR\tesseract.exe')
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="CogniNote API",
    description="API for managing notes, processing documents, and providing AI insights.",
    version="0.1.0",
)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",  # React frontend default port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set.")

client = MongoClient(MONGO_URI)
db = client.cogninote_db
notes_collection = db.notes

# --- Pydantic Models ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.type = "string"
        
class Note(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    text: str

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class NoteCreate(BaseModel):
    text: str

class OCRResult(BaseModel):
    text: str

class AIInsightRequest(BaseModel):
    text: str

class AIInsightResponse(BaseModel):
    insight: str

# --- API Endpoints ---

@app.get("/", tags=["Status"])
def read_root():
    """Check the API status."""
    return {"status": "ok", "message": "Welcome to the CogniNote API"}

# --- Notes Endpoints ---

@app.post("/notes/", response_model=Note, tags=["Notes"])
def create_note(note: NoteCreate):
    """Create a new note."""
    note_dict = note.dict()
    result = notes_collection.insert_one(note_dict)
    created_note = notes_collection.find_one({"_id": result.inserted_id})
    return Note(**created_note)

@app.get("/notes/", response_model=List[Note], tags=["Notes"])
def get_all_notes():
    """Retrieve all notes."""
    notes = []
    for note in notes_collection.find():
        notes.append(Note(**note))
    return notes

@app.delete("/notes/{note_id}", tags=["Notes"])
def delete_note(note_id: str):
    """Delete a note by its ID."""
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Note ID format")
    
    result = notes_collection.delete_one({"_id": ObjectId(note_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

# --- OCR Endpoint ---

@app.post("/extract-text/", response_model=OCRResult, tags=["OCR"])
async def extract_text_from_image(file: UploadFile = File(...)):
    """Extract text from an uploaded image using OCR."""
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        text = pytesseract.image_to_string(image)
        return OCRResult(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

# --- AI Insights Endpoint ---

@app.post("/generate-insights/", response_model=AIInsightResponse, tags=["AI"])
async def generate_insights(request: AIInsightRequest):
    """Generate AI-powered insights for a given text."""
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Google AI API key is not configured.")
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = await model.generate_content_async(f"Summarize and provide key insights for the following text: {request.text}")
        return AIInsightResponse(insight=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")