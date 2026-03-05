import { useState, useEffect } from 'react';
import { getUserPlanStatus, canConvert } from '../lib/payment';

interface UserPlan {
  planType: string;
  credits: number;
  isPro: boolean;
  proExpiresAt?: string;
  email?: string;
}

export function useConversionAccess() {
  const [planStatus, setPlanStatus] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canConvertFiles, setCanConvertFiles] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('userSession');
        if (token) {
          const status = await getUserPlanStatus();
          setPlanStatus(status);
          setCanConvertFiles(status.isPro || status.credits > 0);
        } else {
          // Check guest credits
          let guestCredits = parseInt(localStorage.getItem('guestCredits') || '0');
          if (guestCredits === 0) {
            // Give new guest users 3 free credits
            guestCredits = 3;
            localStorage.setItem('guestCredits', '3');
          }
          setCanConvertFiles(guestCredits > 0);
        }
      } catch (error) {
        console.error('Error checking conversion access:', error);
        setCanConvertFiles(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  const checkAccessBeforeConversion = async () => {
    try {
      const token = localStorage.getItem('userSession');
      if (token) {
        const status = await getUserPlanStatus();
        const hasAccess = status.isPro || status.credits > 0;
        
        if (!hasAccess) {
          throw new Error('Insufficient credits. Sign up for free to get more credits!');
        }
        
        return { hasAccess, planStatus: status };
      } else {
        // Check guest credits
        let guestCredits = parseInt(localStorage.getItem('guestCredits') || '0');
        if (guestCredits <= 0) {
          throw new Error('You have no credits left. Sign up for free to get more credits!');
        }
        
        return { hasAccess: true, planStatus: null };
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    planStatus,
    isLoading,
    canConvertFiles,
    checkAccessBeforeConversion
  };
}
