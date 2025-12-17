import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Service {
  id: string
  name: string
  description: string
  type: string
  status: 'Active' | 'Maintenance' | 'Paused'
  users: number
  revenue: number
}

interface ManageServiceModalProps {
  service: Service
  onClose: () => void
  onUpdate: (updatedService: Service) => void
  onDelete: (id: string) => void
}

const ManageServiceModal: React.FC<ManageServiceModalProps> = ({ service, onClose, onUpdate, onDelete }) => {
  // ... same logic
  const [formData, setFormData] = useState<Service>(service)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1f2937] rounded-xl p-8 border border-gray-700 w-full max-w-2xl relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Manage Service</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Service Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Service Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none"
              >
                <option value="RPC">RPC</option>
                <option value="Indexer">Indexer</option>
                <option value="Storage">Storage</option>
                <option value="AI">AI</option>
                <option value="Compute">Compute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Current Revenue</label>
              <div className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed">
                ${formData.revenue}
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-between gap-4 border-t border-gray-700 mt-6">
            <button
              type="button"
              onClick={() => onDelete(formData.id)}
              className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg hover:bg-red-500 hover:text-white transition-all"
            >
              Delete Service
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
              >
                Update Service
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

import { config } from '../config'

export const ProviderDashboardPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null) // Using any for simplicity or define interface
  const [error, setError] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    fetchServices()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // In real app pass provider ID, here it infers or we pass current user
      const response = await fetch(`${config.API_URL}/api/v1/stats/provider`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats")
      setError("Failed to load dashboard stats. Please check backend connection.")
    }
  }

  const fetchServices = async () => {
    try {
      // In real app, we might have a specific endpoint 'GET /api/v1/provider/services'
      // or filter the main list. For now, let's fetch all (since we are the only provider in MVP)
      const response = await fetch(`${config.API_URL}/api/v1/services`)
      const data = await response.json()
      setServices(data.services)
    } catch (error) {
      console.error("Failed to fetch services", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updatedService: Service) => {
    try {
      const response = await fetch(`${config.API_URL}/api/v1/services/${updatedService.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedService)
      })

      if (response.ok) {
        setServices(services.map(s => s.id === updatedService.id ? updatedService : s))
        setEditingService(null)
      } else {
        alert("Failed to update service")
      }
    } catch (error) {
      console.error("Error updating service", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        const response = await fetch(`${config.API_URL}/api/v1/services/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setServices(services.filter(s => s.id !== id))
          setEditingService(null)
        } else {
          alert("Failed to delete service")
        }
      } catch (error) {
        console.error("Error deleting service", error)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {editingService && (
        <ManageServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      <div className="bg-[#111827] rounded-lg p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-8">Provider Dashboard</h1>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent mb-2">
              {stats ? stats.total_services : services.length}
            </div>
            <div className="text-sm text-gray-400">Total Services</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent mb-2">
              {stats ? stats.active_services : services.filter(s => s.status === 'Active').length}
            </div>
            <div className="text-sm text-gray-400">Active Services</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-accent-cyan to-accent-green bg-clip-text text-transparent mb-2">
              ${stats ? stats.total_revenue.toFixed(0) : '0'}
            </div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent mb-2">
              {stats ? stats.active_users : '0'}
            </div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">My Services</h2>
            <Link
              to="/provider/services/new"
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:shadow-glow transition-all"
            >
              + Add New Service
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300">Service</th>
                  <th className="text-left p-4 text-gray-300">Type</th>
                  <th className="text-left p-4 text-gray-300">Status</th>
                  <th className="text-left p-4 text-gray-300">Users</th>
                  <th className="text-left p-4 text-gray-300">Revenue</th>
                  <th className="text-right p-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{service.name}</div>
                      <div className="text-sm text-gray-400">{service.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">{service.type}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-white text-sm rounded-full ${service.status === 'Active' ? 'bg-green-600' :
                        service.status === 'Maintenance' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="p-4 text-white">{service.users}</td>
                    <td className="p-4 text-white">${service.revenue.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingService(service)}
                        className="text-primary-400 hover:text-primary-300 hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      You haven't created any services yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Recent Activity</h2>

          <div className="space-y-4">
            {stats && stats.recent_activity ? (
              stats.recent_activity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className={`w-10 h-10 ${activity.icon_bg} rounded-full flex items-center justify-center text-white font-bold`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-white">{activity.title}</div>
                        <div className="text-sm text-gray-400">{activity.description}</div>
                      </div>
                      <div className="text-sm text-gray-400">{activity.time}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 p-4">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
