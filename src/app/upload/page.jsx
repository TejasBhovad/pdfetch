"use client";

import { useState } from "react";
import { useApiClient } from "@/utils/api";
import { useRouter } from "next/navigation";

export default function Upload() {
  const router = useRouter();
  const apiClient = useApiClient();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Use our API client for upload
      const response = await apiClient.uploadFile(file);

      clearInterval(progressInterval);

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, use status text
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setUploadProgress(100);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Error parsing server response");
      }

      // Redirect to the document page
      setTimeout(() => {
        router.push(`/documents/${data.documentId || data.id}`);
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file");
      setUploadProgress(0);

      // If there's a server error and we haven't retried too many times, we could retry
      if (retryCount < 2 && err.message.includes("500")) {
        setRetryCount(retryCount + 1);
        setError(`${err.message}. Attempting to retry...`);

        // Wait 2 seconds before retrying
        setTimeout(() => {
          handleUpload(e);
        }, 2000);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>

      <form onSubmit={handleUpload} className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            className="hidden"
            accept="application/pdf"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm font-medium">
              Click to select a PDF file or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only PDF files are supported (max 10MB)
            </p>
          </label>

          {file && (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-between">
              <span className="text-sm truncate max-w-xs">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploadProgress === 100 ? "Upload complete!" : "Uploading..."}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={uploading || !file}
        >
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
      </form>
    </div>
  );
}
