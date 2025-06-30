# Cross-Credit: Cross-Chain Lending Platform

A decentralized lending platform that enables users to lend, borrow, and manage positions across multiple blockchain networks using smart contracts and cross-chain messaging.

## 🏗️ Architecture Overview

This is a Next.js-based frontend application that interacts with cross-chain lending smart contracts deployed on Ethereum Sepolia and Avalanche Fuji testnets. The platform leverages Chainlink CCIP (Cross-Chain Interoperability Protocol) for cross-chain communication and Chainlink Price Feeds for real-time asset pricing.

## 🚀 Key Features

- **Cross-Chain Lending**: Lend assets on one chain and access them on another
- **Borrowing with Collateral**: Borrow against supplied collateral with LTV (Loan-to-Value) ratios
- **Position Management**: View and manage supplied/borrowed positions across chains
- **Real-time Pricing**: Integration with Chainlink Price Feeds for accurate asset valuation
- **Wallet Integration**: Seamless wallet connection via RainbowKit
- **Multi-Chain Support**: Currently supports Ethereum Sepolia and Avalanche Fuji

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main application page
│   │   └── providers.tsx      # Web3 providers setup
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── LendForm.tsx      # Lending functionality
│   │   ├── BorrowForm.tsx    # Borrowing functionality
│   │   ├── RepayForm.tsx     # Repayment functionality
│   │   ├── UnlendForm.tsx    # Withdrawal functionality
│   │   ├── LiquidationForm.tsx # Liquidation interface
│   │   ├── LendBorrowTabs.tsx # Tab navigation
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── ChainStatus.tsx   # Chain information display
│   │   ├── AssetInfo.tsx     # Asset details and metadata
│   │   ├── CrossChainInfo.tsx # Cross-chain status
│   │   └── RecentTransactions.tsx # Transaction history
│   ├── const/                # Constants and ABIs
│   │   ├── abi.ts           # Main lending contract ABI
│   │   └── erc20Abi.ts      # ERC20 token ABI
│   ├── lib/                 # Utility functions and hooks
│   │   ├── utils.ts         # Core utilities and configurations
│   │   └── useTokenPrices.ts # Token price fetching hook
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types and enums
│   └── rainbowKitConfig.tsx # RainbowKit configuration
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## 🔧 Technology Stack

- **Frontend Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Web3 Integration**: 
  - Wagmi v2 for Ethereum interactions
  - RainbowKit for wallet connection
  - Viem for blockchain utilities
- **State Management**: React Query (TanStack Query)
- **Notifications**: Sonner for toast notifications
- **Type Safety**: TypeScript throughout

## 🏦 Smart Contract Integration

### Core Contract Functions

The application interacts with a comprehensive lending smart contract that includes:

#### Lending Operations
- `lend(amount, asset)`: Supply assets to the lending pool
- `unlend(amount, asset)`: Withdraw supplied assets
- `getUserPositionForAssetByType(asset, user, positionType)`: Get user positions

#### Borrowing Operations
- `borrow(amount, asset)`: Borrow assets against collateral
- `repay(amount, asset)`: Repay borrowed assets
- `liquidate(amount, assetPaidByLiquidator, borrower)`: Liquidate undercollateralized positions

#### Cross-Chain Features
- `ccipReceive(message)`: Handle incoming cross-chain messages
- `getLatestMessageDetails()`: Get latest cross-chain message info
- `getAssetDecimalsOnDest(asset)`: Get asset decimals on destination chain
- `isAssetWhitelisted(asset)`: Check if asset is supported

#### Configuration
- `getRouter()`: Get CCIP router address
- `s_connectedChainID()`: Get connected chain ID
- `i_nativeAssetAddress()`: Get native asset address

### Position Types

```typescript
enum PositionType {
  Supplied = 0,  // User's supplied/lent assets
  Borrowed = 1   // User's borrowed assets
}
```

## 🔄 Application Workflow

### 1. Wallet Connection & Network Setup
- Users connect their wallet via RainbowKit
- Application detects current network and prompts for correct network if needed
- Supports switching between Sepolia and Avalanche Fuji

### 2. Asset Selection & Validation
- Users select from available tokens (ETH, LINK, AVAX) based on current network
- System validates token addresses and whitelist status
- Real-time price fetching via Chainlink Price Feeds

### 3. Lending Process
```mermaid
graph TD
    A[User Inputs Amount] --> B[Check Wallet Connection]
    B --> C[Validate Network]
    C --> D[Check Token Allowance]
    D --> E[Approve Token if Needed]
    E --> F[Call lend() Function]
    F --> G[Update Position Display]
```

### 4. Borrowing Process
```mermaid
graph TD
    A[User Selects Collateral] --> B[Calculate Max Borrowable]
    B --> C[User Inputs Borrow Amount]
    C --> D[Validate LTV Ratio]
    D --> E[Call borrow() Function]
    E --> F[Update Position Display]
```

### 5. Cross-Chain Operations
- Position data is synchronized across chains via CCIP
- Asset decimals are handled per chain
- Cross-chain asset mappings are maintained

## 🎯 Key Components

### LendForm
- Handles asset supply to lending pool
- Automatic token approval for ERC20 tokens
- Native token (ETH) support with value parameter
- Real-time balance updates and USD value display

### BorrowForm
- Collateral-based borrowing with LTV calculations
- Dynamic max borrowable amount calculation
- Interest rate display and repayment preview

### RepayForm
- Borrowed asset repayment functionality
- Automatic token approval handling
- Balance validation and transaction confirmation

### UnlendForm
- Withdrawal of supplied assets
- Balance checking and amount validation
- Cross-chain position synchronization

### ChainStatus & AssetInfo
- Real-time chain and asset information display
- Cross-chain support status
- Asset metadata and whitelist status

## 🔐 Security Features

- **Allowance Management**: Automatic ERC20 token approval with proper validation
- **Input Validation**: Comprehensive amount and address validation
- **Error Handling**: Detailed error messages for different failure scenarios
- **Network Validation**: Ensures transactions are sent to correct networks
- **Balance Checks**: Validates user balances before transactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun (recommended) or npm
- MetaMask or compatible Web3 wallet
- Testnet ETH and AVAX for gas fees

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your WalletConnect Project ID to .env.local

# Start development server
bun dev
```

### Environment Variables
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Supported Networks
- **Ethereum Sepolia** (Chain ID: 11155111)
- **Avalanche Fuji** (Chain ID: 43113)

### Supported Tokens
- **ETH**: Native token on both networks
- **LINK**: Chainlink token with cross-chain support
- **AVAX**: Native to Avalanche, available on Fuji testnet

## 🔧 Configuration

### Contract Addresses
Contract addresses are configured in `src/lib/utils.ts`:
```typescript
export const DEPLOYED_CONTRACTS = {
  CROSS_CREDIT_SEPOLIA: "0x...",
  CROSS_CREDIT_AVALANCHE_FUJI: "0x...",
  // ... other addresses
}
```

### Price Feeds
Chainlink Price Feed addresses are configured for real-time pricing:
```typescript
export const PRICE_FEEDS = {
  ETH_SEPOLIA_ETH_PRICE_FEED: "0x...",
  AVALANCHE_FUJI_AVAX_PRICE_FEED: "0x...",
  // ... other feeds
}
```

## 🧪 Testing

The application includes comprehensive error handling and validation:
- Wallet connection states
- Network validation
- Transaction confirmation
- Balance and allowance checks
- Cross-chain status verification

## 🔮 Future Enhancements

- **Additional Networks**: Support for more blockchain networks
- **Advanced Analytics**: Portfolio tracking and performance metrics
- **Mobile Support**: Responsive design for mobile devices
- **Transaction History**: Persistent transaction tracking
- **Advanced Liquidation**: Automated liquidation detection and execution
- **Governance**: DAO governance for protocol parameters

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## ⚠️ Disclaimer

This is a testnet application for educational and development purposes. Do not use with real assets or mainnet networks without proper security audits and testing.
