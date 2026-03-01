import { useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FileText, Mail, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use Supabase MCP server to send password reset email
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/supabase/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center hero-responsive">
        <div className="container-sm">
          <div className="text-center space-y-responsive">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-responsive-lg font-bold text-gray-900">Reset your password</h1>
            <p className="text-responsive text-gray-600 max-w-md mx-auto">
              {isSubmitted
                ? 'Check your email for reset instructions'
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 touch-target">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email sent!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full btn-responsive bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Resend email
                  </button>
                  <Link
                    to="/login"
                    className="block w-full text-center text-gray-600 hover:text-gray-900 py-3 rounded-lg border border-gray-300 hover:border-gray-400 transition font-medium"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full input-responsive border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-responsive bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}