# PDFetch

PDFetch is a web application for uploading, processing, and querying PDF documents using natural language processing. It extracts text from PDFs, splits them into chunks, creates embeddings, and allows users to ask questions about the documents.

## Overview

PDFetch is built with a Next.js frontend and a FastAPI backend. It uses LangChain and Hugging Face models to process PDFs and answer questions about them. The application enables users to:

- Upload PDF documents
- Process and extract text from PDFs
- Ask questions about uploaded documents
- Get AI-generated answers based on document content
- Manage documents and question history

## Features

- **PDF Processing**: Extracts text from PDFs and creates searchable content
- **Semantic Search**: Finds relevant document sections based on user questions
- **AI-Powered Answers**: Uses Hugging Face models to generate informative responses
- **User Authentication**: Clerk-based authentication system
- **Document Management**: Store and organize PDF documents
- **Question History**: Track question and answer history for each document

## Tech Stack

### Frontend

- Next.js
- JavaScript
- CSS

### Backend

- FastAPI (Python)
- SQLAlchemy (ORM)
- LangChain (for document processing and QA)
- Hugging Face (embeddings and inference)

### Data Storage

- SQL Database (via SQLAlchemy)
- FAISS for vector storage

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm, yarn, or pnpm
- Git

### Environment Variables

Create `.env` file in the root directory with the following variables:

```env
# For frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# For backend
DATABASE_URL=sqlite:///./app.db
HUGGINGFACEHUB_API_TOKEN=your_huggingface_api_token
UPLOADTHING_API_KEY=your_uploadthing_api_key
```

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/TejasBhovad/pdfetch.git
   cd pdfetch
   ```

2. Install dependencies

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Documentation

### Authentication

All API endpoints require authentication via a Bearer token provided by Clerk.

### Endpoints

#### PDF Upload and Processing

- `POST /api/upload`: Upload a PDF file
  - Request: `multipart/form-data` with a file field
  - Response: Document metadata including ID and URL

#### Document Management

- `GET /api/documents`: Get all documents for the current user

  - Parameters: `skip` (pagination offset), `limit` (max results)
  - Response: List of document objects

- `GET /api/documents/{document_id}`: Get a specific document
  - Parameters: `document_id` (path parameter)
  - Response: Document object with details

#### Question and Answer

- `POST /api/ask`: Ask a question about a document

  - Request Body: `{ "content": "string", "document_id": number }`
  - Response: `{ "success": boolean, "questionId": number, "answer": "string" }`

- `GET /api/documents/{document_id}/questions`: Get questions for a document
  - Parameters: `document_id` (path parameter)
  - Response: List of question objects with answers

## Application Architecture

### Frontend Architecture

The application uses Next.js with a page router structure. Key directories include:

- `src/app`: Main application pages
- `src/components`: Reusable UI components
- `src/lib`: Utility functions and API client

### Backend Architecture

The FastAPI backend follows a modular structure:

- `api/index.py`: Main FastAPI application and endpoints
- `api/pdf_processor.py`: PDF processing and QA functionality
- `api/models.py`: SQLAlchemy database models
- `api/schemas.py`: Pydantic schemas for request/response validation
- `api/crud.py`: Database operations
- `api/database.py`: Database connection and session management

### Data Flow

1. User uploads a PDF document
2. Backend processes the PDF in the background:
   - Extract text from PDF
   - Split text into manageable chunks
   - Create embeddings for each chunk
   - Store chunks and embeddings in the database
3. User asks a question about a document
4. Backend processes the query:
   - Convert the question to an embedding
   - Find relevant document chunks using vector similarity
   - Generate an answer using the Hugging Face LLM
   - Store the question and answer in the database
5. Frontend displays the answer to the user

## Contact

- Tejas Bhovad - [GitHub](https://github.com/TejasBhovad)
