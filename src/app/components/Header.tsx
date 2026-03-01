import { Link } from 'react-router';
import { FileText, Shield, Zap, Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const email = localStorage.getItem('userEmail') || '';
    setIsLoggedIn(loggedIn);
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserEmail('');
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="nav-responsive">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 touch-target">
            <FileText className="w-8 h-8 text-blue-600" />
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
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{userEmail}</div>
                    <div className="text-xs text-gray-500">Account</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
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
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
