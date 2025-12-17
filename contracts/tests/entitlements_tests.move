#[test_only]
module inframint::entitlements_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use inframint::entitlements::{Self, ServiceRegistry, Entitlement, ProviderRevenue, ValidatorCap};
    use std::vector;

    const ADMIN: address = @0xAD;
    const PROVIDER: address = @0xB0B;
    const BUYER: address = @0xCA7;
    const VALIDATOR: address = @0xDA7A;

    const SERVICE_ID: vector<u8> = b"test-service-1";
    const TIER_ID: u64 = 1;
    const PRICE: u64 = 100_000_000; // 0.1 SUI
    const QUOTA: u64 = 1000;
    const VALIDITY: u64 = 2_592_000_000; // 30 days in ms

    #[test]
    fun test_service_registration() {
        let scenario = ts::begin(ADMIN);
        {
            entitlements::init_for_testing(ts::ctx(&mut scenario));
        };

        // Provider registers service
        ts::next_tx(&mut scenario, PROVIDER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::register_service(
                &mut registry,
                SERVICE_ID,
                b"Test Service",
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_add_pricing_tier() {
        let scenario = ts::begin(ADMIN);
        {
            entitlements::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, PROVIDER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::register_service(
                &mut registry,
                SERVICE_ID,
                b"Test Service",
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, PROVIDER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::add_pricing_tier(
                &mut registry,
                SERVICE_ID,
                TIER_ID,
                PRICE,
                QUOTA,
                VALIDITY,
                10, // rate limit
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_purchase_entitlement() {
        let scenario = setup_service();

        // Buyer purchases entitlement
        ts::next_tx(&mut scenario, BUYER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            let revenue = ts::take_shared<ProviderRevenue>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            let payment = coin::mint_for_testing<SUI>(PRICE, ts::ctx(&mut scenario));

            entitlements::purchase_entitlement(
                &registry,
                &mut revenue,
                SERVICE_ID,
                TIER_ID,
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            ts::return_shared(registry);
            ts::return_shared(revenue);
        };

        // Verify entitlement was transferred to buyer
        ts::next_tx(&mut scenario, BUYER);
        {
            assert!(ts::has_most_recent_for_address<Entitlement>(BUYER), 0);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_consume_entitlement() {
        let scenario = setup_and_purchase();

        // Validator consumes quota
        ts::next_tx(&mut scenario, VALIDATOR);
        {
            let entitlement = ts::take_from_address<Entitlement>(&scenario, BUYER);
            let validator_cap = ts::take_from_address<ValidatorCap>(&scenario, VALIDATOR);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            entitlements::consume_entitlement(
                &validator_cap,
                &mut entitlement,
                100,
                &clock
            );

            let (_, _, _, quota_requests, quota_used, _, active) =
                entitlements::get_entitlement_info(&entitlement);

            assert!(quota_used == 100, 0);
            assert!(quota_requests == QUOTA, 1);
            assert!(active == true, 2);

            clock::destroy_for_testing(clock);
            ts::return_to_address(BUYER, entitlement);
            ts::return_to_address(VALIDATOR, validator_cap);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = entitlements::E_QUOTA_EXCEEDED)]
    fun test_quota_exceeded() {
        let scenario = setup_and_purchase();

        ts::next_tx(&mut scenario, VALIDATOR);
        {
            let entitlement = ts::take_from_address<Entitlement>(&scenario, BUYER);
            let validator_cap = ts::take_from_address<ValidatorCap>(&scenario, VALIDATOR);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            // Try to consume more than quota
            entitlements::consume_entitlement(
                &validator_cap,
                &mut entitlement,
                QUOTA + 1,
                &clock
            );

            clock::destroy_for_testing(clock);
            ts::return_to_address(BUYER, entitlement);
            ts::return_to_address(VALIDATOR, validator_cap);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_withdraw_revenue() {
        let scenario = setup_and_purchase();

        // Provider withdraws revenue
        ts::next_tx(&mut scenario, PROVIDER);
        {
            let revenue = ts::take_shared<ProviderRevenue>(&scenario);

            let balance = entitlements::check_revenue(&revenue);
            assert!(balance == PRICE, 0);

            entitlements::withdraw_revenue(
                &mut revenue,
                PRICE,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(revenue);
        };

        // Verify provider received coins
        ts::next_tx(&mut scenario, PROVIDER);
        {
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, PROVIDER);
            assert!(coin::value(&coin) == PRICE, 0);
            ts::return_to_address(PROVIDER, coin);
        };

        ts::end(scenario);
    }

    // Helper functions
    fun setup_service(): Scenario {
        let scenario = ts::begin(ADMIN);
        {
            entitlements::init_for_testing(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, PROVIDER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::register_service(
                &mut registry,
                SERVICE_ID,
                b"Test Service",
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, PROVIDER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::add_pricing_tier(
                &mut registry,
                SERVICE_ID,
                TIER_ID,
                PRICE,
                QUOTA,
                VALIDITY,
                10,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // Grant validator capability
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            entitlements::grant_validator_cap(
                &registry,
                VALIDATOR,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        scenario
    }

    fun setup_and_purchase(): Scenario {
        let scenario = setup_service();

        ts::next_tx(&mut scenario, BUYER);
        {
            let registry = ts::take_shared<ServiceRegistry>(&scenario);
            let revenue = ts::take_shared<ProviderRevenue>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            let payment = coin::mint_for_testing<SUI>(PRICE, ts::ctx(&mut scenario));

            entitlements::purchase_entitlement(
                &registry,
                &mut revenue,
                SERVICE_ID,
                TIER_ID,
                payment,
                &clock,
                ts::ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            ts::return_shared(registry);
            ts::return_shared(revenue);
        };

        scenario
    }
}
