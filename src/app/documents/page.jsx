"use client";

import { useEffect, useState, useCallback } from "react";
import { useApiClient } from "@/utils/api";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { FileText, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const { isLoaded: authLoaded } = useUser();

  const apiClient = useApiClient();

  const fetchDocuments = useCallback(async () => {
    if (!authLoaded || fetchAttempted) return;

    try {
      setLoading(true);
      setFetchAttempted(true);

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
      <div className="flex justify-center items-center p-8 h-[50vh]">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-600 mb-4 shadow-sm">
          {error}
        </div>
        <button
          onClick={() => {
            setFetchAttempted(false);
            setError(null);
            fetchDocuments();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">
          Your Documents
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <p className="mb-6 text-gray-600">
            You haven't uploaded any documents yet.
          </p>
          <Link
            href="/upload"
            className="px-5 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors inline-block shadow-sm flex items-center gap-2 justify-center mx-auto w-fit"
          >
            <Plus className="h-5 w-5" />
            Upload Your First Document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Your Documents</h1>
        <Link
          href="/upload"
          className="px-5 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Upload New Document
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-green-50 rounded-md">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg text-gray-800 truncate">
                  {doc.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6 gap-3">
              <Link
                href={`/documents/${doc.id}`}
                className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 text-sm transition-colors text-center font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View & Ask
              </Link>
              <button
                onClick={() => handleDelete(doc.id)}
                className="px-4 py-2 text-red-500 rounded-md hover:bg-red-50 text-sm transition-colors"
                aria-label="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
