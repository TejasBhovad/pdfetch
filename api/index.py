from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, BackgroundTasks, Header, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import requests
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
import json

from .database import engine, get_db, Base
from . import models, schemas, crud
from .pdf_processor import process_pdf_file, answer_question, create_vector_store

# Create database tables
models.Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get user clerk ID from authorization header
async def get_current_user_id(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    # In a real app, you'd verify the token with Clerk API
    # This is a simplified version for development
    token = authorization.split(" ")[1]
    
    try:
        # Here you'd normally validate the token with Clerk
        # For now, we're extracting the user_id from the request
        # and trust that the frontend has validated the token
        return token.split("|")[0]  # Extract user ID portion of token
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

# For development/testing, this allows specifying the user ID directly
async def get_user_id(request: Request, db: Session = Depends(get_db)):
    # Default test user ID
    default_user_id = "user_test123"
    
    # Try to get from header first
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            # Extract the actual user ID portion from the JWT
            # We'll extract just the "sub" claim value which is the stable user ID
            # instead of using the whole token as the clerk_id
            
            try:
                # Split on periods to get the payload section of the JWT
                payload_b64 = token.split('.')[1]
                
                # Add padding if needed
                padding = '=' * (4 - len(payload_b64) % 4) if len(payload_b64) % 4 != 0 else ''
                payload_b64 += padding
                
                # Decode base64 payload
                import base64
                import json
                payload_json = base64.b64decode(payload_b64).decode('utf-8')
                payload = json.loads(payload_json)
                
                # Extract the subject claim (user ID)
                clerk_id = payload.get('sub')
                
                if not clerk_id:
                    # If we can't extract sub, fall back to first part of token
                    clerk_id = token.split("|")[0] if "|" in token else token
            except Exception as e:
                # If parsing fails, fall back to old method
                print(f"Error parsing JWT: {e}")
                clerk_id = token.split("|")[0] if "|" in token else token
            
            # Ensure user exists in our database
            user = crud.get_user_by_clerk_id(db, clerk_id)
            if not user:
                # Create the user
                try:
                    user = crud.create_user(db, {
                        "clerk_id": clerk_id,
                        "email": f"{clerk_id}@example.com",  # Placeholder
                        "username": "User"
                    })
                except Exception as user_err:
                    print(f"Error creating user: {user_err}")
            
            if user:
                print(f"Using clerk_id from token: {clerk_id}")
                return clerk_id
    except Exception as e:
        print(f"Error getting user from token: {str(e)}")
    
    # For testing, use x-user-id header or default to test user
    user_id = request.headers.get("x-user-id", default_user_id)
    
    # Ensure user exists
    try:
        user = crud.get_user_by_clerk_id(db, user_id)
        if not user:
            user = crud.create_user(db, {
                "clerk_id": user_id,
                "email": f"{user_id}@example.com",
                "username": "Test User"
            })
    except Exception as e:
        print(f"Error with test user: {str(e)}")
    
    print(f"Using default or x-user-id: {user_id}")
    return user_id
    # Default test user ID
    default_user_id = "user_test123"
    
    # Try to get from header first
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            # Simply use the token as clerk_id for now
            # In production, you'd properly validate this token
            clerk_id = token.split("|")[0] if "|" in token else token
            
            # Ensure user exists in our database
            user = crud.get_user_by_clerk_id(db, clerk_id)
            if not user:
                # Create the user
                try:
                    user = crud.create_user(db, {
                        "clerk_id": clerk_id,
                        "email": f"{clerk_id}@example.com",  # Placeholder
                        "username": "User"
                    })
                except Exception as user_err:
                    print(f"Error creating user: {user_err}")
            
            if user:
                print(f"Using clerk_id from token: {clerk_id}")
                return clerk_id
    except Exception as e:
        print(f"Error getting user from token: {str(e)}")
    
    # For testing, use x-user-id header or default to test user
    user_id = request.headers.get("x-user-id", default_user_id)
    
    # Ensure user exists
    try:
        user = crud.get_user_by_clerk_id(db, user_id)
        if not user:
            user = crud.create_user(db, {
                "clerk_id": user_id,
                "email": f"{user_id}@example.com",
                "username": "Test User"
            })
    except Exception as e:
        print(f"Error with test user: {str(e)}")
    
    print(f"Using default or x-user-id: {user_id}")
    return user_id
@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI"}

async def get_upload_thing_api_key():
    api_key = os.getenv("UPLOADTHING_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="UPLOADTHING_API_KEY not found")
    return api_key

@app.post("/api/upload")
async def upload_file_via_uploadthing(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    print(f"Received file upload request from frontend. User ID: {current_user_id}")
    print(f"Frontend file details: filename={file.filename}, content_type={file.content_type}")

    try:
        api_key = await get_upload_thing_api_key()
        print(f"Retrieved UploadThing API Key.")
    except HTTPException as e:
        print(f"Error retrieving API key: {e.detail}")
        raise

    file_content = await file.read()
    file_size = len(file_content)
    print(f"Read file content. Size: {file_size} bytes")

    uploadthing_api_url = "https://uploadthing.com/api/uploadFiles"

    headers = {
        "x-uploadthing-api-key": api_key,
        "x-uploadthing-version": "6.4.0",
        "Content-Type": "application/json"
    }

    request_body = {
        "files": [
            {
                "name": file.filename,
                "size": file_size,
                "type": file.content_type,
                "acl": "public-read",
                "contentDisposition": "inline"
            }
        ]
    }

    print(f"Making request to UploadThing API: {uploadthing_api_url}")
    print(f"With payload: {request_body}")

    try:
        presigned_response = requests.post(
            uploadthing_api_url,
            headers=headers,
            json=request_body
        )

        print(f"UploadThing API response status: {presigned_response.status_code}")

        if not presigned_response.ok:
            print(f"UploadThing API error response: {presigned_response.text}")
            raise HTTPException(
                status_code=presigned_response.status_code,
                detail=f"UploadThing error: {presigned_response.text}"
            )

        response_data = presigned_response.json()
        print(f"UploadThing API response data: {response_data}")

        if not response_data.get("data") or len(response_data["data"]) == 0:
            raise HTTPException(
                status_code=500,
                detail="Invalid response from UploadThing API: no data returned"
            ) 
        file_data = response_data["data"][0] 
        presigned_url = file_data.get("url")
        fields = file_data.get("fields", {})

        if not presigned_url or not fields:
            raise HTTPException(
                status_code=500,
                detail="Missing presigned URL information in UploadThing response"
            )
 
        upload_files = {
            "file": (file.filename, file_content, file.content_type)}

        print(f"Uploading to presigned URL: {presigned_url}")

        s3_response = requests.post(
            presigned_url,
            data=fields,  
            files=upload_files  
        )

        print(f"S3 upload response status: {s3_response.status_code}")

        if not s3_response.ok:
            print(f"S3 upload error: {s3_response.text}")
            raise HTTPException(
                status_code=s3_response.status_code,
                detail=f"File upload to storage failed: {s3_response.text}"
            )

        # Create document record in database
        upload_result = {
            "title": file.filename,
            "filename": file.filename,
            "fileUrl": file_data.get("fileUrl"),
            "key": file_data.get("key"),
            "fileSize": file_size,
            "fileType": file.content_type,
        }
        
        # Use the user's clerk_id
        document = crud.create_document(db, upload_result, current_user_id)
        
        # Process PDF in background if it's a PDF file
        if file.content_type == "application/pdf" and background_tasks:
            background_tasks.add_task(
                process_pdf_and_store, 
                document.id, 
                file_data.get("fileUrl"), 
                db
            )

        # Return the file information to the frontend
        return {
            "success": True,
            "documentId": document.id,
            "fileUrl": file_data.get("fileUrl"),
            "key": file_data.get("key"),
            "fileName": file.filename,
            "fileSize": file_size,
            "fileType": file.content_type,
        }

    except requests.exceptions.RequestException as e:
        print(f"Request error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during API request: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )

async def process_pdf_and_store(document_id: int, file_url: str, db: Session):
    """Process a PDF and store its chunks in the database"""
    try:
        print(f"Starting background PDF processing for document {document_id}")
        print(f"File URL: {file_url}")
        
        document = crud.get_document(db, document_id)
        if not document:
            print(f"Document {document_id} not found")
            return
        
        # Verify the file URL format is correct
        if not file_url.startswith('http'):
            print(f"Warning: Invalid file URL format: {file_url}")
            # Check if there's an alternate URL field that might work
            alternate_urls = [document.file_url]
            
            # Some services provide alternative URL formats
            if hasattr(document, 'file_key') and document.file_key:
                # Try generating an alternate URL format based on the key
                if 'utfs.io' in file_url:
                    alternate_urls.append(f"https://utfs.io/f/{document.file_key}")
            
            # Try alternate URLs if available
            for alt_url in alternate_urls:
                if alt_url and alt_url.startswith('http') and alt_url != file_url:
                    print(f"Trying alternate URL: {alt_url}")
                    file_url = alt_url
                    break
        
        # Extract text from PDF with improved error handling
        pdf_text = process_pdf_file(file_url)
        
        if not pdf_text:
            print(f"Failed to extract text from PDF (document_id: {document_id})")
            # Store an error chunk to indicate processing failed
            crud.create_document_chunk(
                db=db,
                document_id=document_id,
                chunk_index=0,
                content="Failed to extract text from this PDF. The file may be corrupted, password-protected, or in an unsupported format.",
                embedding=None
            )
            return
            
        # Create embeddings and store chunks
        vector_store = create_vector_store(pdf_text, document_id, db)
        
        if vector_store:
            print(f"Successfully processed document {document_id}")
        else:
            print(f"Document {document_id} was processed, but vector store creation may have failed. Check if chunks were stored in the database.")
            
    except Exception as e:
        print(f"Error processing PDF (document_id: {document_id}): {str(e)}")
        # Ensure we at least store an error message in the database
        try:
            crud.create_document_chunk(
                db=db,
                document_id=document_id,
                chunk_index=0,
                content=f"Error processing document: {str(e)}",
                embedding=None
            )
        except Exception as db_error:
            print(f"Failed to store error chunk: {str(db_error)}")
@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
async def get_documents(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Get all documents for the current user"""
    documents = crud.get_user_documents(db, current_user_id, skip, limit)
    return documents

@app.get("/api/documents/{document_id}", response_model=schemas.DocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Get a single document by ID"""
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # For development, temporarily disable user access check
    # In production, uncomment this check
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    print(f"Serving document {document_id} to user {current_user_id}, document owner: {document.user_id}")
    return document
    """Get a single document by ID"""
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # For development, temporarily disable user access check
    # In production, uncomment this check
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    print(f"Serving document {document_id} to user {current_user_id}, document owner: {document.user_id}")
    return document

    """Get a single document by ID"""
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    return document

 
    """Get a single document by ID"""
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # # Check if user has access to document
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    return document
@app.post("/api/ask", response_model=schemas.AskResponse)
async def ask_question(
    request: schemas.AskRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Ask a question about a document"""
    # Check if document exists
    document = crud.get_document(db, request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # # Check if user has access to document
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    # Create question
    question = crud.create_question(db, {
        "content": request.content,
        "document_id": request.document_id
    }, current_user_id)
    
    # Process answer in background
    background_tasks.add_task(
        process_answer,
        question.id,
        request.content,
        request.document_id,
        db
    )
    
    # Return immediately with empty answer
    # The frontend will poll for the answer
    return {
        "success": True,
        "questionId": question.id,
        "answer": "Generating answer..."
    }

async def process_answer(question_id: int, question_content: str, document_id: int, db: Session):
    """Generate an answer for a question"""
    try:
        # Get document chunks
        chunks = crud.get_document_chunks(db, document_id)
        if not chunks:
            answer_content = "Sorry, I couldn't find any content in that document to answer your question."
        else:
            # Get answer
            answer_content = answer_question(question_content, chunks)
        
        # Create answer
        crud.create_answer(db, {
            "content": answer_content,
            "question_id": question_id
        })
        
    except Exception as e:
        print(f"Error generating answer: {str(e)}")
        # Create error answer
        crud.create_answer(db, {
            "content": f"Sorry, I encountered an error: {str(e)}",
            "question_id": question_id
        })

@app.get("/api/questions/{document_id}", response_model=List[schemas.QuestionWithAnswer])
async def get_questions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Get all questions for a document"""
    # Check if document exists
    document = crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user has access to document
    # if document.user_id != current_user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this document")
    
    # Get questions with answers
    questions = crud.get_document_questions(db, document_id)
    
    # For each question, get its answer
    for question in questions:
        question.answer = crud.get_answer_by_question(db, question.id)
    
    return questions

@app.get("/api/stats", response_model=schemas.UserStats)
async def get_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Get usage statistics for the current user"""
    stats = crud.get_user_stats(db, current_user_id)
    return stats

@app.get("/api/user", response_model=schemas.UserResponse)
async def get_current_user(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_user_id)
):
    """Get the current user's profile"""
    user = crud.get_user_by_clerk_id(db, current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user