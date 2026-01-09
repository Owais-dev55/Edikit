import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/redux/store';
import { refreshCreditsInStore } from '@/lib/credits';

export function useCredits() {
  const dispatch = useDispatch<AppDispatch>();
  const credits = useSelector((state: RootState) => state.credits);
  const user = useSelector((state: RootState) => state.user.user);

  // Manual refresh function
  const refreshCredits = useCallback(async () => {
    if (!user) return;
    try {
      await refreshCreditsInStore(dispatch);
    } catch (error) {
      console.error('Failed to refresh credits:', error);
    }
  }, [dispatch, user]);

  // Listen for manual refresh triggers
  useEffect(() => {
    const handleRefresh = () => {
      refreshCredits();
    };

    window.addEventListener('triggerCreditsRefresh', handleRefresh);
    return () => window.removeEventListener('triggerCreditsRefresh', handleRefresh);
  }, [refreshCredits]);

  // Auto-refresh credits every 30 seconds when user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshCredits();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, refreshCredits]);

  return {
    ...credits,
    refreshCredits,
  };
}
