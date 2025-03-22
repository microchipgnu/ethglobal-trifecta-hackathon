'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1E2030] to-[#2A3A5E] text-white p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-indigo-300">404</h1>
        <h2 className="text-2xl md:text-3xl">Page Not Found</h2>
        <p className="max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
