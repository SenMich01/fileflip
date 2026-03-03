import { Check, X, Lock, CreditCard, Zap, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { verifyPayment, getUserPlanStatus, PAYMENT_LINKS } from '../../lib/payment';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  popular: boolean;
  color: string;
}

interface UserPlan {
  planType: string;
  credits: number;
  isPro: boolean;
  proExpiresAt?: string;
  email?: string;
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('userSession');
        if (token) {
          // Verify token with backend
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-credits`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setIsLoggedIn(true);
            // Get user plan status
            const planStatus = await getUserPlanStatus();
            setUserPlan(planStatus);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check for payment verification on page load (from Paystack redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const planType = urlParams.get('plan');
    
    if (reference && planType && isLoggedIn && userPlan) {
      verifyPaymentFromPaystack(reference, planType);
    }
  }, [isLoggedIn, userPlan]);

  const verifyPaymentFromPaystack = async (reference: string, planType: string) => {
    try {
      const result = await verifyPayment(reference, userPlan?.email || '', planType);
      if (result.success) {
        setShowSuccessMessage(true);
        // Refresh user plan status
        const planStatus = await getUserPlanStatus();
        setUserPlan(planStatus);
        
        // Remove query params
        const url = new URL(window.location.href);
        url.searchParams.delete('reference');
        url.searchParams.delete('plan');
        window.history.replaceState({}, '', url.toString());
        
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!isLoggedIn) {
      // Store the plan they want to upgrade to and redirect to signup
      localStorage.setItem('pendingUpgradePlan', plan.name);
      localStorage.setItem('pendingUpgrade', 'true');
      window.location.href = '/signup';
      return;
    }

    if (plan.name === 'Pro') {
      // Redirect to Paystack for payment
      window.open(PAYMENT_LINKS.pro, '_blank');
    } else if (plan.name === 'Free') {
      // Redirect to home for free plan
      window.location.href = '/';
    } else {
      // Handle pay per use
      window.open(PAYMENT_LINKS.payPerUse, '_blank');
    }
  };

  const getCurrentPlanStatus = () => {
    if (!userPlan) return 'Free';
    if (userPlan.isPro) return 'Pro';
    return userPlan.planType || 'Free';
  };

  const plans: Plan[] = [
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
      color: 'gray',
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
      color: 'blue',
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
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Payment Successful!</h3>
                  <p className="text-green-700">Your plan has been updated successfully.</p>
                </div>
              </div>
            </div>
          )}

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
                  onClick={() => handleUpgrade(plan)}
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Checking authentication...' : plan.cta}
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
