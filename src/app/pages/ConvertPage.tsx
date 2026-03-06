import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FileText, Upload, File, Loader2, Download } from 'lucide-react';
import { CONVERSION_CONFIG, getMimeTypes } from '../../config/formats';

export default function ConvertPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('pdf');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to convert');
      return;
    }

    setIsConverting(true);
    setError('');

    try {
      // Get user ID from localStorage or session
      const userSession = localStorage.getItem('userSession');
      const userId = userSession ? JSON.parse(userSession).user?.id : null;

      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', file);

      // Determine the correct API endpoint based on target format
      let endpoint = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (targetFormat === 'docx' && fileExtension === 'pdf') {
        endpoint = '/api/pdf-to-word';
      } else if (targetFormat === 'pdf' && fileExtension === 'epub') {
        endpoint = '/api/epub-to-pdf';
      } else if (targetFormat === 'pdf' && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension)) {
        endpoint = '/api/image-to-pdf';
      } else {
        // Fallback to the existing conversion route
        formData.append('targetFormat', targetFormat);
        endpoint = '/api/convert';
      }

      // Call the backend conversion API
      const response = await fetch(`${process.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'x-user-id': userId || ''
        },
        body: formData,
      });

      if (response.ok) {
        // Handle guest credits if user is not logged in
        if (!userId) {
          const current = parseInt(localStorage.getItem('guestCredits') || '3', 10);
          localStorage.setItem('guestCredits', String(current - 1));
        }
        
        // For direct file downloads, the response will be the file itself
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setConversionResult(url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Conversion failed');
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Network error during conversion');
    } finally {
      setIsConverting(false);
    }
  };

  const formats = CONVERSION_CONFIG.outputFormats;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <img src="/FileFlip Logo.jpg" alt="FileFlip Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Convert Files</h1>
            <p className="text-gray-600">Convert PDFs, EPUBs, and images to your desired format</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleConvert} className="space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.epub,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <File className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
                Convert to format
              </label>
              <select
                id="format"
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                {formats.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isConverting || !file}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert File'
              )}
            </button>
          </form>

          {conversionResult && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Conversion Complete!</h3>
                  <p className="text-green-700 text-sm">Your file has been converted successfully</p>
                </div>
                <a
                  href={conversionResult}
                  download
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}