"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApiClient } from "@/utils/api";
import Link from "next/link";
import { useUser } from "@clerk/nextjs"; // Add this import

export default function DocumentDetail() {
  const params = useParams();
  const id = params.id;
  const { isLoaded: authLoaded } = useUser(); // Add this to check auth state

  const [document, setDocument] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false); // Add this state
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);

  // Get our API client hook
  const apiClient = useApiClient();

  useEffect(() => {
    // Only fetch data when authentication is loaded and we haven't attempted to fetch yet
    if (authLoaded && id && !dataFetched) {
      fetchDocumentAndQuestions();
    }

    async function fetchDocumentAndQuestions() {
      try {
        setLoading(true);
        setError(null);
        setDataFetched(true); // Mark that we've attempted to fetch data

        // Fetch document details
        const docData = await apiClient.getDocument(id);
        setDocument(docData);

        // Fetch questions for this document
        const questionsData = await apiClient.getDocumentQuestions(id);
        setQuestions(questionsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load document details");
      } finally {
        setLoading(false);
      }
    }
  }, [id, apiClient, authLoaded, dataFetched]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!newQuestion.trim()) {
      return;
    }

    try {
      setAsking(true);
      await apiClient.askQuestion(newQuestion, parseInt(id));

      // Refresh the questions list
      const questionsData = await apiClient.getDocumentQuestions(id);
      setQuestions(questionsData);
      setNewQuestion("");
    } catch (err) {
      console.error("Error asking question:", err);
      alert("Failed to get an answer: " + (err.message || "Please try again."));
    } finally {
      setAsking(false);
    }
  };

  // Show loading state when auth isn't loaded yet or when we're loading data
  if (!authLoaded || (authLoaded && loading && !error)) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-lg font-semibold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            setDataFetched(false); // Reset to allow refetching
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!document) {
    return <div className="p-8">Document not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/documents"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <span>←</span> Back to Documents
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <p>Uploaded: {new Date(document.created_at).toLocaleDateString()}</p>
          <p>Size: {(document.file_size / (1024 * 1024)).toFixed(2)} MB</p>
          <p>Type: {document.file_type}</p>
        </div>

        <a
          href={document.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View Original Document
        </a>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask anything about this document..."
            className="flex-1 p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            disabled={asking}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={asking || !newQuestion.trim()}
          >
            {asking ? "Getting Answer..." : "Ask"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Questions & Answers</h2>

        {questions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No questions asked yet. Ask your first question above!
          </p>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="mb-4">
                  <p className="font-medium mb-1">Q: {question.content}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Asked on {new Date(question.created_at).toLocaleString()}
                  </p>
                </div>

                {question.answer ? (
                  <div className="pl-4 border-l-2 border-blue-600">
                    <p className="mb-1">A: {question.answer.content}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Answered on{" "}
                      {new Date(question.answer.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 italic">
                    Answer pending...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
