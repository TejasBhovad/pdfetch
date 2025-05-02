from fastapi import FastAPI, HTTPException, File, UploadFile
import os
from dotenv import load_dotenv
import requests
from typing import Any, Dict, List

load_dotenv()

app = FastAPI()


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
async def upload_file_via_uploadthing(file: UploadFile = File(...)):
    print("Received file upload request from frontend.")
    print(
        f"Frontend file details: filename={file.filename}, content_type={file.content_type}")

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

        print(
            f"UploadThing API response status: {presigned_response.status_code}")

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

        # 6. Return the file information to the frontend
        return {
            "success": True,
            "fileUrl": file_data.get("fileUrl"),  # The URL to access the file
            # The file's unique key in the storage
            "key": file_data.get("key"),
            "fileName": file.filename,
            "fileSize": file_size,
            "fileType": file.content_type,
            # You can also return any other relevant data from file_data
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
