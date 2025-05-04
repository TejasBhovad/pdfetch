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
      setUploadStatus("Uploading file...");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => ({ detail: "Unknown error parsing JSON" }));

      if (!response.ok) {
        let errorMessage = "Failed to upload file";
        if (data && data.detail) {
          if (
            Array.isArray(data.detail) &&
            data.detail.length > 0 &&
            data.detail[0].msg
          ) {
            errorMessage = data.detail[0].msg;
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        }
        throw new Error(errorMessage);
      }

      setUploadResponse(data);
      setUploadStatus("File uploaded successfully via backend!");
    } catch (error) {
      console.error("Error:", error);
      setUploadStatus("Error: " + error.message);
    }
  };

  return (
    <div className="h-full w-full justify-items-center flex flex-col items-center gap-4 p-4">
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
    </div>
  );
}
