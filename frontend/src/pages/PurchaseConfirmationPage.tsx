import React from 'react'
import { useLocation, Link, Navigate } from 'react-router-dom'

export const PurchaseConfirmationPage: React.FC = () => {
    const { state } = useLocation()

    if (!state?.digest || !state?.plan) {
        return <Navigate to="/services" replace />
    }

    const { digest, plan, amount } = state

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto bg-[#111827] rounded-2xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                {/* Success Banner */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-400"></div>

                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                    <p className="text-gray-400">Your access has been verified on the blockchain.</p>
                </div>

                {/* Receipt Card */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <span className="text-gray-400">Receipt Details</span>
                        <span className="text-sm font-mono text-gray-500">{new Date().toLocaleString()}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Service Plan</span>
                            <span className="text-white font-medium capitalize">{plan} Plan</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Amount Paid</span>
                            <span className="text-white font-medium">{amount} SUI</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Status</span>
                            <span className="text-green-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                Confirmed
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Reference Number (Tx Digest)</span>
                            <a
                                href={`https://suiscan.xyz/tx/${digest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-400 hover:text-primary-300 break-all font-mono flex items-center gap-2"
                            >
                                {digest}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Link
                        to="/services"
                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-center font-medium transition-colors"
                    >
                        Back to Services
                    </Link>
                    <Link
                        to="/provider"
                        className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-center font-medium hover:shadow-glow transition-all"
                    >
                        View Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
