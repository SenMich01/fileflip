import { useCallback, useState } from 'react';
import { Upload, FileText, Lock } from 'lucide-react';
import { useConversionAccess } from '../../hooks/useConversionAccess';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  formatLabel?: string;
}

export function FileUpload({ onFileSelect, acceptedFormats = '.pdf,application/pdf', formatLabel = 'PDF' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { canConvertFiles, planStatus } = useConversionAccess();

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
      // Check conversion access first
      if (!canConvertFiles) {
        alert('You need a Pro subscription or credits to convert files. Please upgrade your plan.');
        return;
      }

      // Check file size limits based on plan
      const maxSize = planStatus?.isPro ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeMB = planStatus?.isPro ? '100MB' : '10MB';
      
      if (file.size > maxSize) {
        alert(`File size exceeds ${maxSizeMB} limit for your plan. Please upgrade for larger files.`);
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect, canConvertFiles, planStatus]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check conversion access first
      if (!canConvertFiles) {
        alert('You need a Pro subscription or credits to convert files. Please upgrade your plan.');
        return;
      }

      // Check file size limits based on plan
      const maxSize = planStatus?.isPro ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeMB = planStatus?.isPro ? '100MB' : '10MB';
      
      if (file.size > maxSize) {
        alert(`File size exceeds ${maxSizeMB} limit for your plan. Please upgrade for larger files.`);
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect, canConvertFiles, planStatus]);

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