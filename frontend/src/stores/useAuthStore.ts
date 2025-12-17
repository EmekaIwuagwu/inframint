import { create } from 'zustand';

interface AuthState {
  isConnected: boolean;
  address: string | null;
  walletType: 'slush' | 'sui' | null;
  login: (address: string, type?: 'slush' | 'sui') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isConnected: false,
  address: null,
  walletType: null,
  login: (address, type = 'slush') => set({ isConnected: true, address, walletType: type }),
  logout: () => set({ isConnected: false, address: null, walletType: null }),
}));
