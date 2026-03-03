import { supabase } from './supabase';

// Paystack payment verification
export async function verifyPayment(reference, email, planType) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('userSession')}`
      },
      body: JSON.stringify({
        reference,
        email,
        planType
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

// Check user credits and plan status
export async function getUserPlanStatus() {
  try {
    const token = localStorage.getItem('userSession');
    if (!token) {
      return { planType: 'Free', credits: 0, isPro: false };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user-credits`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    const isPro = data.planType === 'Pro' && new Date(data.proExpiresAt) > new Date();
    
    return {
      planType: data.planType || 'Free',
      credits: data.credits || 0,
      isPro,
      proExpiresAt: data.proExpiresAt
    };
  } catch (error) {
    console.error('Error checking user plan status:', error);
    return { planType: 'Free', credits: 0, isPro: false };
  }
}

// Deduct credits for conversion
export async function deductCredits() {
  try {
    const token = localStorage.getItem('userSession');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deduct-credits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
}

// Check if user can convert
export async function canConvert() {
  const status = await getUserPlanStatus();
  return status.isPro || status.credits > 0;
}

// Get payment links
export const PAYMENT_LINKS = {
  pro: 'https://paystack.com/buy/fileflip-pro-odyigw',
  payPerUse: 'https://paystack.com/buy/buy-credits-file-flip-dvuihl'
};