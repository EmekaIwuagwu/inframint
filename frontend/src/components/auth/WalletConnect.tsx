import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { useConnectWallet, useWallets, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

export const WalletConnect: React.FC = () => {
  const navigate = useNavigate();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();

  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnect = (wallet: any) => {
    try {
      connect({ wallet }, {
        onSuccess: () => {
          console.log("Connected to", wallet.name);
          setShowConnectModal(false);
        },
        onError: (error) => {
          console.error("Failed to connect:", error);
        }
      });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  return (
    <div className="relative">
      {currentAccount ? (
        <div className="flex items-center gap-3">
          <div className="group relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-gray-200 text-sm font-mono tracking-wide">
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
            </div>

            {/* Dropdown for Disconnect */}
            <div className="absolute right-0 top-full mt-2 w-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-2 z-50">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1f2e] border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/10 hover:border-red-500/50 transition-all shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="gradient"
          size="sm"
          onClick={() => {
            const slushWallet = wallets.find(w => w.name.toLowerCase().includes('slush'));
            if (slushWallet) {
              handleConnect(slushWallet);
            } else {
              setShowConnectModal(true);
            }
          }}
          className="px-6 py-2.5 font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
        >
          Connect Wallet
        </Button>
      )}

      {/* Main Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#111827] rounded-2xl p-8 border border-gray-800 shadow-2xl">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-75"></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Connect Wallet</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-400 text-sm mb-4">Select a wallet to connect to InfraMint</p>

                {wallets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700 border-dashed">
                    <p className="text-gray-400">No wallets detected.</p>
                    <p className="text-sm text-gray-500 mt-2">Please install Slush Wallet or another Sui wallet extension.</p>
                    <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm">
                      Browse Extensions
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => handleConnect(wallet)}
                        className="w-full group relative overflow-hidden flex items-center justify-between px-6 py-5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                            {/* Use wallet icon if available, otherwise check if it's Slush, otherwise default */}
                            {wallet.icon ? (
                              <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 object-contain" />
                            ) : wallet.name.toLowerCase().includes('slush') ? (
                              <span className="text-2xl">💧</span>
                            ) : (
                              <span className="text-2xl">👛</span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-white font-bold text-lg group-hover:text-blue-400 transition-colors">{wallet.name}</div>
                            <div className="text-gray-500 text-sm group-hover:text-gray-400">Sui Wallet</div>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-colors">
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              </div>

              <div className="mt-8 text-center text-gray-500 text-xs">
                By connecting, you agree to our Terms & Privacy Policy
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
