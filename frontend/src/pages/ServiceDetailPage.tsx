import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useWallets, useConnectWallet, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { config } from '../config'

interface PricingTier {
  id: string
  tier_name: string
  price_amount: number
  price_token: string
  quota_requests: number
}

interface ServiceDetail {
  id: string
  name: string
  provider_name: string
  description: string
  type: string
  status: string
  tags: string[]
  pricing_tiers: PricingTier[]
}

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [service, setService] = useState<ServiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${config.API_URL}/api/v1/services/${id}`)
        if (!response.ok) {
          throw new Error("Service not found")
        }
        const data = await response.json()
        setService(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchServiceDetails()
    }
  }, [id])

  const handlePurchase = async () => {
    if (!currentAccount) {
      const slushWallet = wallets.find(w => w.name.toLowerCase().includes('slush'))
      if (slushWallet) {
        connect({ wallet: slushWallet })
      } else {
        alert('Please install Slush Wallet.')
      }
      return
    }

    if (!selectedPlanId || !service) return

    const selectedTier = service.pricing_tiers.find(t => t.id === selectedPlanId)
    if (!selectedTier) return

    try {
      const txb = new Transaction()

      // Amount in MIST (assuming price_amount is in full units, e.g. 50 SUI)
      // In real backend, price_amount should be stored in MIST or Wei.
      // For now assuming the backend returns "50" for 50 SUI.
      const amount = selectedTier.price_amount * 1_000_000_000

      const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(amount)])
      txb.transferObjects([coin], txb.pure.address(currentAccount.address)) // Mock transfer to self

      signAndExecuteTransaction(
        { transaction: txb },
        {
          onSuccess: (result: any) => {
            navigate('/purchase-confirmation', {
              state: {
                digest: result.digest,
                plan: selectedTier.tier_name,
                amount: selectedTier.price_amount
              }
            })
          },
          onError: (error: any) => {
            console.error('Purchase failed:', error)
            alert('Transaction failed. Please try again.')
          }
        }
      )
    } catch (e) {
      console.error('Error constructing transaction:', e)
      alert('Failed to prepare transaction.')
    }
  }

  if (loading) return <div className="text-center py-20 text-white">Loading service details...</div>
  if (error || !service) return <div className="text-center py-20 text-red-500">Error: {error || "Service not found"}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/services" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to search results
      </Link>

      <div className="bg-[#111827] rounded-lg p-8 border border-gray-800">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Service Details</h1>
          <p className="text-gray-400">Service ID: {service.id}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Information</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Service Name</label><p className="text-white">{service.name}</p></div>
              <div><label className="block text-sm text-gray-400 mb-1">Provider</label><p className="text-white">{service.provider_name}</p></div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Service Type</label>
                <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">{service.type}</span>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">{service.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">Service Details</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Description</label><p className="text-gray-300 text-sm">{service.description}</p></div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Pricing Plans</h2>
          {service.pricing_tiers.length === 0 ? (
            <p className="text-gray-500">No pricing plans available.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {service.pricing_tiers.map(tier => (
                <div
                  key={tier.id}
                  className={`bg-gray-800 rounded-xl p-6 border transition-all cursor-pointer ${selectedPlanId === tier.id
                    ? 'border-primary-500 shadow-glow bg-gray-800/80 ring-1 ring-primary-500'
                    : 'border-gray-700 hover:border-gray-600'
                    }`}
                  onClick={() => setSelectedPlanId(prev => prev === tier.id ? null : tier.id)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">{tier.tier_name}</h3>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                      {tier.price_amount} {tier.price_token}<span className="text-sm font-normal text-gray-400">/mo</span>
                    </span>
                  </div>
                  <ul className="text-gray-400 text-sm space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> {tier.quota_requests} requests/month
                    </li>
                  </ul>
                  <button
                    className={`w-full px-4 py-2 rounded-lg transition-all font-medium ${selectedPlanId === tier.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {selectedPlanId === tier.id ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handlePurchase}
            disabled={!selectedPlanId}
            className={`px-8 py-3 rounded-xl transition-all font-semibold ${selectedPlanId
              ? 'bg-gradient-to-r from-accent-purple to-accent-pink text-white hover:shadow-glow-purple cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
          >
            {currentAccount ? 'Purchase Access' : 'Connect Wallet to Purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
