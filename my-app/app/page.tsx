'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CyclingResult } from '@/types';

export default function Home() {
  const [results, setResults] = useState<CyclingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<CyclingResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results');
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cycling Results</h1>
              <p className="mt-1 text-sm text-gray-500">
                Official race results - Verified and tamper-proof
              </p>
            </div>
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results available</h3>
            <p className="mt-1 text-sm text-gray-500">Check back later for race results.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedResult(result)}
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{result.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{formatDate(result.createdAt)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {result.results.length} participants
                    </span>
                    <span className="text-blue-600 text-sm font-medium">View Results →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Modal */}
        {selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedResult.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(selectedResult.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        {selectedResult.results[0]?.time && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        )}
                        {selectedResult.results[0]?.team && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Team
                          </th>
                        )}
                        {selectedResult.results[0]?.category && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.results.map((entry, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.position}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.name}
                          </td>
                          {selectedResult.results[0]?.time && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.time || '-'}
                            </td>
                          )}
                          {selectedResult.results[0]?.team && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.team || '-'}
                            </td>
                          )}
                          {selectedResult.results[0]?.category && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.category || '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
                These results are official and protected from tampering
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
