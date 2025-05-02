"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadResponse, setUploadResponse] = useState(null); // This will now hold the response from your FastAPI backend (which in turn calls UploadThing)
  const [helloMessage, setHelloMessage] = useState("");

  const callHelloEndpoint = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/hello`);
      const data = await response.json();
      setHelloMessage(data.message);
    } catch (error) {
      console.error("Error calling hello endpoint:", error);
      setHelloMessage("Error calling hello endpoint");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file first");
      return;
    }

    try {
      setUploadStatus("Uploading file..."); // Change status message

      const formData = new FormData();
      formData.append('file', file); // <-- Append the file directly with the field name 'file'

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          body: formData, // <-- Send the FormData object
          // Note: When using FormData, browsers usually set the Content-Type header automatically to multipart/form-data with the correct boundary.
          // Do NOT set Content-Type manually here.
        }
      );

      // Attempt to parse JSON even if the response is not OK
      const data = await response.json().catch(() => ({ detail: 'Unknown error parsing JSON' }));


      if (!response.ok) {
        // Improved error handling based on FastAPI's 422 structure
        let errorMessage = "Failed to upload file";
        if (data && data.detail) {
            if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) {
                errorMessage = data.detail[0].msg; // Get the specific validation error message
            } else if (typeof data.detail === 'string') {
                 errorMessage = data.detail; // Handle cases where detail is a simple string
            } else {
                errorMessage = JSON.stringify(data.detail); // Fallback for other detail structures
            }
        }
        throw new Error(errorMessage);
      }

      // If response is OK, data should contain the response from your FastAPI backend's call to UploadThing
      setUploadResponse(data);
      setUploadStatus("File uploaded successfully via backend!"); // Change status message

      // You no longer need the S3 upload logic in the frontend
      // because your backend is handling the call to UploadThing's API.

    } catch (error) {
      console.error("Error:", error);
      setUploadStatus("Error: " + error.message);
    }
  };

  // Remove the uploadToS3 function as the backend handles the UploadThing API call

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        {/* Hello API Section */}
        <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Test Hello API</h2>
          <button
            onClick={callHelloEndpoint}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 px-4 w-full mb-4"
          >
            Call Hello Endpoint
          </button>
          {helloMessage && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p>Response: {helloMessage}</p>
            </div>
          )}
        </div>

        {/* Upload API Section */}
        <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Test Upload API</h2>
          <div className="mb-4">
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 border rounded dark:bg-gray-700"
            />
          </div>
          <button
            onClick={handleUpload}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 px-4 w-full"
          >
            Upload File via Backend
          </button>

          {uploadStatus && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p>{uploadStatus}</p>
            </div>
          )}

          {/* Display the response from your FastAPI backend */}
          {uploadResponse && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Backend Upload Response:</h3>
              <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-xs">
                {JSON.stringify(uploadResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
