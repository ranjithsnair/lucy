from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
from pydantic import BaseModel
from typing import List
import pathlib
import uuid
import os
import textract

app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class ChatMessage(BaseModel):
    role: str
    content: str

class Chat(BaseModel):
    messages: List[ChatMessage]

@app.get("/", tags=["Health"])
async def get_health() -> dict:
    return {
        "version": "1.0.0",
        "message": "The target is healthy."
    }

@app.post("/files", tags=["Lucy"])
async def post_file(file: UploadFile) -> dict:
    requestId = uuid.uuid4()
    extension = pathlib.Path(file.filename).suffix.lower()
    path = f"{pathlib.Path(__file__).parent.resolve()}/{requestId}{extension}"
    text = ""
    documents = [".pdf", ".doc", ".docx", ".xls", ".xlsx"]

    try:
        with open(path, 'wb') as tempFile:
            content = await file.read()
            tempFile.write(content)
        
        if extension in documents:
            text = textract.process(path)
        else:
            text = open(path, "r").read()
    except:
        pass
    finally:
        if os.path.exists(path):
            os.remove(path)
            
    return {
        "fileName": file.filename,
        "content": text
    }

@app.post("/chat", tags=["OpenAI"])
async def post_chat(chat: Chat) -> dict:

    url = f'{os.getenv("OPENAI_API_URL")}/chatCompletions'
    api_key = os.getenv("OPENAI_API_KEY")
    data = {
        "choices": [{
            "message": {
                "role": "assistant",
                "content": "I apologize for the inconvenience, as it appears that I am encountering some issues in processing your request at this time."
            }
        }]
    }

    headers = {
        "Content-Type": "application/json",
        "api-key": api_key,
        "User-Agent": "Lucy"
    }

    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are Lucy, an AI assistant powered by GPT models."}
        ]
    }
    for message in chat.messages:
        payload["messages"].append({"role": message.role, "content": message.content})

    try:
        response = requests.post(url, headers=headers, json=payload)
        if(response.status_code == 200):
            data = response.json()
    except:
       pass
    
    return data