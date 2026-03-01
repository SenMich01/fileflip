import { CheckCircle, AlertCircle, Loader2, Download, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';

interface ConversionStatusProps {
  state: 'uploading' | 'converting' | 'completed' | 'error';
  progress: number;
  fileName: string;
  downloadUrl: string | null;
  onReset: () => void;
  isFreeLimitReached?: boolean;
}

export function ConversionStatus({
  state,
  progress,
  fileName,
  downloadUrl,
  onReset,
  isFreeLimitReached,
}: ConversionStatusProps) {
  if (state === 'error') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isFreeLimitReached ? 'Free Limit Reached' : 'Conversion Failed'}
        </h3>
        <p className="text-gray-600 mb-6">
          {isFreeLimitReached
            ? 'You\'ve reached your daily limit of 3 conversions.'
            : 'Something went wrong. Please try again.'}
        </p>
        {isFreeLimitReached ? (
          <div className="flex gap-4 justify-center">
            <Link
              to="/pricing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Upgrade for Unlimited
            </Link>
            <button
              onClick={onReset}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
            >
              Go Back
            </button>
          </div>
        ) : (
          <button
            onClick={onReset}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (state === 'completed' && downloadUrl) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversion Complete!</h3>
        <p className="text-gray-600 mb-6">Your file is ready to download</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
          <p className="text-sm text-gray-700 truncate">{fileName}</p>
          <p className="text-xs text-gray-500 mt-1">→ {fileName.replace('.pdf', '.docx')}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <a
            href={downloadUrl}
            download={fileName.replace('.pdf', '.docx')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Word Document
          </a>
          <button
            onClick={onReset}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Convert Another
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          This file will be automatically deleted in 1 hour
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {state === 'uploading' ? 'Uploading...' : 'Converting...'}
      </h3>
      <p className="text-gray-600 mb-6">
        {state === 'uploading'
          ? 'Uploading your file securely'
          : 'Converting PDF to Word format'}
      </p>

      <div className="max-w-md mx-auto">
        <div className="bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Please don't close this window
      </p>
    </div>
  );
}
