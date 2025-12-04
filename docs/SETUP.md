# TradeGPT Setup Guide

This guide will walk you through setting up TradeGPT from scratch for both development and production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Smart Contracts Setup](#smart-contracts-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Testing the Application](#testing-the-application)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```
   Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   ```bash
   npm --version  # Should be 8.0.0 or higher
   ```

3. **Git**
   ```bash
   git --version
   ```
   Download from: https://git-scm.com/

4. **A Code Editor** (VS Code recommended)
   - Download: https://code.visualstudio.com/

### Required Accounts & Keys

1. **Somnia Network Wallet**
   - Install MetaMask: https://metamask.io/
   - Add Somnia Testnet network configuration
   - Get testnet STT tokens from faucet

2. **Google Gemini API Key**
   - Go to: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Save it securely

3. **WalletConnect Project ID** (optional but recommended)
   - Go to: https://cloud.walletconnect.com/
   - Create a new project
   - Copy your Project ID

## Development Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd SOMNIADEV
```

### 2. Project Structure

After cloning, you should see:
```
SOMNIADEV/
├── contracts/    # Smart contracts
├── backend/      # Backend API server
├── frontend/     # React frontend
└── docs/         # Documentation
```

## Smart Contracts Setup

### 1. Navigate to Contracts Directory

```bash
cd contracts
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Hardhat (Ethereum development environment)
- OpenZeppelin contracts
- Ethers.js
- TypeChain (TypeScript bindings)

### 3. Configure Environment Variables

Create a `.env` file in the `contracts` directory:

```bash
# contracts/.env
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
PRIVATE_KEY=your_private_key_here_without_0x
```

**Important:**
- Never commit your `.env` file to Git
- Keep your private key secure
- Use a testnet wallet, not your main wallet

### 4. Get Your Private Key from MetaMask

1. Open MetaMask
2. Click the three dots menu
3. Select "Account details"
4. Click "Export Private Key"
5. Enter your password
6. Copy the private key (remove the 0x prefix)

### 5. Add Somnia Testnet to MetaMask

Network Configuration:
```
Network Name: Somnia Testnet
RPC URL: https://dream-rpc.somnia.network
Chain ID: 50312
Currency Symbol: STT
Block Explorer: https://shannon-explorer.somnia.network
```

### 6. Get Testnet Tokens

Request STT tokens from the Somnia testnet faucet to pay for gas.

### 7. Compile Contracts

```bash
npx hardhat compile
```

This generates:
- Contract artifacts in `artifacts/`
- TypeScript types in `typechain-types/`

### 8. Deploy Contracts

Deploy all contracts to Somnia testnet:

```bash
npx hardhat run scripts/deployAll.ts --network somniaTestnet
```

**Expected Output:**
```
🚀 Deploying TradeGPT Contracts to Somnia Testnet

📦 Deploying Test Tokens...
✅ USDC deployed to: 0x...
✅ WETH deployed to: 0x...
✅ WBTC deployed to: 0x...
✅ WSOL deployed to: 0x...

🏭 Deploying Factory Contract...
✅ Factory deployed to: 0x...

🌐 Deploying MockDexRouter...
✅ MockDexRouter deployed to: 0x...

💰 Funding MockDexRouter with tokens...
✅ Router funded successfully

📋 Deployment Summary:
Factory: 0x...
Router: 0x...
USDC: 0x...
WETH: 0x...
WBTC: 0x...
WSOL: 0x...
```

**Save these addresses!** You'll need them for backend and frontend configuration.

### 9. Verify Deployment (Optional)

```bash
# Test token faucet
npx hardhat run scripts/useFaucet.ts --network somniaTestnet

# Create a smart account
npx hardhat run scripts/createAccount.ts --network somniaTestnet
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd ../backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Express (web framework)
- Google Generative AI SDK
- SQLite (database)
- Socket.io (WebSockets)
- TypeScript and type definitions

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# backend/.env

# Server Configuration
PORT=4000

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Somnia Network
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SOMNIA_CHAIN_ID=50312

# Contract Addresses (from deployment)
SOMNIA_FACTORY_ADDRESS=0xYourFactoryAddress
SOMNIA_ROUTER_ADDRESS=0xYourRouterAddress
SOMNIA_DEX_ROUTER_V2=0xYourMockDexAddress

# Token Addresses (from deployment)
SOMNIA_USDC_ADDRESS=0xYourUSDCAddress
SOMNIA_ETH_ADDRESS=0xYourWETHAddress
SOMNIA_BTC_ADDRESS=0xYourWBTCAddress
SOMNIA_SOL_ADDRESS=0xYourWSOLAddress

# Database
DATABASE_PATH=./trades.db
```

**Replace all contract addresses with the ones from your deployment!**

### 4. Initialize Database

The database will be automatically created when you start the server for the first time.

To manually initialize:

```bash
npm run build
node dist/index.js
```

This creates `trades.db` with the required tables.

### 5. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
🚀 TradeGPT Backend Server
📊 Database initialized
✅ Server running on port 4000
🔌 WebSocket server ready
```

### 6. Test Backend Health

Open a browser or use curl:

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React and React DOM
- Vite (build tool)
- wagmi and viem (Web3 libraries)
- RainbowKit (wallet UI)
- Material-UI (components)
- TypeScript

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# frontend/.env

# Backend API
VITE_BACKEND_URL=http://localhost:4000/api

# Somnia Network
VITE_SOMNIA_RPC=https://dream-rpc.somnia.network
VITE_SOMNIA_CHAIN_ID=50312
VITE_SOMNIA_EXPLORER=https://shannon-explorer.somnia.network

# WalletConnect
VITE_WALLETCONNECT_ID=your_walletconnect_project_id

# Contract Addresses (from deployment)
VITE_FACTORY_ADDRESS=0xYourFactoryAddress
VITE_ROUTER_ADDRESS=0xYourRouterAddress

# Token Addresses (from deployment)
VITE_USDC_ADDRESS=0xYourUSDCAddress
VITE_WETH_ADDRESS=0xYourWETHAddress
VITE_WBTC_ADDRESS=0xYourWBTCAddress
VITE_WSOL_ADDRESS=0xYourWSOLAddress
```

**Important:** All Vite environment variables must start with `VITE_`

### 4. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

### 5. Access the Application

Open your browser and navigate to: `http://localhost:5173`

## Testing the Application

### 1. Connect Your Wallet

1. Click "Connect Wallet" in the top right
2. Select MetaMask (or your preferred wallet)
3. Approve the connection
4. Ensure you're on Somnia Testnet

### 2. Create Smart Account

1. You'll see a setup screen on first visit
2. Click "Create Smart Account"
3. Approve the transaction in MetaMask
4. Wait for confirmation
5. Your smart account address will be displayed

### 3. Get Test Tokens

1. Navigate to "Faucet" tab
2. Click "Get All Tokens" or select individual tokens
3. Approve transactions in MetaMask
4. Tokens will appear in your wallet

### 4. Deposit to Smart Account

1. Go to "Analytics" tab
2. Under "Fund Management", enter amount to deposit
3. Select token (e.g., USDC)
4. Click "Deposit"
5. Approve transaction in MetaMask
6. Balance will update in "Trading Account" column

### 5. Approve Router

1. In "Fund Management" section
2. Click "Approve Router for Trading"
3. Approve transaction in MetaMask
4. This allows the router to execute trades

### 6. Test AI Trading

1. Go to "Trade" tab
2. In the chat, type: "I want to long BTC with 100 USDC"
3. AI will analyze and suggest a trade
4. Trade parameters appear in the right panel
5. Adjust if needed (leverage, stop-loss, etc.)
6. Click "Execute Trade"
7. Approve transaction in MetaMask
8. Watch trade appear in history

### 7. Check Portfolio

1. Go to "History" tab to see all trades
2. Go to "Analytics" tab for performance metrics

## Production Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set environment variables in Vercel dashboard**

### Backend Deployment (Railway/Render/AWS)

1. **Build the backend:**
   ```bash
   cd backend
   npm run build
   ```

2. **Deploy to Railway:**
   - Connect your GitHub repository
   - Set environment variables
   - Deploy from main branch

3. **Database considerations:**
   - For production, migrate from SQLite to PostgreSQL
   - Use a managed database service
   - Set up regular backups

### Smart Contract Deployment (Mainnet)

⚠️ **Before mainnet deployment:**
- Conduct thorough testing
- Get smart contracts audited
- Test with small amounts first
- Have emergency procedures ready

## Environment Configuration Summary

### Development
```
Contracts: Somnia Testnet
Backend: localhost:4000
Frontend: localhost:5173
Database: SQLite (local file)
```

### Production
```
Contracts: Somnia Mainnet
Backend: Your production URL (HTTPS)
Frontend: Your production URL (HTTPS)
Database: PostgreSQL (managed service)
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
# Reinstall
npm install
```

#### 2. Contract deployment fails

**Possible causes:**
- Insufficient STT for gas
- Wrong network selected
- Invalid private key

**Solution:**
```bash
# Check balance
npx hardhat run scripts/checkBalance.ts --network somniaTestnet

# Verify network in hardhat.config.ts
# Get more testnet STT from faucet
```

#### 3. Backend won't start

**Check:**
- Is port 4000 already in use?
- Are all environment variables set?
- Is the Gemini API key valid?

**Solution:**
```bash
# Check what's using port 4000
netstat -ano | findstr :4000  # Windows
lsof -i :4000  # Mac/Linux

# Kill the process or use a different port
```

#### 4. Frontend can't connect to backend

**Check:**
- Is backend running?
- Is VITE_BACKEND_URL correct?
- CORS enabled on backend?

**Solution:**
```bash
# Test backend directly
curl http://localhost:4000/api/health

# Check VITE_BACKEND_URL in frontend/.env
# Restart frontend dev server
```

#### 5. "Smart account not found"

**Solution:**
- Clear browser cache
- Try incognito mode
- Re-create smart account
- Check factory address in .env

#### 6. Transactions failing with "execution reverted"

**Common causes:**
- Insufficient token balance
- Router not approved
- Wrong contract address

**Solution:**
```bash
# Check token balances
# Re-approve router
# Verify contract addresses in .env files
```

### Getting Help

If you encounter issues:

1. Check the error message carefully
2. Look in browser console (F12)
3. Check backend logs
4. Review this documentation
5. Search existing GitHub issues
6. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

## Next Steps

After successful setup:

1. Read the [User Guide](./USER_GUIDE.md)
2. Explore the [API Documentation](./API.md)
3. Review [Smart Contracts](./SMART_CONTRACTS.md)
4. Check [Architecture](./ARCHITECTURE.md)

## Development Workflow

Typical development process:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Contract changes
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy... --network somniaTestnet
```

## Updating After Code Changes

### Smart Contract Changes
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deployAll.ts --network somniaTestnet
# Update contract addresses in backend/.env and frontend/.env
# Restart backend and frontend servers
```

### Backend Changes
```bash
cd backend
# TypeScript compiles automatically in dev mode
# Just save your files
```

### Frontend Changes
```bash
cd frontend
# Vite hot-reloads automatically
# Just save your files
```

## Best Practices

1. **Never commit .env files**
2. **Use separate wallets for testnet/mainnet**
3. **Keep private keys secure**
4. **Test thoroughly before mainnet**
5. **Monitor gas prices**
6. **Keep dependencies updated**
7. **Review security regularly**
8. **Backup database regularly**

## Additional Resources

- Somnia Documentation: https://docs.somnia.network
- Hardhat Documentation: https://hardhat.org/docs
- wagmi Documentation: https://wagmi.sh
- React Documentation: https://react.dev
- Gemini AI Documentation: https://ai.google.dev/docs
