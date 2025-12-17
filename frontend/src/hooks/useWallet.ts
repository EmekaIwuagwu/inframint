import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  connected: boolean;
  provider: ethers.BrowserProvider | null;
  loading: boolean;
  error: Error | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    connected: false,
    provider: null,
    loading: false,
    error: null,
  });

  const connect = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setState({
        address,
        connected: true,
        provider,
        loading: false,
        error: null,
      });

      return address;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Connection failed'),
      }));
      throw error;
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      connected: false,
      provider: null,
      loading: false,
      error: null,
    });
  };

  const signMessage = async (message: string) => {
    if (!state.provider) throw new Error('Wallet not connected');

    const signer = await state.provider.getSigner();
    return await signer.signMessage(message);
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });

          if (accounts.length > 0) {
            setState({
              address: accounts[0],
              connected: true,
              provider,
              loading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
  };
};
