# TradeGPT Architecture

## System Overview

TradeGPT is built as a three-tier architecture consisting of smart contracts, backend services, and a frontend application. The system enables AI-powered trading through secure, user-controlled smart accounts.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │   Chat    │  │   Trade   │  │Portfolio │  │ Wallet   │ │
│  │ Interface │  │ Composer  │  │Analytics │  │ Connect  │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘ │
│        │              │               │             │        │
└────────┼──────────────┼───────────────┼─────────────┼────────┘
         │              │               │             │
    ┌────▼──────────────▼───────────────▼─────────────▼────┐
    │                   API Layer                           │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
    │  │   Chat   │  │  Trades  │  │   Market Data    │   │
    │  │   API    │  │   API    │  │      API         │   │
    │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
    └───────┼─────────────┼─────────────────┼──────────────┘
            │             │                 │
    ┌───────▼─────────────▼─────────────────▼──────────────┐
    │                  Backend Services                      │
    │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
    │  │ Gemini   │  │  Trade   │  │   WebSocket        │ │
    │  │   AI     │  │ Manager  │  │   Server           │ │
    │  └────┬─────┘  └────┬─────┘  └──────────┬─────────┘ │
    └───────┼─────────────┼───────────────────┼────────────┘
            │             │                   │
            └─────────────┼───────────────────┘
                          │
    ┌─────────────────────▼──────────────────────────┐
    │              Blockchain Layer                   │
    │  ┌──────────────┐  ┌─────────────────────────┐│
    │  │   Factory    │  │    Smart Accounts      ││
    │  │   Contract   ├─→│  (User Controlled)      ││
    │  └──────────────┘  └───────────┬─────────────┘│
    │                                 │              │
    │  ┌──────────────┐  ┌───────────▼────────────┐ │
    │  │  MockDEX     │◄─┤   DEX Router           │ │
    │  │  (Liquidity) │  │   (Swap Executor)      │ │
    │  └──────────────┘  └────────────────────────┘ │
    │                                                 │
    │  ┌──────────────────────────────────────────┐ │
    │  │   ERC20 Tokens (USDC, WETH, WBTC, WSOL) │ │
    │  └──────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Layer

#### Technology Stack
- **React 18**: Component-based UI framework
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript Ethereum library
- **RainbowKit**: Wallet connection UI
- **Material-UI**: React component library

#### Key Components

**ChatWindow** (`src/components/ChatWindow.tsx`)
- Natural language interface for AI trading assistant
- Message history with user/assistant roles
- Markdown rendering for formatted responses
- Real-time message streaming

**TradeComposer** (`src/components/TradeComposer.tsx`)
- Trade parameter editor (collateral, leverage, SL/TP)
- Real-time trade preview
- One-click trade execution
- Smart account integration

**FundManagement** (`src/components/FundManagement.tsx`)
- Token deposit/withdrawal interface
- Balance tracking (EOA and smart account)
- Router approval management
- Multi-token support

**Portfolio** (`src/components/Portfolio.tsx`)
- Trade history table
- Real-time trade status updates
- Filter and search capabilities

**PortfolioAnalytics** (`src/components/PortfolioAnalytics.tsx`)
- Performance metrics (PnL, win rate, ROI)
- Visual charts and graphs
- Trade statistics

#### State Management
- React hooks for local state (`useState`, `useEffect`)
- wagmi hooks for blockchain state
- WebSocket for real-time updates
- LocalStorage for user preferences

### 2. Backend Layer

#### Technology Stack
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Google Generative AI**: Gemini 1.5 Pro
- **SQLite**: Embedded database
- **Socket.io**: WebSocket library
- **viem**: Ethereum interactions

#### Services

**AI Service** (`src/services/ai.ts`)
- Gemini AI integration
- Market analysis and trade suggestions
- Conversational context management
- Structured JSON output for trades

**Trade Service** (`src/services/trades.ts`)
- Trade state management
- Database persistence
- Transaction preparation
- Trade execution coordination

**Market Data Service** (`src/services/marketData.ts`)
- Real-time price fetching
- Market analysis aggregation
- Multi-source data integration

**Transaction Service** (`src/services/transactions.ts`)
- Smart contract interaction
- Transaction encoding
- Gas estimation
- Event monitoring

#### API Endpoints

**Chat API** (`/api/chat`)
- `POST /api/chat/message`: Send message to AI
- Response includes AI reply and optional trade suggestion

**Trades API** (`/api/trades`)
- `GET /api/trades/:userId`: Fetch user's trades
- `POST /api/trades/stage`: Prepare trade transaction
- `PATCH /api/trades/:id`: Update trade parameters
- `DELETE /api/trades/:id`: Cancel pending trade

**Health API** (`/api/health`)
- `GET /api/health`: Server health check

#### Database Schema

**trades table**
```sql
CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  collateral REAL NOT NULL,
  leverage REAL NOT NULL,
  entryPrice REAL NOT NULL,
  stopLoss REAL,
  takeProfit REAL,
  status TEXT NOT NULL,
  transactionHash TEXT,
  preparedTx TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

**messages table**
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
```

### 3. Smart Contract Layer

#### Contract Architecture

**SomniaTradeFactory** (`contracts/SomniaTradeFactory.sol`)
- Deploys new smart accounts using CREATE2
- Tracks accounts by owner address
- Deterministic address generation
- Event emission for account creation

**SomniaTradeAccount** (`contracts/SomniaTradeAccount.sol`)
- User-controlled trading account
- Delegate execution for AI agents
- Token management (deposit/withdraw)
- DEX interaction capabilities
- Access control (owner-only functions)

**SomniaDexRouter** (`contracts/SomniaDexRouter.sol`)
- Unified DEX interface
- Token swap execution
- Slippage protection
- Multi-DEX routing support

**MockDexRouter** (`contracts/mocks/MockDexRouter.sol`)
- Testnet DEX simulator
- 1:1 swap rate for simplicity
- Pre-funded liquidity pools
- No slippage simulation

**MockERC20** (`contracts/mocks/MockERC20.sol`)
- Test token implementation
- Faucet function for free tokens
- Standard ERC20 interface
- Configurable decimals

## Data Flow

### Trade Execution Flow

```
1. User → Frontend: "I want to long BTC"
                ↓
2. Frontend → Backend: POST /api/chat/message
                ↓
3. Backend → Gemini AI: Analyze request + market data
                ↓
4. Gemini AI → Backend: Trade suggestion (JSON)
                ↓
5. Backend → Database: Store trade (status: pending)
                ↓
6. Backend → Frontend: AI response + trade data
                ↓
7. Frontend: Display trade in composer
                ↓
8. User → Frontend: Adjust parameters & click "Execute"
                ↓
9. Frontend → Backend: POST /api/trades/stage
                ↓
10. Backend → Smart Contract: Prepare transaction calldata
                ↓
11. Backend → Frontend: Prepared transaction
                ↓
12. Frontend → MetaMask: Request signature
                ↓
13. User → MetaMask: Approve transaction
                ↓
14. MetaMask → Blockchain: Submit transaction
                ↓
15. Blockchain: Execute trade via smart account
                ↓
16. Frontend → Backend: PATCH /api/trades/:id (status: executed)
                ↓
17. Backend → Database: Update trade status
                ↓
18. WebSocket → All Clients: Broadcast trade update
```

### Smart Account Interaction Flow

```
User EOA
    │
    │ (owns)
    ↓
Smart Account Contract
    │
    ├─→ Token Deposits (ERC20.transfer)
    ├─→ Token Approvals (approve router)
    ├─→ Trade Execution (router.swap)
    └─→ Fund Recovery (transfer back to EOA)
```

## Security Model

### Access Control

**Smart Account**
- Only owner can execute functions
- AI agents can propose but not execute
- All state changes require owner signature

**Backend**
- User ID from localStorage (can be improved with auth)
- Transaction validation before signing
- Environment variable protection

**Frontend**
- Wallet signature required for all transactions
- Client-side transaction preview
- Explicit user approval for every action

### Trust Boundaries

1. **Frontend ↔ Backend**: HTTPS recommended in production
2. **Backend ↔ Blockchain**: RPC endpoint security
3. **User ↔ Smart Contract**: Non-custodial (user always in control)
4. **AI ↔ Backend**: API key authentication

## Scalability Considerations

### Current Limitations
- SQLite for single-server deployment
- Synchronous trade processing
- Single RPC endpoint

### Future Improvements
- PostgreSQL for multi-server setup
- Queue-based trade processing (Bull, RabbitMQ)
- RPC load balancing and failover
- Horizontal scaling with load balancers
- Caching layer (Redis) for market data

## Deployment Architecture

### Development
```
localhost:3000 (Frontend)
localhost:4000 (Backend)
Somnia Testnet (Contracts)
```

### Production (Recommended)
```
CloudFlare/Vercel (Frontend CDN)
AWS/GCP/Azure (Backend API)
Somnia Mainnet (Contracts)
PostgreSQL (Database)
Redis (Cache)
Load Balancer (API scaling)
```

## Technology Choices Rationale

### Why React + Vite?
- Fast development experience
- Modern build tooling
- Great TypeScript support
- Large ecosystem

### Why wagmi + viem?
- Type-safe Web3 interactions
- React hooks pattern
- Better than ethers.js for React
- Excellent documentation

### Why Express?
- Simple and flexible
- Large middleware ecosystem
- Easy to understand
- Good for MVPs

### Why Gemini AI?
- Strong reasoning capabilities
- Good JSON output mode
- Multimodal support
- Competitive pricing

### Why Somnia?
- High-performance blockchain
- Low transaction costs
- EVM-compatible
- Focus on gaming and DeFi

## Monitoring and Observability

### Logging
- Backend: Winston/Pino for structured logs
- Frontend: Console logs in development
- Smart Contracts: Event emission for key actions

### Metrics (Future)
- API request rates and latency
- Trade execution success rates
- User engagement metrics
- Gas usage tracking

### Error Tracking (Future)
- Sentry for frontend errors
- Backend error aggregation
- Failed transaction analysis

## Development Workflow

```
1. Local development with Hardhat node
2. Deploy contracts to testnet
3. Update .env files with addresses
4. Start backend and frontend servers
5. Test features end-to-end
6. Iterate and improve
```

## Testing Strategy

### Unit Tests
- Smart contract functions (Hardhat)
- Backend services (Jest)
- Frontend components (Vitest + React Testing Library)

### Integration Tests
- API endpoints (Supertest)
- Smart contract interactions (Hardhat)
- Frontend flows (Playwright)

### End-to-End Tests
- Full user journeys
- Trade execution scenarios
- Error handling paths

## Documentation Standards

- Code comments for complex logic
- JSDoc for function documentation
- README for setup instructions
- Architecture docs (this file)
- API documentation
- User guides
