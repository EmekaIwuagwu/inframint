import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'

interface GlobalStats {
  services_listed: number
  volume_traded: number
  active_users: number
}

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/v1/stats/global`)
      if (!response.ok) throw new Error('Failed to connect to backend')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0a0e1a] relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent-purple rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-accent-cyan rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Blockchain Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated blockchain nodes with enhanced animations */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-primary-500/20 rounded-full animate-float animate-node-connect"></div>
        <div className="absolute top-20 right-20 w-12 h-12 bg-accent-cyan/20 rounded-full animate-float animation-delay-1000 animate-node-connect"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-accent-purple/20 rounded-full animate-float animation-delay-2000 animate-node-connect"></div>
        <div className="absolute bottom-10 right-10 w-14 h-14 bg-primary-400/20 rounded-full animate-float animation-delay-3000 animate-node-connect"></div>

        {/* Additional floating particles for depth */}
        <div className="absolute top-1/3 left-1/5 w-8 h-8 bg-accent-green/15 rounded-full animate-particle animation-delay-500"></div>
        <div className="absolute top-2/3 right-1/3 w-6 h-6 bg-accent-pink/15 rounded-full animate-particle animation-delay-1500"></div>
        <div className="absolute top-1/4 right-1/4 w-10 h-10 bg-accent-cyan/15 rounded-full animate-particle animation-delay-2500"></div>

        {/* Connecting lines - blockchain chain effect with pulsing animation */}
        <svg className="absolute inset-0 w-full h-full animate-chain-pulse" style={{ opacity: 0.15 }}>
          <defs>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.4 }} />
              <stop offset="50%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.4 }} />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
            </radialGradient>
          </defs>

          {/* Main blockchain chains */}
          <path d="M50 150 Q 250 100 450 150 T 850 150" stroke="url(#chainGradient)" strokeWidth="2" fill="none" className="animate-chain-pulse" style={{ animationDelay: '0.5s' }} />
          <path d="M150 350 Q 350 300 550 350 T 950 350" stroke="url(#chainGradient)" strokeWidth="2" fill="none" className="animate-chain-pulse" style={{ animationDelay: '1s' }} />
          <path d="M100 550 Q 300 500 500 550 T 900 550" stroke="url(#chainGradient)" strokeWidth="2" fill="none" className="animate-chain-pulse" style={{ animationDelay: '1.5s' }} />

          {/* Vertical connections */}
          <path d="M300 150 L 300 350" stroke="url(#chainGradient)" strokeWidth="1" fill="none" className="animate-chain-pulse" style={{ animationDelay: '2s' }} />
          <path d="M600 350 L 600 550" stroke="url(#chainGradient)" strokeWidth="1" fill="none" className="animate-chain-pulse" style={{ animationDelay: '2.5s' }} />

          {/* Glowing nodes at connection points */}
          <circle cx="300" cy="150" r="8" fill="url(#nodeGlow)" className="animate-pulse-glow" style={{ animationDelay: '0.8s' }} />
          <circle cx="450" cy="150" r="6" fill="url(#nodeGlow)" className="animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
          <circle cx="300" cy="350" r="8" fill="url(#nodeGlow)" className="animate-pulse-glow" style={{ animationDelay: '1.6s' }} />
        </svg>

        {/* Enhanced pulsing glow effects with multiple layers */}
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-primary-500/8 to-accent-purple/8 rounded-full animate-pulse-glow transform -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-r from-accent-cyan/12 to-accent-green/12 rounded-full animate-pulse-glow transform -translate-x-1/2 -translate-y-1/2 blur-2xl" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 bg-accent-green rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm text-primary-300">Powered by Sui Blockchain</span>
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-white via-primary-200 to-accent-cyan bg-clip-text text-transparent">
                Infrastructure Services,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-accent-purple to-accent-pink bg-clip-text text-transparent">
                Onchain & Accessible
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover, pay for, and consume infrastructure services with
              <span className="text-primary-400 font-semibold"> cryptographic access control</span> and
              <span className="text-accent-purple font-semibold"> native crypto payments</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/services"
                className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 font-semibold text-lg flex items-center gap-2"
              >
                Explore Services
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                to="/provider/services/new"
                className="px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl hover:bg-white/10 transition-all border border-white/10 font-semibold text-lg"
              >
                List Your Service
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              {error ? (
                <div className="col-span-3 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                  ⚠️ {error}. Displaying cached data.
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                  {stats ? `${stats.services_listed}+` : '...'}
                </div>
                <div className="text-sm text-gray-400">Services Listed</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
                  {stats ? `$${(stats.volume_traded / 1000000).toFixed(1)}M+` : '...'}
                </div>
                <div className="text-sm text-gray-400">Volume Traded</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent">
                  {stats ? `${(stats.active_users / 1000).toFixed(1)}k+` : '...'}
                </div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔍"
              gradient="from-primary-500 to-primary-600"
              title="Discover Services"
              description="Browse infrastructure with detailed metadata, transparent pricing, and verified SLAs"
            />
            <FeatureCard
              icon="💎"
              gradient="from-accent-purple to-accent-pink"
              title="Onchain Payments"
              description="Pay with SUI or stablecoins and receive cryptographically verifiable entitlements"
            />
            <FeatureCard
              icon="🔐"
              gradient="from-accent-cyan to-accent-green"
              title="Enforced Access"
              description="Access control enforced at the service boundary with real-time quota tracking"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              InfraMint makes infrastructure services accessible with onchain payments and access control
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6 mx-auto">
                <span>🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">1. Discover Services</h3>
              <p className="text-gray-400 text-center">
                Browse our marketplace to find the infrastructure services you need - RPCs, indexers, storage, and more.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6 mx-auto">
                <span>💳</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">2. Connect Wallet & Pay</h3>
              <p className="text-gray-400 text-center">
                Connect your Slush Wallet or MetaMask and purchase access with SUI or other cryptocurrencies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6 mx-auto">
                <span>⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 text-center">3. Access Services</h3>
              <p className="text-gray-400 text-center">
                Get instant access with your cryptographic entitlement. No API keys, just onchain verification.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose InfraMint?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The future of infrastructure access is here
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Cryptographic Access</h3>
              <p className="text-gray-400">
                No more API keys. Access is controlled by onchain entitlements that you own.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>💰</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Pay As You Go</h3>
              <p className="text-gray-400">
                Flexible pricing with crypto payments. Pay for what you need, when you need it.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Instant Access</h3>
              <p className="text-gray-400">
                Get started immediately. No waiting for approvals or manual onboarding.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Multi-Chain Support</h3>
              <p className="text-gray-400">
                Access services across multiple blockchains with a single wallet.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Secure & Private</h3>
              <p className="text-gray-400">
                Your data stays private. Only your wallet address is used for verification.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-purple rounded-xl flex items-center justify-center text-3xl mb-6">
                <span>📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Transparent Pricing</h3>
              <p className="text-gray-400">
                Clear pricing with no hidden fees. See exactly what you're paying for.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-300">
              Trusted by developers and providers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-purple rounded-full flex items-center justify-center text-lg mr-4">
                  <span>👤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Sarah Chen</h4>
                  <p className="text-sm text-gray-400">Blockchain Developer</p>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "InfraMint revolutionized how we access infrastructure. The onchain payments and instant access save us hours every week."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-purple rounded-full flex items-center justify-center text-lg mr-4">
                  <span>👤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Michael Johnson</h4>
                  <p className="text-sm text-gray-400">DeFi Founder</p>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "As a service provider, InfraMint gave us a new revenue stream with minimal integration effort. Highly recommended!"
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-[#111827] rounded-xl p-8 border border-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-purple rounded-full flex items-center justify-center text-lg mr-4">
                  <span>👤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Emily Rodriguez</h4>
                  <p className="text-sm text-gray-400">Web3 Entrepreneur</p>
                </div>
              </div>
              <p className="text-gray-300 italic">
                "The crypto-native approach of InfraMint aligns perfectly with our vision. It's the future of infrastructure access."
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="bg-gradient-to-r from-primary-600/20 to-accent-purple/20 rounded-2xl p-12 text-center border border-primary-500/30">
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers and providers using InfraMint for seamless infrastructure access.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/services"
                className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 font-semibold text-lg flex items-center gap-2"
              >
                Browse Services
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                to="/provider/services/new"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 font-semibold text-lg"
              >
                Become a Provider
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const FeatureCard: React.FC<{
  icon: string;
  gradient: string;
  title: string;
  description: string;
}> = ({ icon, gradient, title, description }) => (
  <div className="group relative">
    {/* Glow effect on hover */}
    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

    {/* Card */}
    <div className="relative bg-[#111827] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300">
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-3xl mb-6 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
)
