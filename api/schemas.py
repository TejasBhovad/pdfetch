from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: str
    username: Optional[str] = None

class UserCreate(UserBase):
    clerk_id: str

class UserResponse(UserBase):
    id: int
    clerk_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    title: Optional[str] = None
    filename: str
    file_url: str
    file_key: str
    file_size: int
    file_type: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Document chunk schemas
class DocumentChunkBase(BaseModel):
    chunk_index: int
    content: str
    embedding: Optional[str] = None

class DocumentChunkCreate(DocumentChunkBase):
    document_id: int

class DocumentChunkResponse(DocumentChunkBase):
    id: int
    document_id: int
    
    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    content: str

class QuestionCreate(QuestionBase):
    document_id: int

class QuestionResponse(QuestionBase):
    id: int
    document_id: int
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    content: str

class AnswerCreate(AnswerBase):
    question_id: int

class AnswerResponse(AnswerBase):
    id: int
    question_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Combined schemas
class QuestionWithAnswer(QuestionResponse):
    answer: Optional[AnswerResponse] = None
    
    class Config:
        from_attributes = True

class DocumentWithDetails(DocumentResponse):
    questions: List[QuestionWithAnswer] = []
    
    class Config:
        from_attributes = True

# API request/response schemas
class UploadResponse(BaseModel):
    success: bool
    documentId: int
    fileUrl: str
    key: str
    fileName: str
    fileSize: int
    fileType: str

class AskRequest(BaseModel):
    content: str
    document_id: int

class AskResponse(BaseModel):
    success: bool
    questionId: int
    answer: str

class UserStats(BaseModel):
    documentCount: int
    questionCount: int
    totalStorageUsed: float
    storageUnit: str