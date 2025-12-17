import React from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'

export const CreateServiceSuccessPage: React.FC = () => {
    const { state } = useLocation()

    if (!state?.serviceId) {
        return <Navigate to="/provider" replace />
    }

    const { serviceId, serviceName, timestamp } = state

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto bg-[#111827] rounded-2xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                {/* Success Banner */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                        <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Service Created Successfully!</h1>
                    <p className="text-gray-400">Your service is now listed on the Inframint marketplace.</p>
                </div>

                {/* Details Card */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <span className="text-gray-400">Submission Details</span>
                        <span className="text-sm font-mono text-gray-500">
                            {timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Service Name</span>
                            <span className="text-white font-medium">{serviceName || 'Unknown Service'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Reference ID</span>
                            <span className="text-primary-400 font-mono">{serviceId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Status</span>
                            <span className="text-green-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Link
                        to="/provider"
                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-center font-medium transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                    <Link
                        to={`/services/${serviceId}`} // Ideally this would link to the real new service
                        className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-center font-medium hover:shadow-glow transition-all"
                    >
                        View Service
                    </Link>
                </div>
            </div>
        </div>
    )
}
