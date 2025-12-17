import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { config } from '../config'

interface Service {
  id: string
  name: string
  provider: string
  type: string
  description: string
  price: number
  tags: string[]
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    serviceType: '',
    minPrice: '',
    maxPrice: '',
    searchQuery: '',
    selectedTags: [] as string[]
  })

  // Active filters applied to the list
  const [activeFilters, setActiveFilters] = useState(filters)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${config.API_URL}/api/v1/services`)
      if (!response.ok) throw new Error('Failed to fetch services')
      const data = await response.json()
      setServices(data.services)
      setError(null)
    } catch (err) {
      console.error('Error fetching services:', err)
      setError('Failed to load services. Please check if the backend is running.')
      // Fallback to empty list or you could keep a small mock fallback if preferred, 
      // but for "real connection" let's show the error state or empty.
    } finally {
      setLoading(false)
    }
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleTagClick = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }))
  }

  const applyFilters = () => {
    setActiveFilters(filters)
    setShowFilters(false)
    setCurrentPage(1) // Reset to first page on filter change
  }

  // Filter Logic
  const filteredServices = services.filter(service => {
    // Service Type
    if (activeFilters.serviceType && service.type.toLowerCase() !== activeFilters.serviceType.toLowerCase()) return false

    // Price Range
    if (activeFilters.minPrice && service.price < Number(activeFilters.minPrice)) return false
    if (activeFilters.maxPrice && service.price > Number(activeFilters.maxPrice)) return false

    // Search Query
    if (activeFilters.searchQuery) {
      const query = activeFilters.searchQuery.toLowerCase()
      const matchesSearch =
        service.name.toLowerCase().includes(query) ||
        service.provider.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Tags (Must contain ALL selected tags)
    if (activeFilters.selectedTags.length > 0) {
      const hasAllTags = activeFilters.selectedTags.every(tag => service.tags.includes(tag))
      if (!hasAllTags) return false
    }

    return true
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Loading services...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-500 mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchServices}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="bg-[#111827] rounded-lg p-6 border border-gray-800 sticky top-4">
            <h3 className="text-lg font-semibold text-white mb-6">Filters</h3>

            {/* Service Type Filter */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Service Type</label>
              <select
                name="serviceType"
                value={filters.serviceType}
                onChange={handleFilterChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="">All Types</option>
                <option value="rpc">RPC</option>
                <option value="indexer">Indexer</option>
                <option value="storage">Storage</option>
                <option value="ai">AI</option>
                <option value="compute">Compute</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Price Range (SUI)</label>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tags Filter */}
            <div className="mb-8">
              <label className="block text-sm text-gray-400 mb-3">Tags</label>
              <div className="flex flex-wrap gap-2">
                {['ethereum', 'sui', 'solana', 'mainnet', 'testnet', 'rpc', 'indexer', 'storage', 'ai'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1 text-xs rounded-full transition-all border ${filters.selectedTags.includes(tag)
                      ? 'bg-primary-600 border-primary-500 text-white shadow-glow'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={applyFilters}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all active:scale-95"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Service Grid */}
        <main className="flex-1">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Infrastructure Services</h1>
              <p className="text-gray-400">
                Showing {Math.min(filteredServices.length, (currentPage - 1) * itemsPerPage + 1)}-
                {Math.min(filteredServices.length, currentPage * itemsPerPage)} of {filteredServices.length} services
              </p>
            </div>

            {/* Items Per Page Selector */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-2 py-1 outline-none focus:border-primary-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              name="searchQuery"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              placeholder="Search services..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              Search
            </button>
            <button
              onClick={toggleFilters}
              className="px-6 py-2 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-lg transition-colors flex items-center gap-2 lg:hidden"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Filters
            </button>
          </div>

          {/* Filter Modal for Mobile */}
          {showFilters && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 lg:hidden">
              <div className="relative max-w-md w-full bg-gradient-to-br from-[#111827] to-[#1e293b] rounded-2xl p-6 border border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Filters</h2>
                  <button
                    onClick={toggleFilters}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Service Type Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Service Type</label>
                    <select
                      name="serviceType"
                      value={filters.serviceType}
                      onChange={handleFilterChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">All Types</option>
                      <option value="rpc">RPC</option>
                      <option value="indexer">Indexer</option>
                      <option value="storage">Storage</option>
                      <option value="ai">AI</option>
                      <option value="compute">Compute</option>
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Price Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="minPrice"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                      <input
                        type="number"
                        name="maxPrice"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {['Ethereum', 'Sui', 'Solana', 'Mainnet', 'Testnet'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag.toLowerCase())}
                          className={`px-3 py-1 text-xs rounded transition-colors ${filters.selectedTags.includes(tag.toLowerCase())
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-glow transition-all"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={toggleFilters}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedServices.length > 0 ? (
              paginatedServices.map((service) => (
                <Link key={service.id} to={`/services/${service.id}`} className="block">
                  <div className="bg-[#111827] rounded-lg p-6 border border-gray-800 hover:border-primary-500 transition-colors cursor-pointer h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full capitalize">{service.type}</span>
                      <span className="text-green-400 text-sm">✓ Verified</span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{service.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">by {service.provider}</p>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-5 mt-auto">
                      {service.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">{tag}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Starting at</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent">
                          {service.price} SUI/month
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center hover:bg-primary-500/20 transition-colors">
                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p className="text-xl">No services found match your filters.</p>
                <button
                  onClick={() => {
                    setFilters({
                      serviceType: '',
                      minPrice: '',
                      maxPrice: '',
                      searchQuery: '',
                      selectedTags: []
                    })
                    setActiveFilters({
                      serviceType: '',
                      minPrice: '',
                      maxPrice: '',
                      searchQuery: '',
                      selectedTags: []
                    })
                    setCurrentPage(1)
                  }}
                  className="mt-4 text-primary-400 hover:text-primary-300 underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredServices.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#111827] p-4 rounded-lg border border-gray-800">
              <div className="text-sm text-gray-400">
                Showing page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 1
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="hidden md:flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="w-10 h-10 flex items-center justify-center text-gray-600">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
