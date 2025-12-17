import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Tier {
  id: number;
  name: string;
  price: number;
  requests: number;
}

export const CreateServicePage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [serviceName, setServiceName] = useState('')
  const [description, setDescription] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [tags, setTags] = useState<string[]>(['ethereum', 'mainnet', 'rpc'])
  const [newTag, setNewTag] = useState('')

  const [tiers, setTiers] = useState<Tier[]>([
    { id: 1, name: 'Basic Tier', price: 50, requests: 10000 },
    { id: 2, name: 'Pro Tier', price: 150, requests: 100000 }
  ])

  // Tag Handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    const tag = newTag.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(e)
    }
  }

  // Tier Handlers
  const handleAddTier = (e: React.MouseEvent) => {
    e.preventDefault()
    const newId = Math.max(...tiers.map(t => t.id), 0) + 1
    setTiers([...tiers, { id: newId, name: `Tier ${newId}`, price: 100, requests: 50000 }])
  }

  const handleRemoveTier = (idToRemove: number) => {
    setTiers(tiers.filter(tier => tier.id !== idToRemove))
  }

  const handleTierChange = (id: number, field: keyof Tier, value: string | number) => {
    setTiers(tiers.map(tier => {
      if (tier.id === id) {
        return { ...tier, [field]: value }
      }
      return tier
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceType) {
      setError("Please select a service type")
      return
    }

    setLoading(true)
    setError(null)

    const payload = {
      name: serviceName,
      description: description,
      service_type: serviceType,
      tags: tags,
      tiers: tiers.map(t => ({
        name: t.name,
        price: t.price,
        requests: t.requests
      }))
    }

    try {
      const response = await fetch(`${config.API_URL}/api/v1/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to create service')
      }

      const data = await response.json()

      // Navigate to success page
      navigate('/provider/services/success', {
        state: {
          serviceId: data.service_id,
          serviceName: serviceName,
          timestamp: new Date().toISOString()
        }
      })
    } catch (err: any) {
      console.error('Submission failed:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#111827] rounded-lg p-8 border border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-8">Create New Service</h1>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select service type</option>
                <option value="rpc">RPC Endpoint</option>
                <option value="indexer">Blockchain Indexer</option>
                <option value="storage">Storage Service</option>
                <option value="ai">AI/ML Service</option>
                <option value="compute">Compute Service</option>
              </select>
            </div>

            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Ethereum Mainnet RPC"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your service features, benefits, and technical specifications"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500 resize-none"
              ></textarea>
            </div>

            {/* Service URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Service URL</label>
              <input
                type="url"
                placeholder="https://your-service.example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-400 hover:text-white focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type tag and press Enter"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Add Tag
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to add tags</p>
            </div>

            {/* Pricing Tiers */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pricing Tiers</label>
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div key={tier.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 relative group">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tier.id)}
                      className="absolute top-4 right-4 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Tier Name</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => handleTierChange(tier.id, 'name', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price (SUI/mo)</label>
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => handleTierChange(tier.id, 'price', Number(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Requests/month</label>
                        <input
                          type="number"
                          value={tier.requests}
                          onChange={(e) => handleTierChange(tier.id, 'requests', Number(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddTier}
                  className="w-full py-3 border-2 border-dashed border-gray-700 text-gray-400 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Pricing Tier
                </button>
              </div>
            </div>

            {/* Documentation */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Documentation URL</label>
              <input
                type="url"
                placeholder="https://docs.your-service.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-glow transition-all font-semibold text-lg flex items-center justify-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Service...
                  </>
                ) : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
