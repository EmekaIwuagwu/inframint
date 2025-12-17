-- Service Providers Table
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_address VARCHAR(66) UNIQUE NOT NULL,
    api_key_hash VARCHAR(128) NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_type VARCHAR(100) NOT NULL, -- 'rpc', 'indexer', 'storage', 'ai', 'compute'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'maintenance', 'deprecated'
    metadata JSONB NOT NULL DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Endpoints Table
CREATE TABLE service_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    protocol VARCHAR(50) NOT NULL, -- 'https', 'wss', 'grpc'
    environment VARCHAR(50) DEFAULT 'production', -- 'production', 'staging', 'testnet'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pricing Tiers Table
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    price_amount BIGINT NOT NULL, -- In smallest unit (wei, satoshi, etc.)
    price_token VARCHAR(100) NOT NULL, -- 'ETH', 'USDC', 'SUI', etc.
    quota_requests INTEGER, -- NULL for unlimited
    quota_period_days INTEGER,
    rate_limit_per_second INTEGER,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_type ON services(service_type);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_tags ON services USING GIN(tags);
CREATE INDEX idx_services_metadata ON services USING GIN(metadata);
CREATE INDEX idx_endpoints_service ON service_endpoints(service_id);
CREATE INDEX idx_pricing_service ON pricing_tiers(service_id);

-- Full-text search index
CREATE INDEX idx_services_search ON services USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
