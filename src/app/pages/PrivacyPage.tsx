import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Shield, Lock, Trash2, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your Privacy Matters
            </h1>
            <p className="text-xl text-gray-600">
              We're committed to protecting your data and privacy
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: March 1, 2026
            </p>
          </div>

          {/* Key Principles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Auto-Delete After 1 Hour
              </h3>
              <p className="text-gray-600 text-sm">
                All uploaded files are automatically and permanently deleted from our servers
                1 hour after upload, or immediately after download.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Encrypted Transfers
              </h3>
              <p className="text-gray-600 text-sm">
                All file uploads and downloads use HTTPS encryption. Your files are never
                transmitted or stored in plain text.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                No Data Mining
              </h3>
              <p className="text-gray-600 text-sm">
                We never look at, analyze, or reuse your files for any purpose. Your content
                is yours alone.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                No File Retention
              </h3>
              <p className="text-gray-600 text-sm">
                We don't create backups or archives of your files. Once deleted, they're
                gone forever.
              </p>
            </div>
          </div>

          {/* Privacy Policy Details */}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Information We Collect
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong className="text-gray-900">Files You Upload:</strong> We temporarily
                  store your files only for the duration needed to complete the conversion
                  process. Files are automatically deleted after 1 hour or immediately after
                  download.
                </p>
                <p>
                  <strong className="text-gray-900">Account Information:</strong> If you create
                  an account, we collect your email address and password (encrypted). For paid
                  accounts, payment information is securely processed by Stripe.
                </p>
                <p>
                  <strong className="text-gray-900">Usage Data:</strong> We collect basic
                  analytics (page views, conversion counts) to improve our service. This data
                  is anonymous and cannot be linked to individual files.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How We Use Your Information
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>To convert your files as requested</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>To maintain and improve our service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>To provide customer support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>To process payments (via Stripe)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>To send service-related communications</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Data Security
              </h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>All connections use HTTPS/TLS encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Files are stored in isolated, secure storage buckets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Automated cleanup processes ensure data deletion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Access logs are monitored for security threats</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Third-Party Services
              </h2>
              <p className="text-gray-600 mb-4">
                We use select third-party services to provide FileFlip:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong className="text-gray-900">Stripe:</strong> For secure payment
                    processing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong className="text-gray-900">Cloud Storage:</strong> For temporary file
                    storage during conversion
                  </span>
                </li>
              </ul>
              <p className="text-gray-600 mt-4">
                We never share your files with third parties for marketing or analysis purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Rights
              </h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Access your account information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Request deletion of your account and data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Opt out of marketing communications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Request a copy of your data</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                GDPR & CCPA Compliance
              </h2>
              <p className="text-gray-600">
                FileFlip is committed to compliance with GDPR (General Data Protection
                Regulation) and CCPA (California Consumer Privacy Act). We provide transparent
                data practices and respect your privacy rights under these regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600">
                If you have questions about our privacy practices or want to exercise your
                privacy rights, please contact us at:
              </p>
              <p className="text-blue-600 mt-2">privacy@fileflip.com</p>
            </section>
          </div>

          {/* Important Notice */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              Important Notice
            </h3>
            <p className="text-gray-700 text-sm">
              FileFlip is designed for general file conversion needs. We do not recommend
              using our service for highly sensitive documents containing personal identifiable
              information (PII), medical records, financial data, or classified information.
              For such documents, please use enterprise-grade solutions with additional
              security certifications.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}