import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  formatLabel?: string;
}

export function FileUpload({ onFileSelect, acceptedFormats = '.pdf,application/pdf', formatLabel = 'PDF' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      // Check file size (10MB limit for free tier)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please upgrade for larger files.');
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit for free tier)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please upgrade for larger files.');
        return;
      }
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          {isDragging ? (
            <FileText className="w-8 h-8 text-blue-600" />
          ) : (
            <Upload className="w-8 h-8 text-blue-600" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Drop your {formatLabel} here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports {formatLabel} files up to 10MB (free tier)
          </p>
        </div>

        <input
          type="file"
          accept={acceptedFormats}
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer"
        >
          Select {formatLabel} File
        </label>

        <div className="text-xs text-gray-400 mt-2">
          Files are automatically deleted after 1 hour
        </div>
      </div>
    </div>
  );
}