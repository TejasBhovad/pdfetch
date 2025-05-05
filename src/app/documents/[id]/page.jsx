"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApiClient } from "@/utils/api";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  FileText,
  Calendar,
  HardDrive,
  FileType,
  ExternalLink,
  Loader2,
  Send,
  MessageSquare,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

export default function DocumentDetail() {
  const params = useParams();
  const id = params.id;
  const { isLoaded: authLoaded } = useUser();

  const [document, setDocument] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
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
      await apiClient.askQuestion(newQuestion, Number.parseInt(id));

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
      <div className="flex justify-center items-center p-8 h-[50vh]">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-700">Error</h2>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setDataFetched(false); // Reset to allow refetching
              window.location.reload();
            }}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-8 text-center text-gray-700">Document not found</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/documents"
          className="text-green-500 hover:text-green-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Documents
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-md">
            <FileText className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
              {document.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p>
                  Uploaded: {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-gray-400" />
                <p>
                  Size: {(document.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <FileType className="h-4 w-4 text-gray-400" />
                <p>Type: {document.file_type}</p>
              </div>
            </div>

            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-600 transition-colors flex items-center gap-2 mt-2 w-fit"
            >
              <ExternalLink className="h-4 w-4" />
              View Original Document
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Ask a Question
        </h2>
        <form onSubmit={handleAskQuestion} className="flex gap-3">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask anything about this document..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            disabled={asking}
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            disabled={asking || !newQuestion.trim()}
          >
            {asking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Ask
              </>
            )}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          Questions & Answers
        </h2>

        {questions.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <p className="text-gray-600">
              No questions asked yet. Ask your first question above!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div
                key={question.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
              >
                <div className="mb-4">
                  <div className="flex items-start gap-2">
                    <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                      <MessageSquare className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {question.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Asked on{" "}
                        {new Date(question.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {question.answer ? (
                  <div className="ml-8 pl-4 border-l-2 border-green-400">
                    <p className="text-gray-700">{question.answer.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Answered on{" "}
                      {new Date(question.answer.created_at).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="ml-8 pl-4 border-l-2 border-gray-200 flex items-center gap-2 text-gray-500 italic">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p>Answer pending...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
