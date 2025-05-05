"use client";

import { useEffect, useState, useCallback } from "react";
import { useApiClient } from "@/utils/api";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Check auth state
  const { isLoaded: authLoaded } = useUser();

  // Get our API client hook
  const apiClient = useApiClient();

  const fetchDocuments = useCallback(async () => {
    if (!authLoaded || fetchAttempted) return;

    try {
      setLoading(true);
      setFetchAttempted(true);

      // Call getDocuments directly - it should already return JSON data
      const data = await apiClient.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [apiClient, authLoaded, fetchAttempted]);

  useEffect(() => {
    if (authLoaded && !fetchAttempted) {
      fetchDocuments();
    }
  }, [fetchDocuments, authLoaded, fetchAttempted]);

  const handleDelete = async (documentId) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await apiClient.deleteDocument(documentId);

      // Remove document from state
      setDocuments(documents.filter((doc) => doc.id !== documentId));
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Failed to delete document");
    }
  };

  if (!authLoaded || (loading && !documents.length && !error)) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 mb-4">
          {error}
        </div>
        <button
          onClick={() => {
            setFetchAttempted(false);
            setError(null);
            fetchDocuments();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">Your Documents</h1>
        <p className="mb-6">You haven't uploaded any documents yet.</p>
        <Link
          href="/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Upload Your First Document
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Documents</h1>
        <Link
          href="/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Upload New Document
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow"
          >
            <h3 className="font-medium text-lg mb-2 truncate">{doc.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {new Date(doc.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <div className="flex justify-between mt-4">
              <Link
                href={`/documents/${doc.id}`}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
              >
                View & Ask
              </Link>
              <button
                onClick={() => handleDelete(doc.id)}
                className="px-3 py-1.5 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
