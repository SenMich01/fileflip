import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { History, Download, FileText, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Conversion {
  id: string;
  file_name: string;
  from_format: string;
  to_format: string;
  status: string;
  output_url: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversionHistory();
  }, []);

  const fetchConversionHistory = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch conversion history from Supabase
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setConversions(data || []);
    } catch (err) {
      console.error('Error fetching conversion history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversion history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                <History className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversion History</h1>
              <p className="text-gray-600">View your conversion history and download results</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={fetchConversionHistory}
                  className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-gray-600">Loading conversion history...</span>
            </div>
          ) : conversions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversions yet</h3>
              <p className="text-gray-600">Start converting files to see your history here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">File Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">From Format</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">To Format</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {conversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{conversion.file_name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{conversion.from_format.toUpperCase()}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{conversion.to_format.toUpperCase()}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(conversion.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversion.status)}`}>
                          {getStatusIcon(conversion.status)}
                          <span className="ml-1.5">{conversion.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {conversion.status === 'completed' && conversion.output_url ? (
                          <a
                            href={conversion.output_url}
                            download
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">No download available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}