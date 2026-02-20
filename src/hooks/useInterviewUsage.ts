import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface UsageStatus {
  plan_type: 'free' | 'paid';
  current_usage: number;
  usage_limit: number;
  remaining: number;
  current_month: string;
}

interface UsageCheck {
  can_proceed: boolean;
  current_usage: number;
  usage_limit: number;
  plan_type: 'free' | 'paid';
  message?: string;
}

export function useInterviewUsage() {
  const { user } = useAuth();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchUsageStatus = async () => {
    if (!user) {
      setUsageStatus(null);
      return;
    }

    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}/api/usage/status/${user.id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage status');
      }
      const data = await response.json();
      setUsageStatus(data);
    } catch (err) {
      // Don't set error for network failures - allow graceful degradation
      if (err instanceof Error && err.name !== 'AbortError' && err.name !== 'TimeoutError') {
        setError(err.message);
      }
      console.warn('Error fetching usage status (backend may be unavailable):', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const checkUsage = async (): Promise<UsageCheck | null> => {
    if (!user) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${API_BASE_URL}/api/usage/check/${user.id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to check usage';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        console.warn('Usage check failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          url: `${API_BASE_URL}/api/usage/check/${user.id}`
        });
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Return null for network errors to allow graceful degradation
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message.includes('Failed to fetch'))) {
        console.warn('Usage check failed (backend may be unavailable):', err);
      } else {
        console.error('Error checking usage:', err);
      }
      return null;
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/usage/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!response.ok) {
        throw new Error('Failed to increment usage');
      }
      // Refresh usage status after incrementing
      await fetchUsageStatus();
      return true;
    } catch (err) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchUsageStatus();
  }, [user]);

  return {
    usageStatus,
    loading,
    error,
    fetchUsageStatus,
    checkUsage,
    incrementUsage,
  };
}
