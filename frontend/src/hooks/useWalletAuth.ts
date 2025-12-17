import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuthStore } from '../stores/useAuthStore';

export const useWalletAuth = () => {
    const suiAccount = useCurrentAccount();
    const { mutate: disconnectSui } = useDisconnectWallet();
    const { isConnected: isMockConnected, address: mockAddress, logout: mockLogout } = useAuthStore();

    const isConnected = !!suiAccount || isMockConnected;
    const address = suiAccount?.address || mockAddress;

    const disconnect = () => {
        if (suiAccount) {
            disconnectSui();
        }
        mockLogout();
    };

    return {
        isConnected,
        address,
        disconnect
    };
};
