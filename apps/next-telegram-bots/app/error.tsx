'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1E2030] to-[#2A3A5E] text-white p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-red-400">Error</h1>
        <h2 className="text-2xl md:text-3xl">Something went wrong</h2>
        <p className="max-w-md mx-auto">
          We apologize for the inconvenience. Please try again or return to the
          home page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            type="button"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
