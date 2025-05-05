"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-100 bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-green-50 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-800">
              AI Planet
            </span>
          </Link>

          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-8 px-4">
              <Link
                href="/documents"
                className="text-gray-600 hover:text-gray-900"
              >
                Documents
              </Link>
              <Link
                href="/upload"
                className="text-gray-600 hover:text-gray-900"
              >
                Upload
              </Link>
            </nav>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-1.5 text-green-600 border border-green-200 rounded-full hover:bg-green-50">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-1.5 bg-green-500 text-white rounded-full hover:bg-green-600">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link
            href="/documents"
            className="block text-gray-700 hover:underline"
          >
            Documents
          </Link>
          <Link href="/upload" className="block text-gray-700 hover:underline">
            Upload
          </Link>
          <SignedOut>
            <div className="space-y-2 pt-2">
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2 text-green-600 border border-green-200 rounded hover:bg-green-50">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="pt-2">
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "w-6 h-6" } }}
              />
            </div>
          </SignedIn>
        </div>
      )}
    </header>
  );
}
