import axios from 'axios';
import { baseUrl } from '@/utils/constant';

export interface CreditsData {
  credits: number;
  planType: 'FREE' | 'BASIC' | 'PRO';
  limit: number;
  canRender: boolean;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'PURCHASE' | 'RENDER' | 'REFUND' | 'BONUS' | 'SUBSCRIPTION';
  description: string;
  createdAt: string;
}

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const creditsApi = {
  getCreditsData: async (): Promise<CreditsData> => {
    const response = await api.get('/credits');
    return response.data;
  },
  getHistory: async (): Promise<CreditTransaction[]> => {
    const { data } = await api.get('/credits/history');
    return data;
  },
}

// Helper function to refresh credits in Redux store
export const refreshCreditsInStore = async (dispatch: any) => {
  try {
    const creditsData = await creditsApi.getCreditsData();
    // Import setCredits dynamically to avoid circular dependency
    const { setCredits } = await import('@/redux/slices/creditsSlice');
    dispatch(setCredits(creditsData));
    
    // Emit custom event for other components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('creditsUpdated', { detail: creditsData }));
    }
    
    return creditsData;
  } catch (error) {
    console.error('Failed to refresh credits:', error);
    throw error;
  }
};

// Trigger credits refresh from anywhere (will emit event)
export const triggerCreditsRefresh = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('triggerCreditsRefresh'));
  }
};