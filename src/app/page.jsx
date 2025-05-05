"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  FileText,
  Upload,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const currentDate = "2025-05-05";
  const currentTime = "15:32:08";

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-8 inline-flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                <span>AI-Powered Document Assistant</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Extract insights from your{" "}
                <span className="text-green-600">documents</span> instantly
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Upload PDFs and ask questions in natural language. Get accurate
                answers without reading lengthy documents.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/upload"
                  className="px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  Upload Document
                </Link>
                <Link
                  href="/documents"
                  className="px-6 py-3 bg-white text-gray-700 font-medium border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Browse Documents
                </Link>
              </div>
            </div>

            <div className="lg:w-1/2">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-1 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-md">
                      <FileText className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Document Analysis
                      </h3>
                      <p className="text-sm text-gray-500">
                        Smart insights from your PDFs
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-700 font-medium">
                          Extract key information
                        </p>
                        <p className="text-sm text-gray-500">
                          Identify important data points without manual review
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-700 font-medium">
                          Get instant answers
                        </p>
                        <p className="text-sm text-gray-500">
                          Ask specific questions about document content
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-700 font-medium">
                          Save time and effort
                        </p>
                        <p className="text-sm text-gray-500">
                          Reduce hours of reading to minutes of conversation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to extract valuable insights from your
              documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Upload Document
              </h3>
              <p className="text-gray-600">
                Select and upload your PDF document. Our system securely stores
                your files for analysis.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                AI Processing
              </h3>
              <p className="text-gray-600">
                Our advanced AI analyzes the document content and creates a
                searchable knowledge base.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-50 rounded-full w-12 h-12 flex items-center justify-center mb-5">
                <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Ask Questions
              </h3>
              <p className="text-gray-600">
                Ask specific questions about your document and receive accurate
                answers based on its content.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect For
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our document assistant helps professionals across industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Research Papers
              </h3>
              <p className="text-gray-600 text-sm">
                Extract key findings and methodologies from academic research
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Financial Reports
              </h3>
              <p className="text-gray-600 text-sm">
                Quickly analyze quarterly and annual financial statements
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Legal Documents
              </h3>
              <p className="text-gray-600 text-sm">
                Navigate complex agreements and identify key clauses
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Technical Manuals
              </h3>
              <p className="text-gray-600 text-sm">
                Find specific procedures and specifications quickly
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-8 sm:p-12 rounded-2xl shadow-sm border border-green-100">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white rounded-full mb-6 shadow-sm">
                <Sparkles className="h-8 w-8 text-green-500" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Start extracting insights now
              </h2>

              <p className="text-gray-700 max-w-2xl mb-8">
                Upload your first document and see how our AI assistant can help
                you extract valuable information in seconds.
              </p>

              <Link
                href="/upload"
                className="px-8 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-colors shadow-sm inline-flex items-center gap-2 text-lg"
              >
                <Upload className="h-5 w-5" />
                Get Started
              </Link>

              <p className="text-sm text-gray-500 mt-6 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Your documents are processed securely and privately
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
