import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { FileText, Upload, History, Settings, LogOut, User, ChevronDown, CreditCard, Zap } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useConversionAccess } from '../../hooks/useConversionAccess';

interface UserSession {
  user: {
    email: string;
    id: string;
  };
  access_token: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { planStatus, canConvertFiles } = useConversionAccess();

  useEffect(() => {
    // Check if user is authenticated using Supabase
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to login if not authenticated
          navigate('/login');
          return;
        }

        setUser({
          user: {
            email: session.user.email || '',
            id: session.user.id
          },
          access_token: session.access_token
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userSession');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <img src="/FileFlip Logo.jpg" alt="FileFlip Logo" className="w-10 h-10 object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Convert Files</h3>
                  <p className="text-gray-600 text-sm">Convert PDFs, EPUBs, and images to your desired format</p>
                </div>
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <button 
                onClick={() => navigate('/convert')}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Start Converting
              </button>
            </div>

            <div className="bg-green-50 rounded-xl p-6 hover:bg-green-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Files</h3>
                  <p className="text-gray-600 text-sm">Upload files for conversion and processing</p>
                </div>
                <Upload className="w-12 h-12 text-green-600" />
              </div>
              <button 
                onClick={() => navigate('/upload')}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition cursor-pointer"
              >
                Upload Files
              </button>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 hover:bg-purple-100 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion History</h3>
                  <p className="text-gray-600 text-sm">View your conversion history and download results</p>
                </div>
                <History className="w-12 h-12 text-purple-600" />
              </div>
              <button 
                onClick={() => navigate('/history')}
                className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition cursor-pointer"
              >
                View History
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Email: {user?.user.email}</p>
                <p className="text-sm text-gray-600">User ID: {user?.user.id}</p>
                <p className="text-sm text-gray-600">Status: Active</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Plan Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Current Plan:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    planStatus?.isPro 
                      ? 'bg-blue-100 text-blue-800' 
                      : planStatus?.planType === 'Pay Per Use'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {planStatus?.isPro ? 'Pro' : planStatus?.planType || 'Free'}
                  </span>
                </div>
                {planStatus?.credits !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Credits:</span>
                    <span className="text-sm text-gray-600">{planStatus.credits}</span>
                  </div>
                )}
                {planStatus?.proExpiresAt && planStatus.isPro && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Expires:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(planStatus.proExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/pricing')}
                  className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer"
                >
                  {planStatus?.isPro || planStatus?.planType === 'Pay Per Use' ? 'Manage Plan' : 'Upgrade Plan'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/settings/profile')}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  Profile Settings
                </button>
                <button 
                  onClick={() => navigate('/settings/security')}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  Security Settings
                </button>
                <button 
                  onClick={() => navigate('/settings/notifications')}
                  className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition cursor-pointer"
                >
                  Notification Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}