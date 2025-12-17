import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { WalletConnect } from '../auth/WalletConnect'
import { useCurrentAccount } from '@mysten/dapp-kit'

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const currentAccount = useCurrentAccount()
  const isAuthenticated = !!currentAccount

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0a0e1a]">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-purple rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent">
              InfraMint
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Link
                  to="/services"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Browse Services
                </Link>
                <Link
                  to="/provider"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Provider Dashboard
                </Link>
              </>
            )}
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 mt-16 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} InfraMint. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
