"use client";

import { useState } from "react";
import { useApiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload as UploadIcon,
  FileText,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

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
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">
          Upload Document
        </h1>
        <Link
          href="/documents"
          className="text-green-500 hover:text-green-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
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
              <div className="p-3 bg-green-50 rounded-full mb-4">
                <UploadIcon className="h-10 w-10 text-green-500" />
              </div>
              <p className="mb-2 text-gray-700 font-medium">
                Click to select a PDF file or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Only PDF files are supported (max 10MB)
              </p>
            </label>

            {file && (
              <div className="mt-5 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-md">
                  <FileText className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">
                  {uploadProgress === 100
                    ? "Upload complete! Redirecting..."
                    : `Uploading...`}
                </p>
                <p className="text-gray-600 font-medium">{uploadProgress}%</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors font-medium shadow-sm"
            disabled={uploading || !file}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <UploadIcon className="h-4 w-4" />
                Upload Document
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
