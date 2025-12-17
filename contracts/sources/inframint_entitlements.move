module inframint::entitlements {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;

    // ==================== Error Codes ====================
    const E_NOT_SERVICE_OWNER: u64 = 1;
    const E_TIER_NOT_ACTIVE: u64 = 2;
    const E_SERVICE_NOT_REGISTERED: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;
    const E_ENTITLEMENT_EXPIRED: u64 = 5;
    const E_QUOTA_EXCEEDED: u64 = 6;
    const E_NOT_AUTHORIZED: u64 = 7;
    const E_ENTITLEMENT_INACTIVE: u64 = 8;

    // ==================== Structs ====================

    /// Main registry for all services and pricing
    struct ServiceRegistry has key {
        id: UID,
        services: Table<vector<u8>, ServiceInfo>,
        admin: address,
    }

    /// Information about a registered service
    struct ServiceInfo has store {
        provider: address,
        name: String,
        pricing_tiers: Table<u64, PricingTier>,
        active: bool,
    }

    /// Pricing tier configuration
    struct PricingTier has store, copy, drop {
        price_sui: u64,  // Price in MIST (1 SUI = 10^9 MIST)
        quota_requests: u64,
        validity_period_ms: u64,  // in milliseconds
        rate_limit_per_second: u32,
        active: bool,
    }

    /// Entitlement NFT - owned by the buyer
    struct Entitlement has key, store {
        id: UID,
        service_id: vector<u8>,
        buyer: address,
        tier_id: u64,
        quota_requests: u64,
        quota_used: u64,
        purchased_at: u64,
        expires_at: u64,
        active: bool,
    }

    /// Provider's revenue balance
    struct ProviderRevenue has key {
        id: UID,
        provider: address,
        balance_sui: Balance<SUI>,
    }

    /// Validator capability - allows consuming entitlements
    struct ValidatorCap has key, store {
        id: UID,
    }

    // ==================== Events ====================

    struct ServiceRegistered has copy, drop {
        service_id: vector<u8>,
        provider: address,
        name: String,
    }

    struct PricingTierAdded has copy, drop {
        service_id: vector<u8>,
        tier_id: u64,
        price_sui: u64,
    }

    struct EntitlementPurchased has copy, drop {
        entitlement_id: ID,
        service_id: vector<u8>,
        buyer: address,
        tier_id: u64,
        amount_paid: u64,
    }

    struct EntitlementConsumed has copy, drop {
        entitlement_id: ID,
        amount: u64,
        remaining: u64,
    }

    struct EntitlementDeactivated has copy, drop {
        entitlement_id: ID,
        reason: String,
    }

    struct RevenueWithdrawn has copy, drop {
        provider: address,
        amount: u64,
    }

    // ==================== Initialize ====================

    /// Initialize the service registry (called once on deployment)
    fun init(ctx: &mut TxContext) {
        let registry = ServiceRegistry {
            id: object::new(ctx),
            services: table::new(ctx),
            admin: tx_context::sender(ctx),
        };

        transfer::share_object(registry);

        // Create admin validator capability
        let validator_cap = ValidatorCap {
            id: object::new(ctx),
        };
        transfer::transfer(validator_cap, tx_context::sender(ctx));
    }

    // ==================== Provider Functions ====================

    /// Register a new service
    public entry fun register_service(
        registry: &mut ServiceRegistry,
        service_id: vector<u8>,
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        assert!(!table::contains(&registry.services, service_id), E_SERVICE_NOT_REGISTERED);

        let service_info = ServiceInfo {
            provider: sender,
            name: string::utf8(name),
            pricing_tiers: table::new(ctx),
            active: true,
        };

        table::add(&mut registry.services, service_id, service_info);

        // Create revenue account for provider
        let revenue = ProviderRevenue {
            id: object::new(ctx),
            provider: sender,
            balance_sui: balance::zero(),
        };
        transfer::share_object(revenue);

        event::emit(ServiceRegistered {
            service_id,
            provider: sender,
            name: string::utf8(name),
        });
    }

    /// Add a pricing tier to a service
    public entry fun add_pricing_tier(
        registry: &mut ServiceRegistry,
        service_id: vector<u8>,
        tier_id: u64,
        price_sui: u64,
        quota_requests: u64,
        validity_period_ms: u64,
        rate_limit_per_second: u32,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let service = table::borrow_mut(&mut registry.services, service_id);

        assert!(service.provider == sender, E_NOT_SERVICE_OWNER);

        let tier = PricingTier {
            price_sui,
            quota_requests,
            validity_period_ms,
            rate_limit_per_second,
            active: true,
        };

        table::add(&mut service.pricing_tiers, tier_id, tier);

        event::emit(PricingTierAdded {
            service_id,
            tier_id,
            price_sui,
        });
    }

    /// Update pricing tier
    public entry fun update_pricing_tier(
        registry: &mut ServiceRegistry,
        service_id: vector<u8>,
        tier_id: u64,
        new_price_sui: u64,
        is_active: bool,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let service = table::borrow_mut(&mut registry.services, service_id);

        assert!(service.provider == sender, E_NOT_SERVICE_OWNER);

        let tier = table::borrow_mut(&mut service.pricing_tiers, tier_id);
        tier.price_sui = new_price_sui;
        tier.active = is_active;
    }

    // ==================== Purchase Functions ====================

    /// Purchase an entitlement with SUI
    public entry fun purchase_entitlement(
        registry: &ServiceRegistry,
        revenue: &mut ProviderRevenue,
        service_id: vector<u8>,
        tier_id: u64,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        // Get service and tier info
        let service = table::borrow(&registry.services, service_id);
        assert!(service.active, E_SERVICE_NOT_REGISTERED);

        let tier = table::borrow(&service.pricing_tiers, tier_id);
        assert!(tier.active, E_TIER_NOT_ACTIVE);

        // Verify payment amount
        let payment_value = coin::value(&payment);
        assert!(payment_value >= tier.price_sui, E_INSUFFICIENT_PAYMENT);

        // Add payment to provider's revenue
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut revenue.balance_sui, payment_balance);

        // Create entitlement
        let current_time = clock::timestamp_ms(clock);
        let entitlement = Entitlement {
            id: object::new(ctx),
            service_id,
            buyer: sender,
            tier_id,
            quota_requests: tier.quota_requests,
            quota_used: 0,
            purchased_at: current_time,
            expires_at: current_time + tier.validity_period_ms,
            active: true,
        };

        let entitlement_id = object::uid_to_inner(&entitlement.id);

        event::emit(EntitlementPurchased {
            entitlement_id,
            service_id,
            buyer: sender,
            tier_id,
            amount_paid: payment_value,
        });

        // Transfer entitlement to buyer
        transfer::transfer(entitlement, sender);
    }

    // ==================== Validator Functions ====================

    /// Consume entitlement quota (requires ValidatorCap)
    public entry fun consume_entitlement(
        _validator_cap: &ValidatorCap,
        entitlement: &mut Entitlement,
        amount: u64,
        clock: &Clock,
    ) {
        let current_time = clock::timestamp_ms(clock);

        assert!(entitlement.active, E_ENTITLEMENT_INACTIVE);
        assert!(current_time < entitlement.expires_at, E_ENTITLEMENT_EXPIRED);
        assert!(entitlement.quota_used + amount <= entitlement.quota_requests, E_QUOTA_EXCEEDED);

        entitlement.quota_used = entitlement.quota_used + amount;

        let remaining = entitlement.quota_requests - entitlement.quota_used;

        event::emit(EntitlementConsumed {
            entitlement_id: object::uid_to_inner(&entitlement.id),
            amount,
            remaining,
        });

        // Auto-deactivate if quota exhausted
        if (remaining == 0) {
            entitlement.active = false;
            event::emit(EntitlementDeactivated {
                entitlement_id: object::uid_to_inner(&entitlement.id),
                reason: string::utf8(b"Quota exhausted"),
            });
        };
    }

    /// Verify entitlement (read-only)
    public fun verify_entitlement(
        entitlement: &Entitlement,
        clock: &Clock,
    ): (bool, u64, u64) {
        let current_time = clock::timestamp_ms(clock);

        if (!entitlement.active || current_time >= entitlement.expires_at) {
            return (false, 0, entitlement.expires_at)
        };

        let remaining = entitlement.quota_requests - entitlement.quota_used;
        (true, remaining, entitlement.expires_at)
    }

    // ==================== Revenue Functions ====================

    /// Withdraw accumulated revenue
    public entry fun withdraw_revenue(
        revenue: &mut ProviderRevenue,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(revenue.provider == sender, E_NOT_AUTHORIZED);

        let withdrawn = coin::take(&mut revenue.balance_sui, amount, ctx);

        transfer::public_transfer(withdrawn, sender);

        event::emit(RevenueWithdrawn {
            provider: sender,
            amount,
        });
    }

    /// Check revenue balance
    public fun check_revenue(revenue: &ProviderRevenue): u64 {
        balance::value(&revenue.balance_sui)
    }

    // ==================== View Functions ====================

    public fun get_entitlement_info(entitlement: &Entitlement): (
        vector<u8>,  // service_id
        address,     // buyer
        u64,         // tier_id
        u64,         // quota_requests
        u64,         // quota_used
        u64,         // expires_at
        bool         // active
    ) {
        (
            entitlement.service_id,
            entitlement.buyer,
            entitlement.tier_id,
            entitlement.quota_requests,
            entitlement.quota_used,
            entitlement.expires_at,
            entitlement.active
        )
    }

    public fun get_tier_info(
        registry: &ServiceRegistry,
        service_id: vector<u8>,
        tier_id: u64,
    ): (u64, u64, u64, u32, bool) {
        let service = table::borrow(&registry.services, service_id);
        let tier = table::borrow(&service.pricing_tiers, tier_id);

        (
            tier.price_sui,
            tier.quota_requests,
            tier.validity_period_ms,
            tier.rate_limit_per_second,
            tier.active
        )
    }

    // ==================== Admin Functions ====================

    /// Grant validator capability to an address
    public entry fun grant_validator_cap(
        registry: &ServiceRegistry,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == registry.admin, E_NOT_AUTHORIZED);

        let validator_cap = ValidatorCap {
            id: object::new(ctx),
        };
        transfer::transfer(validator_cap, recipient);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
