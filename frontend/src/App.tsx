import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { ServicesPage } from './pages/ServicesPage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { ProviderDashboardPage } from './pages/ProviderDashboardPage'
import { CreateServicePage } from './pages/CreateServicePage'
import { Layout } from './components/layout/Layout'
import { NotFound } from './pages/NotFound'

import { PurchaseConfirmationPage } from './pages/PurchaseConfirmationPage'
import { CreateServiceSuccessPage } from './pages/CreateServiceSuccessPage'

export const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/purchase-confirmation" element={<PurchaseConfirmationPage />} />
        <Route path="/provider" element={<ProviderDashboardPage />} />
        <Route path="/provider/services/new" element={<CreateServicePage />} />
        <Route path="/provider/services/success" element={<CreateServiceSuccessPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

export default App
