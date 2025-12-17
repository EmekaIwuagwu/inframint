-- Insert Mock Provider
INSERT INTO service_providers (id, name, email, wallet_address, api_key_hash, verified)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'InfraMint Demo',
    'demo@inframint.com',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    'mock_hash',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Insert Some Initial Services with Fixed IDs
INSERT INTO services (id, provider_id, name, description, service_type, tags, status)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Sui Mainnet RPC',
    'High-performance, scalable JSON-RPC endpoint for Sui Mainnet.',
    'rpc',
    ARRAY['sui', 'mainnet', 'rpc'],
    'active'
),
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'Ethereum Indexer',
    'Real-time and historical data indexer for Ethereum.',
    'indexer',
    ARRAY['ethereum', 'indexer', 'data'],
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Pricing Tiers for Sui RPC
INSERT INTO pricing_tiers (service_id, tier_name, price_amount, price_token, quota_requests)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'Basic Plan',
    50,
    'SUI',
    100000
),
(
    '11111111-1111-1111-1111-111111111111',
    'Pro Plan',
    150,
    'SUI',
    500000
);

-- Insert Pricing Tiers for Ethereum Indexer
INSERT INTO pricing_tiers (service_id, tier_name, price_amount, price_token, quota_requests)
VALUES
(
    '22222222-2222-2222-2222-222222222222',
    'Starter',
    25,
    'SUI',
    10000
),
(
    '22222222-2222-2222-2222-222222222222',
    'Enterprise',
    200,
    'SUI',
    1000000
);
