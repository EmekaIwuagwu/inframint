use tonic::transport::Channel;
use std::error::Error;
use std::time::Duration;
use tonic::Request;
use tracing::{info, error, debug};

mod proto {
    tonic::include_proto!("validator");
}

use proto::{
    validator_service_client::ValidatorServiceClient,
    ValidateEntitlementRequest, ValidateEntitlementResponse,
    ConsumeEntitlementRequest, ConsumeEntitlementResponse,
    ValidateSignatureRequest, ValidateSignatureResponse,
};

#[derive(Clone)]
pub struct ValidatorClient {
    client: ValidatorServiceClient<Channel>,
}

impl ValidatorClient {
    pub async fn new(validator_url: &str) -> Result<Self, Box<dyn Error>> {
        info!("🔗 Connecting to validator service at {}", validator_url);

        let channel = Channel::from_shared(validator_url.to_string())
            .timeout(Duration::from_secs(5))
            .connect()
            .await?;

        Ok(Self {
            client: ValidatorServiceClient::new(channel),
        })
    }

    pub async fn validate_entitlement(
        &self,
        entitlement_id: &str,
        signature: &str,
        message: &str,
    ) -> Result<bool, Box<dyn Error>> {
        debug!("Validating entitlement: {}", entitlement_id);

        let request = Request::new(ValidateEntitlementRequest {
            entitlement_id: entitlement_id.to_string(),
            signature: signature.to_string(),
            message: message.to_string(),
        });

        let mut client = self.client.clone();
        let response = client.validate_entitlement(request).await?;

        Ok(response.into_inner().valid)
    }

    pub async fn consume_entitlement(
        &self,
        entitlement_id: &str,
        amount: u64,
        signature: &str,
        message: &str,
    ) -> Result<u64, Box<dyn Error>> {
        debug!("Consuming {} from entitlement: {}", amount, entitlement_id);

        let request = Request::new(ConsumeEntitlementRequest {
            entitlement_id: entitlement_id.to_string(),
            amount,
            signature: signature.to_string(),
            message: message.to_string(),
        });

        let mut client = self.client.clone();
        let response = client.consume_entitlement(request).await?;

        let result = response.into_inner();
        if !result.success {
            return Err(format!("Failed to consume entitlement: {}", result.error).into());
        }

        Ok(result.remaining_quota)
    }

    pub async fn validate_signature(
        &self,
        entitlement_id: &str,
        signature: &str,
        message: &str,
    ) -> Result<bool, Box<dyn Error>> {
        debug!("Validating signature for entitlement: {}", entitlement_id);

        let request = Request::new(ValidateSignatureRequest {
            entitlement_id: entitlement_id.to_string(),
            signature: signature.to_string(),
            message: message.to_string(),
        });

        let mut client = self.client.clone();
        let response = client.validate_signature(request).await?;

        Ok(response.into_inner().valid)
    }
}
