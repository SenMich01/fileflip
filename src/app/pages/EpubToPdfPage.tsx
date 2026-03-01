import { useState } from 'react';
import { Header } from '../components/Header';
import { FileUpload } from '../components/FileUpload';
import { ConversionStatus } from '../components/ConversionStatus';
import { FeatureSection } from '../components/FeatureSection';
import { Footer } from '../components/Footer';
import { BookOpen, FileText, Shield, Zap } from 'lucide-react';

type ConversionState = 'idle' | 'uploading' | 'converting' | 'completed' | 'error';

export default function EpubToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionState, setConversionState] = useState<ConversionState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isFreeLimitReached, setIsFreeLimitReached] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.epub')) {
      alert('Please select an EPUB file');
      return;
    }

    setFile(selectedFile);
    setConversionState('uploading');
    setProgress(0);

    // Check free tier limit
    const conversionsToday = parseInt(localStorage.getItem('conversionsToday') || '0');
    const lastConversionDate = localStorage.getItem('lastConversionDate');
    const today = new Date().toDateString();

    let currentConversions = conversionsToday;
    if (lastConversionDate !== today) {
      currentConversions = 0;
    }

    if (currentConversions >= 3) {
      setIsFreeLimitReached(true);
      setConversionState('error');
      return;
    }

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      setConversionState('converting');
      setProgress(0);

      // Simulate conversion progress
      const conversionInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(conversionInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);

      setTimeout(() => {
        // Simulate successful conversion
        setConversionState('completed');
        setProgress(100);
        
        // Create a mock download URL
        const mockBlob = new Blob(['Mock converted PDF content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(mockBlob);
        setDownloadUrl(url);

        // Update conversion count
        localStorage.setItem('conversionsToday', (currentConversions + 1).toString());
        localStorage.setItem('lastConversionDate', today);
      }, 4000);
    }, 1000);
  };

  const handleReset = () => {
    setFile(null);
    setConversionState('idle');
    setProgress(0);
    setDownloadUrl(null);
    setIsFreeLimitReached(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  };

  const getRemainingConversions = () => {
    const conversionsToday = parseInt(localStorage.getItem('conversionsToday') || '0');
    const lastConversionDate = localStorage.getItem('lastConversionDate');
    const today = new Date().toDateString();

    if (lastConversionDate !== today) {
      return 3;
    }
    return Math.max(0, 3 - conversionsToday);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <BookOpen className="w-12 h-12 text-purple-600" />
              <span className="text-4xl text-gray-400">→</span>
              <FileText className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              EPUB to PDF Converter
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Convert your eBooks to PDF format instantly. Preserve layout and formatting.
            </p>
            
            {/* Free Tier Indicator */}
            {conversionState === 'idle' && (
              <div className="mb-6 text-sm text-gray-500">
                {getRemainingConversions()} free conversions remaining today
              </div>
            )}

            {/* Main Conversion Area */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              {conversionState === 'idle' ? (
                <FileUpload 
                  onFileSelect={handleFileSelect}
                  acceptedFormats=".epub"
                  formatLabel="EPUB"
                />
              ) : (
                <ConversionStatus
                  state={conversionState}
                  progress={progress}
                  fileName={file?.name || ''}
                  downloadUrl={downloadUrl}
                  onReset={handleReset}
                  isFreeLimitReached={isFreeLimitReached}
                />
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-lg font-semibold text-gray-900 mb-1">Secure Conversion</div>
                <div className="text-sm text-gray-600">Your files are automatically deleted after 1 hour</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-lg font-semibold text-gray-900 mb-1">Lightning Fast</div>
                <div className="text-sm text-gray-600">Convert eBooks in under 30 seconds</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-lg font-semibold text-gray-900 mb-1">Perfect Layout</div>
                <div className="text-sm text-gray-600">Maintains original formatting and structure</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeatureSection />
      </main>

      <Footer />
    </div>
  );
}
