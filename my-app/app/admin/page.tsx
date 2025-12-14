'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { CyclingResult, ResultEntry } from '@/types';
import { parseExcelFile } from '@/lib/excel-parser';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [results, setResults] = useState<CyclingResult[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResult, setEditingResult] = useState<CyclingResult | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<'excel' | 'google_sheets'>('excel');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [parsedResults, setParsedResults] = useState<ResultEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchResults();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword('');
        fetchResults();
        toast.success('Logged in successfully');
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setResults([]);
      toast.success('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results');
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcelFile(buffer);
      setParsedResults(parsed);
      toast.success(`Parsed ${parsed.length} results from Excel`);
    } catch (error) {
      console.error('Error parsing Excel:', error);
      toast.error('Failed to parse Excel file');
    }
  };

  const handleGoogleSheetFetch = async () => {
    if (!googleSheetUrl) {
      toast.error('Please enter a Google Sheets URL');
      return;
    }

    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleSheetUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsedResults(data.results);
        toast.success(`Fetched ${data.results.length} results from Google Sheets`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch Google Sheet');
      }
    } catch (error) {
      console.error('Error fetching Google Sheet:', error);
      toast.error('Failed to fetch Google Sheet');
    }
  };

  const handleAddResult = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (parsedResults.length === 0) {
      toast.error('Please upload an Excel file or fetch Google Sheets data');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          results: parsedResults,
          sourceType,
          googleSheetUrl: sourceType === 'google_sheets' ? googleSheetUrl : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Result added successfully');
        setShowAddModal(false);
        resetForm();
        fetchResults();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add result');
      }
    } catch (error) {
      console.error('Error adding result:', error);
      toast.error('Failed to add result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateResult = async () => {
    if (!editingResult) return;

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: { title: string; results?: ResultEntry[]; googleSheetUrl?: string } = {
        title,
      };

      if (parsedResults.length > 0) {
        updateData.results = parsedResults;
      }

      if (sourceType === 'google_sheets') {
        updateData.googleSheetUrl = googleSheetUrl;
      }

      const response = await fetch(`/api/results/${editingResult.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast.success('Result updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchResults();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update result');
      }
    } catch (error) {
      console.error('Error updating result:', error);
      toast.error('Failed to update result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this result?')) return;

    try {
      const response = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Result deleted successfully');
        fetchResults();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete result');
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error('Failed to delete result');
    }
  };

  const openEditModal = (result: CyclingResult) => {
    setEditingResult(result);
    setTitle(result.title);
    setSourceType(result.sourceType);
    setGoogleSheetUrl(result.googleSheetUrl || '');
    setParsedResults([]);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setSourceType('excel');
    setGoogleSheetUrl('');
    setParsedResults([]);
    setEditingResult(null);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage cycling results</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Public Page
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Result Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Result
          </button>
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No results yet. Click &quot;Add Result&quot; to create one.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.results.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.sourceType === 'google_sheets' ? 'Google Sheets' : 'Excel'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(result.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openEditModal(result)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteResult(result.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {showEditModal ? 'Edit Result' : 'Add New Result'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
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

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title / Race Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mountain Bike Championship 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Source Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sourceType"
                      value="excel"
                      checked={sourceType === 'excel'}
                      onChange={() => setSourceType('excel')}
                      className="mr-2"
                    />
                    Excel Upload
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sourceType"
                      value="google_sheets"
                      checked={sourceType === 'google_sheets'}
                      onChange={() => setSourceType('google_sheets')}
                      className="mr-2"
                    />
                    Google Sheets Link
                  </label>
                </div>
              </div>

              {/* Excel Upload */}
              {sourceType === 'excel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    First row should contain headers (Position, Name, Time, Team, Category, etc.)
                  </p>
                </div>
              )}

              {/* Google Sheets URL */}
              {sourceType === 'google_sheets' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Sheets URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleGoogleSheetFetch}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Fetch
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The sheet must be published to the web (File → Share → Publish to web)
                  </p>
                </div>
              )}

              {/* Preview */}
              {parsedResults.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview ({parsedResults.length} results)
                  </label>
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Pos
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                            Name
                          </th>
                          {parsedResults[0]?.time && (
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                              Time
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedResults.slice(0, 5).map((entry, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-sm">{entry.position}</td>
                            <td className="px-4 py-2 text-sm">{entry.name}</td>
                            {parsedResults[0]?.time && (
                              <td className="px-4 py-2 text-sm">{entry.time || '-'}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedResults.length > 5 && (
                      <p className="text-xs text-gray-500 p-2 text-center">
                        ... and {parsedResults.length - 5} more results
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={showEditModal ? handleUpdateResult : handleAddResult}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : showEditModal ? 'Update Result' : 'Add Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
