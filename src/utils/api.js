"use client";

import { useAuth } from "@clerk/nextjs";

export function useApiClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const makeRequest = async (endpoint, options = {}) => {
    try {
      // Wait for Clerk to initialize
      if (!isLoaded) {
        console.log("Clerk auth not yet loaded, waiting...");
        // Instead of immediately returning an error, wait for auth to load
        await new Promise((resolve) => {
          const checkLoaded = () => {
            if (isLoaded) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100); // Check again after 100ms
            }
          };
          checkLoaded();
        });

        // If we get here, auth has loaded, so continue with the request
        console.log("Clerk auth now loaded, proceeding with request");
      }

      // Check if user is signed in (keep this part as is)
      if (!isSignedIn) {
        console.log("User not signed in");
        return new Response(
          JSON.stringify({ error: "User not authenticated" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get token from Clerk
      const token = await getToken();

      // Set headers with auth token
      const headers = { ...options.headers };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.log("No token available from Clerk");
        return new Response(
          JSON.stringify({ error: "No authentication token available" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Don't set Content-Type for FormData (file uploads)
      if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
        credentials: "include", // Include cookies if any
      });

      return response;
    } catch (error) {
      console.error("API client error:", error);
      throw error;
    }
  };

  // Return API methods
  return {
    // Document operations
    getDocuments: async () => {
      const response = await makeRequest("/documents");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch documents");
      }
      return response.json();
    },

    getDocument: async (id) => {
      const response = await makeRequest(`/documents/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          JSON.stringify(errorData) || "Failed to fetch document"
        );
      }
      return response.json();
    },

    deleteDocument: async (id) => {
      const response = await makeRequest(`/documents/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete document");
      }
      return response.json();
    },

    // File upload operation
    uploadFile: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      return makeRequest("/upload", {
        method: "POST",
        body: formData,
      });
    },

    // Question operations
    getDocumentQuestions: async (documentId) => {
      const response = await makeRequest(`/questions/${documentId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch questions");
      }
      return response.json();
    },

    askQuestion: async (content, documentId) => {
      const response = await makeRequest("/ask", {
        method: "POST",
        body: JSON.stringify({ content, document_id: documentId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to ask question");
      }
      return response.json();
    },

    // User operations
    getUserStats: async () => {
      const response = await makeRequest("/stats");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch user stats");
      }
      return response.json();
    },

    getUserProfile: async () => {
      const response = await makeRequest("/user");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch user profile");
      }
      return response.json();
    },
  };
}
