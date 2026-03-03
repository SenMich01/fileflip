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
        const status = await getUserPlanStatus();
        setPlanStatus(status);
        setCanConvertFiles(status.isPro || status.credits > 0);
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
      const status = await getUserPlanStatus();
      const hasAccess = status.isPro || status.credits > 0;
      
      if (!hasAccess) {
        throw new Error('Insufficient credits or Pro subscription required');
      }
      
      return { hasAccess, planStatus: status };
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
