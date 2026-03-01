import { Check, X } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router';
import { useState } from 'react';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular: boolean;
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for occasional conversions',
      features: [
        { text: '3 conversions per day', included: true },
        { text: 'Up to 10MB file size', included: true },
        { text: 'Standard processing speed', included: true },
        { text: 'Auto-delete after 1 hour', included: true },
        { text: 'Batch conversion', included: false },
        { text: 'Conversion history', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'per month',
      description: 'For professionals and frequent users',
      features: [
        { text: 'Unlimited conversions', included: true },
        { text: 'Up to 100MB file size', included: true },
        { text: 'Priority processing', included: true },
        { text: 'Extended storage (24 hours)', included: true },
        { text: 'Batch conversion', included: true },
        { text: 'Conversion history', included: true },
        { text: 'Email support', included: true },
      ],
      cta: 'Upgrade Now',
      popular: true,
    },
    {
      name: 'Pay Per Use',
      price: '$0.50',
      period: 'per conversion',
      description: 'Pay only when you need it',
      features: [
        { text: 'No monthly commitment', included: true },
        { text: 'Up to 50MB file size', included: true },
        { text: 'Standard processing speed', included: true },
        { text: 'Auto-delete after 1 hour', included: true },
        { text: 'Batch conversion', included: false },
        { text: 'Conversion history', included: true },
        { text: 'Email support', included: false },
      ],
      cta: 'Buy Credits',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Choose the plan that works best for you
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-500">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start gap-3"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          feature.included
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {feature.included ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <X className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span
                        className={
                          feature.included
                            ? 'text-gray-700'
                            : 'text-gray-400'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.name === 'Pro') {
                      // Redirect to Paystack for payment
                      window.open('https://paystack.com/buy/fileflip-pro-odyigw', '_blank');
                    } else if (plan.name === 'Free') {
                      // Redirect to home for free plan
                      window.location.href = '/';
                    } else {
                      // Handle pay per use
                      alert('Pay Per Use credits will be available soon!');
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade anytime?
                </h3>
                <p className="text-gray-600">
                  Yes! You can change your plan at any time. Upgrades take effect immediately,
                  and downgrades take effect at the end of your billing cycle.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards (Visa, Mastercard, Amex) through Paystack.
                  All payments are processed securely.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600">
                  We offer a 30-day money-back guarantee for Pro subscriptions. If you're not
                  satisfied, contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
