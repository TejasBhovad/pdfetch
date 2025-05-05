from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from . import models, schemas
from fastapi import HTTPException
import json

from sqlalchemy import func 
# User operations
def create_user(db: Session, user_data: dict):
    """Create a new user with Clerk ID"""
    try:
        db_user = models.User(
            clerk_id=user_data.get("clerk_id"),
            email=user_data.get("email"),
            username=user_data.get("username", "User")
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_user(db: Session, user_id: int):
    """Get user by internal database ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_clerk_id(db: Session, clerk_id: str):
    """Get user by Clerk ID"""
    return db.query(models.User).filter(models.User.clerk_id == clerk_id).first()

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def get_or_create_user(db: Session, user_data: dict):
    """Get existing user by Clerk ID or create a new one"""
    clerk_id = user_data.get("clerk_id")
    if not clerk_id:
        raise HTTPException(status_code=400, detail="Clerk ID is required")
    
    db_user = get_user_by_clerk_id(db, clerk_id)
    if db_user:
        return db_user
    
    return create_user(db, user_data)

# Document operations
def create_document(db: Session, document_data: dict, clerk_id: str):
    """Create a new document record associated with a Clerk user ID"""
    try:
        db_document = models.Document(
            title=document_data.get("title", document_data.get("filename", "Untitled Document")),
            filename=document_data.get("filename"),
            file_url=document_data.get("fileUrl"),
            file_key=document_data.get("key"),
            file_size=document_data.get("fileSize"),
            file_type=document_data.get("fileType"),
            user_id=clerk_id
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_document(db: Session, document_id: int):
    """Get document by ID"""
    return db.query(models.Document).filter(models.Document.id == document_id).first()

def get_user_documents(db: Session, clerk_id: str, skip: int = 0, limit: int = 100):
    """Get all documents for a user identified by Clerk ID"""
    return db.query(models.Document).filter(models.Document.user_id == clerk_id).offset(skip).limit(limit).all()

def delete_document(db: Session, document_id: int, clerk_id: str):
    """Delete a document if it belongs to the specified user"""
    db_document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == clerk_id
    ).first()
    
    if not db_document:
        return False
    
    db.delete(db_document)
    db.commit()
    return True

# This should be in your crud.py file
def create_document_chunk(db, document_id, chunk_index, content, embedding=None):
    """Create a new document chunk"""
    db_chunk = models.DocumentChunk(
        document_id=document_id,
        chunk_index=chunk_index,
        content=content,
        embedding=embedding
    )
    db.add(db_chunk)
    db.commit()
    db.refresh(db_chunk)
    return db_chunk
    
def get_document_chunks(db: Session, document_id: int):
    """Get all chunks for a document"""
    return db.query(models.DocumentChunk).filter(
        models.DocumentChunk.document_id == document_id
    ).order_by(models.DocumentChunk.chunk_index).all()

# Question operations
def create_question(db: Session, question_data: dict, clerk_id: str):
    """Create a new question associated with a Clerk user ID"""
    try:
        db_question = models.Question(
            content=question_data.get("content"),
            document_id=question_data.get("document_id"),
            user_id=clerk_id
        )
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        return db_question
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_document_questions(db: Session, document_id: int):
    """Get all questions for a document"""
    return db.query(models.Question).filter(models.Question.document_id == document_id).all()

def get_user_questions(db: Session, clerk_id: str, skip: int = 0, limit: int = 100):
    """Get all questions from a user identified by Clerk ID"""
    return db.query(models.Question).filter(models.Question.user_id == clerk_id).offset(skip).limit(limit).all()

# Answer operations
def create_answer(db: Session, answer_data: dict):
    """Create a new answer for a question"""
    try:
        db_answer = models.Answer(
            content=answer_data.get("content"),
            question_id=answer_data.get("question_id")
        )
        db.add(db_answer)
        db.commit()
        db.refresh(db_answer)
        return db_answer
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_answer_by_question(db: Session, question_id: int):
    """Get the answer for a specific question"""
    return db.query(models.Answer).filter(models.Answer.question_id == question_id).first()

# Then fix the get_user_stats function:
def get_user_stats(db, user_id):
    """Get statistics for a user"""
    # Count documents
    document_count = db.query(models.Document).filter(
        models.Document.user_id == user_id
    ).count()
    
    # Count questions
    question_count = db.query(models.Question).join(
        models.Document, models.Question.document_id == models.Document.id
    ).filter(
        models.Document.user_id == user_id
    ).count()
    
    # Sum file sizes
    # Fix: Use func from sqlalchemy instead of db.func
    result = db.query(func.sum(models.Document.file_size)).filter(
        models.Document.user_id == user_id
    ).scalar()
    
    total_storage_used = result or 0
    
    # Convert bytes to appropriate unit
    storage_unit = "B"
    if total_storage_used > 1024:
        total_storage_used /= 1024
        storage_unit = "KB"
    
    if total_storage_used > 1024:
        total_storage_used /= 1024
        storage_unit = "MB"
    
    if total_storage_used > 1024:
        total_storage_used /= 1024
        storage_unit = "GB"
    
    return {
        "documentCount": document_count,
        "questionCount": question_count,
        "totalStorageUsed": round(total_storage_used, 2),
        "storageUnit": storage_unit
    }