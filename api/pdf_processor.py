import os
import requests
import tempfile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpoint
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import json
from . import crud, models

 
def process_pdf_file(file_url):
    """
    Download a PDF from a URL and extract its text
    """
    temp_file_path = None
    try: 
        print(f"Downloading PDF from {file_url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(file_url, headers=headers, stream=True)
        response.raise_for_status() 
        content_type = response.headers.get('Content-Type', '')
        if 'application/pdf' not in content_type.lower() and 'binary/octet-stream' not in content_type.lower():
            print(f"Warning: Content type '{content_type}' may not be a PDF") 
            pdf_signature = response.content[:5]
            if not pdf_signature.startswith(b'%PDF-'):
                print(f"Error: Not a valid PDF file. Content starts with: {pdf_signature}")
                return None
         
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file_path = temp_file.name 
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
        
 
        file_size = os.path.getsize(temp_file_path)
        if file_size == 0:
            print("Error: Downloaded file is empty")
            os.unlink(temp_file_path)
            return None
        
        print(f"Successfully downloaded PDF ({file_size} bytes) to {temp_file_path}")
 
        try:
            print(f"Extracting text from {temp_file_path}")
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load()
            
            if not documents:
                print("Warning: No text extracted from PDF")
  
            os.unlink(temp_file_path)
            
            return documents
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}") 
            try:
                 
                import pdfplumber
                
                extracted_text = []
                with pdfplumber.open(temp_file_path) as pdf:
                    for i, page in enumerate(pdf.pages):
                        text = page.extract_text() or ""
                        if text.strip():
                            from langchain.schema import Document
                            extracted_text.append(Document(
                                page_content=text,
                                metadata={"page": i + 1, "source": file_url}
                            ))
                
                if extracted_text:
                    print(f"Successfully extracted text using fallback method")
                    return extracted_text
                else:
                    print("Failed to extract text with fallback method")
                    return None
            except Exception as fallback_error:
                print(f"Fallback extraction also failed: {str(fallback_error)}")
                return None
    except requests.exceptions.RequestException as e:
        print(f"Error downloading PDF: {str(e)}")
        return None
    finally: 
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as cleanup_error:
                print(f"Error during cleanup: {str(cleanup_error)}")
 
def create_vector_store(documents, document_id, db):
    """
    Create a vector store from documents and store in the database
    """
    try:
        if not documents:
            print(f"Warning: No documents provided for document_id {document_id}")
            crud.create_document_chunk(
                db=db,
                document_id=document_id,
                chunk_index=0,
                content="No content could be extracted from this document.",
                embedding=None
            )
            return None
            
        print(f"Creating vector store for document {document_id} with {len(documents)} pages")
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)
        
        print(f"Split into {len(chunks)} chunks")
        
        if len(chunks) == 0:
            print("Warning: No chunks were created from the document")
            crud.create_document_chunk(
                db=db,
                document_id=document_id,
                chunk_index=0,
                content="This document appears to be empty or could not be processed correctly.",
                embedding=None
            )
            return None
        
        # Create embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Store chunks in database first - even if vector store creation fails
        print(f"Storing {len(chunks)} chunks in database for document {document_id}")
        for i, chunk in enumerate(chunks):
            try:
 
                embedding = embeddings.embed_query(chunk.page_content)
 
                crud.create_document_chunk(
                    db=db,
                    document_id=document_id,
                    chunk_index=i,
                    content=chunk.page_content,
                    embedding=embedding
                )
                print(f"Successfully saved chunk {i} to database")
            except Exception as chunk_error:
                print(f"Error saving chunk {i}: {str(chunk_error)}") 
                try:
                    crud.create_document_chunk(
                        db=db,
                        document_id=document_id,
                        chunk_index=i,
                        content=chunk.page_content,
                        embedding=None
                    )
                    print(f"Saved chunk {i} without embedding")
                except Exception as fallback_error:
                    print(f"Failed to save chunk {i} even without embedding: {str(fallback_error)}")
         
        try:
            vectorstore = FAISS.from_documents(chunks, embeddings)
            print(f"Successfully created vector store for document {document_id}")
            return vectorstore
        except Exception as vs_error:
            print(f"Error creating vector store: {str(vs_error)}")
          
            return None
            
    except Exception as e:
        print(f"Error in create_vector_store: {str(e)}")
        try:
            crud.create_document_chunk(
                db=db,
                document_id=document_id,
                chunk_index=0,
                content=f"Error processing document: {str(e)}",
                embedding=None
            )
            print("Created error chunk in database")
        except Exception as db_error:
            print(f"Failed to create error chunk: {str(db_error)}")
        return None
 
def answer_question(question, chunks):
    """
    Find relevant information in document chunks and generate a coherent answer using HuggingFace
    """
    try:
  
        if not chunks:
            return "No document content is available to answer this question."
            
      
        documents = []
        for chunk in chunks:
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            documents.append({
                "page_content": content,
                "metadata": {"chunk_id": chunk.id if hasattr(chunk, 'id') else 0}
            })
        
 
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
 
        vectorstore = FAISS.from_texts(
            [doc["page_content"] for doc in documents],
            embeddings,
            metadatas=[doc["metadata"] for doc in documents]
        )
         
        docs = vectorstore.similarity_search(question, k=2)
        
        if not docs:
            return "I couldn't find any relevant information in the document to answer your question."
        
 
        context = "\n\n".join([f"Document {i+1}:\n{doc.page_content[:250]}..." for i, doc in enumerate(docs)])
        
     
        huggingface_api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if not huggingface_api_token: 
            response = f"Here's what I found in the document related to '{question}':\n\n"
            for i, doc in enumerate(docs, 1):
                response += f"Excerpt {i}:\n{doc.page_content}\n\n"
            
            response += "(Note: To get an AI-generated answer, please configure your HUGGINGFACEHUB_API_TOKEN.)"
            return response
        
 
        prompt_template = """
        Context: {context}
        
        Question: {question}
        
        Answer:
        """
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Create HuggingFace LLM
        # Using Mixtral-8x7B which has good summarization capabilities
        llm = HuggingFaceEndpoint(
            endpoint_url="https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
            huggingfacehub_api_token=huggingface_api_token,
            task="text-generation",
            max_length=150  # Keep this low to avoid token limit errors
        )
        
        # Create chain
        chain = LLMChain(llm=llm, prompt=prompt)
        
        # Run chain
        response = chain.invoke({"context": context, "question": question})
        
        # Return the generated answer
        return response["text"].strip()
        
    except Exception as e:
        print(f"Error generating answer: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"