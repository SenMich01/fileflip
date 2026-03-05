import { Link, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { FileText, Shield, Zap, Menu, X, LogOut, User, Settings, Bell, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useConversionAccess } from '../../hooks/useConversionAccess';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check login status using Supabase
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || '');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setUserEmail('');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="nav-responsive">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 touch-target">
            <img src="/FileFlip Logo.jpg" alt="FileFlip Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-gray-900">FileFlip</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <div className="relative group">
              <button className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2 text-sm font-medium">
                Converters
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100">
                <div className="py-2">
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                  >
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    PDF → Word
                  </Link>
                  <Link
                    to="/epub-to-pdf"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                  >
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    EPUB → PDF
                  </Link>
                  <Link
                    to="/image-to-pdf"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition font-medium"
                  >
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Image → PDF
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition text-sm font-medium">
              Pricing
            </Link>
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900 transition text-sm font-medium">
              Privacy
            </Link>
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                {/* Credits Display */}
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <CreditCard className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Credits: 0</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition touch-target"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">{getInitials(userEmail)}</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{userEmail}</div>
                      <div className="text-xs text-gray-500">Account</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        to="/settings/profile"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        to="/settings/security"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Shield className="w-4 h-4 text-red-600" />
                        <span>Security Settings</span>
                      </Link>
                      <Link
                        to="/settings/notifications"
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Bell className="w-4 h-4 text-purple-600" />
                        <span>Notification Preferences</span>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 transition text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition touch-target"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-3">Converters</p>
              <Link
                to="/"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                PDF → Word
              </Link>
              <Link
                to="/epub-to-pdf"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                EPUB → PDF
              </Link>
              <Link
                to="/image-to-pdf"
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Image → PDF
              </Link>
            </div>
            <div className="space-y-1">
              <Link
                to="/pricing"
                className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/privacy"
                className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                onClick={() => setIsMenuOpen(false)}
              >
                Privacy
              </Link>
            </div>
            {isLoggedIn ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 touch-target">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{userEmail}</div>
                    <div className="text-xs text-gray-500">Account</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="flex items-center px-3 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition touch-target"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition touch-target text-center font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
