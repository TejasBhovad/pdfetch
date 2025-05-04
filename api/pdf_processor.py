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
# Process PDF function (unchanged)
def process_pdf_file(file_url):
    """
    Download a PDF from a URL and extract its text
    """
    try:
        # Download the file
        print(f"Downloading PDF from {file_url}")
        response = requests.get(file_url)
        response.raise_for_status()
        
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file_path = temp_file.name
            temp_file.write(response.content)
        
        # Extract text
        print(f"Extracting text from {temp_file_path}")
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        
        # Clean up the temp file
        os.unlink(temp_file_path)
        
        return documents
    except Exception as e:
        print(f"Error processing PDF: {str(e)}")
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        return None

# Create vector store function (unchanged)
def create_vector_store(documents, document_id, db):
    """
    Create a vector store from documents and store in the database
    """
    try:
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
        
        # Create vector store
        vectorstore = FAISS.from_documents(chunks, embeddings)
        
        # Store chunks in database
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
        
        return vectorstore
    except Exception as e:
        print(f"Error creating vector store: {str(e)}")
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
        # Convert chunks to documents
        documents = []
        for chunk in chunks:
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            documents.append({
                "page_content": content,
                "metadata": {"chunk_id": chunk.id if hasattr(chunk, 'id') else 0}
            })
        
        # Create embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Create vector store
        vectorstore = FAISS.from_texts(
            [doc["page_content"] for doc in documents],
            embeddings,
            metadatas=[doc["metadata"] for doc in documents]
        )
        
        # Perform similarity search - use fewer chunks to avoid token limit issues
        docs = vectorstore.similarity_search(question, k=2)
        
        if not docs:
            return "I couldn't find any relevant information in the document to answer your question."
        
        # Format a shorter context to avoid token limit issues
        # Limit each document to 250 characters to stay well under token limits
        context = "\n\n".join([f"Document {i+1}:\n{doc.page_content[:250]}..." for i, doc in enumerate(docs)])
        
        # Check if HuggingFace API token is available
        huggingface_api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if not huggingface_api_token:
            # Fallback to returning chunks if no API token
            response = f"Here's what I found in the document related to '{question}':\n\n"
            for i, doc in enumerate(docs, 1):
                response += f"Excerpt {i}:\n{doc.page_content}\n\n"
            
            response += "(Note: To get an AI-generated answer, please configure your HUGGINGFACEHUB_API_TOKEN.)"
            return response
        
        # Create a very short prompt to avoid token limit issues
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
    """
    Find relevant information in document chunks and generate a coherent answer with an LLM
    """
    try:
        # Step 1: Convert chunks to documents
        documents = []
        for chunk in chunks:
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            documents.append({
                "page_content": content,
                "metadata": {"chunk_id": chunk.id if hasattr(chunk, 'id') else 0}
            })
        
        # Step 2: Create embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Step 3: Create vector store
        vectorstore = FAISS.from_texts(
            [doc["page_content"] for doc in documents],
            embeddings,
            metadatas=[doc["metadata"] for doc in documents]
        )
        
        # Step 4: Perform similarity search
        docs = vectorstore.similarity_search(question, k=3)
        
        if not docs:
            return "I couldn't find any relevant information in the document to answer your question."
        
        # Step 5: Format context from retrieved documents
        context = "\n\n".join([f"Document {i+1}:\n{doc.page_content}" for i, doc in enumerate(docs)])
        
        # Step 6: Check if OpenAI API key is available
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            # Fallback to returning chunks if no API key
            response = f"Here's what I found in the document related to '{question}':\n\n"
            for i, doc in enumerate(docs, 1):
                response += f"Excerpt {i}:\n{doc.page_content}\n\n"
            
            response += "(Note: To get an AI-generated answer instead of raw excerpts, please configure your OpenAI API key.)"
            return response
        
        # Step 7: Create prompt template
        prompt_template = """
        You are an assistant that helps users understand document content.
        
        Below are excerpts from a document that are relevant to the user's question.
        
        {context}
        
        User's question: {question}
        
        Based only on the information provided in these excerpts, give a concise, helpful answer.
        If the information needed isn't contained in the excerpts, say "I don't have enough information to answer that question."
        """
        
        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question"]
        )
        
        # Step 8: Create LLM
        llm = OpenAI(temperature=0.2, model_name="gpt-3.5-turbo-instruct", max_tokens=300)
        
        # Step 9: Create chain
        chain = LLMChain(llm=llm, prompt=prompt)
        
        # Step 10: Run chain
        response = chain.invoke({"context": context, "question": question})

        # Return the generated answer
        return response["text"].strip()
        
    except Exception as e:
        print(f"Error generating answer: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"