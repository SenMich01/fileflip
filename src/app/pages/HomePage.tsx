import { useState } from 'react';
import { Header } from '../components/Header';
import { FileUpload } from '../components/FileUpload';
import { ConversionStatus } from '../components/ConversionStatus';
import { FeatureSection } from '../components/FeatureSection';
import { Footer } from '../components/Footer';

type ConversionState = 'idle' | 'uploading' | 'converting' | 'completed' | 'error';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionState, setConversionState] = useState<ConversionState>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isFreeLimitReached, setIsFreeLimitReached] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setConversionState('uploading');
    setProgress(0);

    // Check free tier limit (simulate)
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
        const mockBlob = new Blob(['Mock converted file content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="hero-responsive">
          <div className="container-lg">
            <div className="text-center space-y-responsive">
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <img src="/FileFlip Logo.jpg" alt="FileFlip Logo" className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-responsive-lg font-bold text-gray-900">
                  Fast, Secure File Conversion
                </h1>
                <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
                  Convert PDF to Word in seconds. No nonsense, no spying.
                </p>
              </div>
              
              {/* Free Tier Indicator */}
              {conversionState === 'idle' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {getRemainingConversions()} free conversions remaining today
                </div>
              )}

              {/* Main Conversion Area */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 touch-target">
                {conversionState === 'idle' ? (
                  <FileUpload onFileSelect={handleFileSelect} />
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
              <div className="grid-responsive">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{'< 30s'}</div>
                  <div className="text-gray-600 text-sm">Average Conversion Time</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                  <div className="text-gray-600 text-sm">Privacy Protected</div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">10MB</div>
                  <div className="text-gray-600 text-sm">Free Tier Limit</div>
                </div>
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
