# InfraMint 🚀

**Decentralized Infrastructure Service Discovery & Onchain Payments on Sui**

InfraMint is a modular, extensible platform designed to bridge the gap between infrastructure providers and developers in the Web3 ecosystem. It enables seamless service discovery, onchain payments, and cryptographic access control for infrastructure services like RPCs, Indexers, Storage, and AI Compute.

---

## 🏗 System Architecture

InfraMint is built on a modular architecture comprising three core components:

### 1. 🌐 Service Discovery Portal (`/frontend` + `/backend`)
A hybrid Web2/Web3 portal where:
- **Providers** list services, manage metadata, and track revenue.
- **Developers** browse, filter, and discover services with verified on-chain data.
- **Backend**: Rust (Axum) + PostgreSQL for high-performance metadata indexing and search.
- **Frontend**: React + Vite + TailwindCSS for a premium user experience.

### 2. 💎 Onchain Payments & Entitlements (`/contracts`)
Sui Move smart contracts that handle the economic layer:
- **Registry**: Stores service indices and pricing tiers on-chain.
- **Payments**: Accepts SUI tokens for service access.
- **Entitlements**: Issues unique **Sui Objects** (Entitlements) to buyers. These objects act as proofs-of-purchase containing quota details and expiration data.

### 3. 🛡️ Usage Tracking & Validation (`/validator`)
An off-chain sidecar/enforcement module:
- **Verification**: Validates client requests by checking the status of their on-chain Entitlement object.
- **Usage Tracking**: Tracks quota consumption in real-time.
- **Signatures**: Verifies cryptographic signatures to ensure requests are authorized by the entitlement owner.

---

## 🛠 Technology Stack

- **Blockchain**: [Sui](https://sui.io/) (Move Smart Contracts)
- **Backend / API**: Rust ([Axum](https://github.com/tokio-rs/axum)), SQLx, PostgreSQL
- **Frontend**: TypeScript, React, Vite, TailwindCSS
- **Validator**: Rust (Tonic/gRPC compatibility layer)
- **Database**: PostgreSQL
- **Tools**: Docker, Sui CLI

---

## 🚀 Getting Started

### Prerequisites
- [Rust & Cargo](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install)
- [Docker](https://www.docker.com/) (for PostgreSQL database)

### 1. Clone the Repository
```bash
git clone https://github.com/EmekaIwuagwu/inframint.git
cd inframint
```

### 2. Setup Database
Ensure you have a PostgreSQL instance running.
```bash
# Example with Docker
docker run --name inframint-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=inframint -p 5432:5432 -d postgres
```

### 3. Run Backend
```bash
cd backend
# Create a .env file based on config.rs defaults or your setup
echo "DATABASE_URL=postgres://postgres:password@localhost:5432/inframint" > .env
echo "RUST_LOG=debug" >> .env

# Run migrations and start server
cargo run
```
*Server runs on `http://localhost:8000`*

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
*UI runs on `http://localhost:5173`*

### 5. Deploy Smart Contracts
```bash
cd contracts
sui client publish --gas-budget 100000000
```
*Note the Package ID and update your environment configuration accordingly.*

### 6. Run Validator
```bash
cd validator
cargo run
```

---

## 📜 Key Features

### For Developers
- **🔍 Unified Discovery**: Find RPCs, Indexers, and more in one place.
- **⚡ Instant Access**: Pay with SUI and get instant access via on-chain entitlements. No waiting for API keys.
- **🔐 Cryptographic Security**: Access is controlled by wallet ownership, not shared secrets.

### For Providers
- **💰 Crypto-Native Revenue**: Receive payments directly in SUI/Stablecoins.
- **🏷️ Flexible Pricing**: Define tiers, quotas, and subscription models on-chain.
- **📈 Dashboard**: Real-time insights into active users and revenue.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
