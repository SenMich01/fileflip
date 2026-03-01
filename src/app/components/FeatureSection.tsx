import { Shield, Zap, Lock, Trash2, Clock, BarChart3 } from 'lucide-react';

export function FeatureSection() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Convert files in under 30 seconds with our optimized conversion engine',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your files are automatically deleted after 1 hour. We never sell or reuse your data',
    },
    {
      icon: Lock,
      title: 'Secure Transfer',
      description: 'All uploads and downloads use HTTPS encryption for maximum security',
    },
    {
      icon: BarChart3,
      title: 'High Accuracy',
      description: 'Preserve layouts, formatting, and images with our advanced conversion algorithms',
    },
    {
      icon: Clock,
      title: 'No Registration',
      description: 'Start converting immediately. No account needed for free tier conversions',
    },
    {
      icon: Trash2,
      title: 'Auto Cleanup',
      description: 'Files are permanently deleted from our servers after processing',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose FileFlip?
          </h2>
          <p className="text-lg text-gray-600">
            Fast, secure, and privacy-focused file conversion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
