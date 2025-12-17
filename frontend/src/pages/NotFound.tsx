import React from 'react'
import { Link } from 'react-router-dom'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0a0e1a]">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:shadow-glow transition-all duration-300 font-semibold"
          >
            Return Home
          </Link>

          <Link
            to="/services"
            className="px-8 py-3 bg-white/5 backdrop-blur-sm text-white rounded-xl hover:bg-white/10 transition-all border border-white/10 font-semibold"
          >
            Browse Services
          </Link>
        </div>
      </div>
    </div>
  )
}
