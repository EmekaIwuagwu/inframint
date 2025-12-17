use serde::{Deserialize, Serialize};
use std::sync::Arc;
use ethers::providers::{Provider, Http};
use ethers::types::{Address, U256};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Entitlement {
    pub id: String,
    pub service_id: String,
    pub buyer: String,
    pub tier_id: u64,
    pub quota_requests: u64,
    pub quota_used: u64,
    pub purchased_at: u64,
    pub expires_at: u64,
    pub active: bool,
}

#[derive(Error, Debug)]
pub enum BlockchainError {
    #[error("Provider error: {0}")]
    ProviderError(String),

    #[error("Contract call failed: {0}")]
    ContractCallError(String),

    #[error("Invalid response format")]
    InvalidResponseFormat,

    #[error("Entitlement not found")]
    EntitlementNotFound,
}

pub struct SuiBlockchainClient {
    provider: Arc<Provider<Http>>,
    contract_address: Address,
}

impl SuiBlockchainClient {
    pub fn new(rpc_url: &str, contract_address: &str) -> Result<Self, BlockchainError> {
        let provider = Provider::<Http>::try_from(rpc_url)
            .map_err(|e| BlockchainError::ProviderError(e.to_string()))?;

        let contract_address = contract_address.parse::<Address>()
            .map_err(|e| BlockchainError::ProviderError(e.to_string()))?;

        Ok(Self {
            provider: Arc::new(provider),
            contract_address,
        })
    }

    pub async fn get_entitlement(&self, entitlement_id: &str) -> Result<Entitlement, BlockchainError> {
        // Convert entitlement_id to proper format for Sui
        let entitlement_address = entitlement_id.parse::<Address>()
            .map_err(|_| BlockchainError::EntitlementNotFound)?;

        // Call Sui JSON-RPC to get the entitlement object
        let response = self.provider.get_storage_at(
            self.contract_address,
            U256::from(entitlement_address),
            None
        ).await
        .map_err(|e| BlockchainError::ContractCallError(e.to_string()))?;

        // Parse the response into Entitlement struct
        let entitlement_data = serde_json::from_value(response)
            .map_err(|_| BlockchainError::InvalidResponseFormat)?;

        Ok(entitlement_data)
    }

    pub async fn consume_entitlement(&self, entitlement_id: &str, amount: u64) -> Result<(), BlockchainError> {
        // Prepare transaction data
        let tx_data = serde_json::json!({
            "method": "consume_entitlement",
            "params": {
                "entitlement_id": entitlement_id,
                "amount": amount
            }
        });

        // Send transaction to Sui network
        let tx_hash = self.provider.send_transaction(tx_data)
            .await
            .map_err(|e| BlockchainError::ContractCallError(e.to_string()))?;

        // Wait for transaction confirmation
        let receipt = self.provider.get_transaction_receipt(tx_hash)
            .await
            .map_err(|e| BlockchainError::ContractCallError(e.to_string()))?;

        if !receipt.status.is_success() {
            return Err(BlockchainError::ContractCallError(
                receipt.status.error_message().unwrap_or("Transaction failed").to_string()
            ));
        }

        Ok(())
    }

    pub async fn validate_entitlement_signature(
        &self,
        entitlement_id: &str,
        signature: &str,
        message: &str
    ) -> Result<bool, BlockchainError> {
        // Verify the signature against the entitlement owner's address
        let entitlement = self.get_entitlement(entitlement_id).await?;
        let owner_address = entitlement.buyer.parse::<Address>()
            .map_err(|_| BlockchainError::InvalidResponseFormat)?;

        // Use ethers-rs to verify the signature
        let recovered_address = ethers::utils::verify_message(message, signature)
            .map_err(|e| BlockchainError::ContractCallError(e.to_string()))?;

        Ok(recovered_address == owner_address)
    }
}
