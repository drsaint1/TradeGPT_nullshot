# Nullshot Integration

### Overview

TradeGPT integrates the **Nullshot Framework** via three production-ready Model Context Protocol (MCP) servers that provide 17 AI tools for trading, market analysis, and portfolio management.

### Architecture Flow

```
┌─────────────────┐
│  TradeGPT AI    │
│   (Gemini 2.0)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌──────────────────────────────┐
│  Backend API    │ ←────┤  MCP Client Manager          │
│  (Express)      │      │  (StdioClientTransport)      │
└─────────────────┘      └────────────┬─────────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    ↓                 ↓                  ↓
         ┌──────────────────┐  ┌─────────────┐  ┌──────────────┐
         │ Market Data MCP  │  │ Trading MCP │  │ Portfolio MCP│
         │   4 tools        │  │  6 tools    │  │   7 tools    │
         └──────────────────┘  └─────────────┘  └──────────────┘
                 ↓                     ↓                  ↓
         ┌──────────────────┐  ┌─────────────┐  ┌──────────────┐
         │  CoinGecko API   │  │  In-Memory  │  │  In-Memory   │
         │  (Real Prices)   │  │   Storage   │  │   Storage    │
         └──────────────────┘  └─────────────┘  └──────────────┘
```

## MCP Servers Breakdown

### 1. Market Data MCP (`nullshot/mcp-servers/market-data/`)

**Purpose**: Real-time cryptocurrency market intelligence

**Tools**:

- `get_market_price` - Get current price for BTC/ETH/SOL
- `get_market_snapshot` - Complete market data (price, RSI, volume, 24h change)
- `get_multiple_assets` - Batch fetch for multiple coins
- `check_rsi_signal` - Detect oversold (<30) / overbought (>70) conditions

**Data Source**: CoinGecko API with 1-minute caching

**Code**: `backend/src/services/marketDataService.ts:27-46`

```typescript
// Tries MCP first, falls back to direct API
if (this.useMCP) {
  try {
    return await this.getSnapshotViaMCP(symbol);
  } catch (error) {
    // Fallback to direct API
  }
}
```

### 2. Trading MCP (`nullshot/mcp-servers/trading/`)

**Purpose**: Trade execution and risk management

**Tools**:

- `create_trade_setup` - Create structured trade with risk parameters
- `calculate_position_size` - Calculate size from collateral + leverage
- `calculate_risk_reward` - Validate R:R ratio (min 1.5:1)
- `validate_trade_parameters` - Safety checks (leverage, stops, targets)
- `get_trade_setup` - Retrieve pending trade details
- `list_pending_trades` - Get all pending trades

**Validation Rules**:

- Leverage: 1-20x
- Collateral: Min 10 USDC
- Risk:Reward: Min 1.5:1
- Stop-loss: Must be on correct side of entry
- Take-profit: Must be on correct side of entry

### 3. Portfolio MCP (`nullshot/mcp-servers/portfolio/`)

**Purpose**: Portfolio tracking and performance analytics

**Tools**:

- `get_portfolio_balance` - Get token balances (all or specific)
- `get_portfolio_stats` - Win rate, PnL, Sharpe ratio
- `get_open_positions` - Active trades
- `get_trade_history` - Historical records with filtering
- `calculate_portfolio_value` - Total USD value
- `get_performance_metrics` - ROI, drawdown, analytics
- `add_trade_record` - Record new trades

**Metrics Calculated**:

- Win Rate, Total PnL, Average PnL
- Best/Worst Trade
- Sharpe Ratio
- Max Drawdown
- ROI

## Code Integration Points

### Backend MCP Client

**File**: `backend/src/services/mcpClient.ts`

**Configuration** (lines 29-45):

```typescript
private servers: MCPServerConfig[] = [
  {
    name: "market-data",
    command: "node",
    args: [path.join(__dirname, "../../../nullshot/mcp-servers/market-data/dist/index.js")],
  },
  {
    name: "trading",
    command: "node",
    args: [path.join(__dirname, "../../../nullshot/mcp-servers/trading/dist/index.js")],
  },
  {
    name: "portfolio",
    command: "node",
    args: [path.join(__dirname, "../../../nullshot/mcp-servers/portfolio/dist/index.js")],
  },
];
```

**Usage Example**:

```typescript
import { getMCPClient } from "./services/mcpClient";

const mcp = getMCPClient();

// Get market data
const snapshot = await mcp.getMarketSnapshot("ETH");

// Create trade
const trade = await mcp.createTradeSetup({
  asset: "ETH",
  side: "LONG",
  leverage: 5,
  collateral: 100,
  entryPrice: 3678.23,
  stopLoss: 3550.0,
  takeProfit: 3850.0,
});

// Get portfolio stats
const stats = await mcp.getPortfolioStats("0x...");
```

## Building and Running

### Build MCP Servers

```bash
cd nullshot
npm install
npm run build
```

This compiles all three MCP servers to `nullshot/mcp-servers/*/dist/index.js`

### Run Standalone (for testing)

```bash
# Terminal 1 - Market Data
npm run dev:market-data

# Terminal 2 - Trading
npm run dev:trading

# Terminal 3 - Portfolio
npm run dev:portfolio
```

### Production (Backend auto-starts MCP servers)

```bash
cd backend
npm run dev  # MCP servers spawn automatically via StdioClientTransport
```

## Deployment Configuration

The `render.yaml` includes MCP build step:

```yaml
buildCommand: cd nullshot && npm install && npm run build && cd ../backend && npm install && npm run build
```

This ensures MCP servers are compiled before backend starts.

## Environment Variables

MCP servers can be configured via environment variables:

- `COINGECKO_API_KEY` - Optional CoinGecko API key (for rate limit increase)
- `MARKET_DATA_API` - API endpoint (default: https://api.coingecko.com/api/v3)

These are passed from backend to MCP servers via `mcpClient.ts:66-70`.

## Testing MCP Servers

### Manual Testing

```bash
# Start market-data server
cd nullshot
npm run dev:market-data

# In another terminal, test via stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-servers/market-data/dist/index.js
```

### Integration Testing

```bash
# Start backend (auto-connects to MCP)
cd backend
npm run dev

# Backend logs will show:
# ✓ MCP market-data server connected
# ✓ MCP trading server connected
# ✓ MCP portfolio server connected
```

## For Other Developers

### Using TradeGPT MCP Servers in Your Agent

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "tradegpt-market-data": {
      "command": "node",
      "args": [
        "/path/to/TradeGPT/nullshot/mcp-servers/market-data/dist/index.js"
      ],
      "env": {
        "COINGECKO_API_KEY": "your_key_here"
      }
    },
    "tradegpt-trading": {
      "command": "node",
      "args": ["/path/to/TradeGPT/nullshot/mcp-servers/trading/dist/index.js"]
    },
    "tradegpt-portfolio": {
      "command": "node",
      "args": ["/path/to/TradeGPT/nullshot/mcp-servers/portfolio/dist/index.js"]
    }
  }
}
```

Your AI agent will automatically have access to all 17 tools!

## Documentation

- **Main README**: `README.md` (lines 27-433 cover MCP integration)
- **Nullshot README**: `nullshot/README.md` (comprehensive tool documentation)
- **MCP Config**: `nullshot/mcp.json` (orchestration configuration)
- **Agent Config**: `nullshot/agent/tradegpt-agent.ts` (Nullshot agent setup)

## Status: Production Ready ✅

- ✅ 3 MCP servers built and tested
- ✅ 17 AI tools available
- ✅ Integrated with backend via StdioClientTransport
- ✅ Real-time market data from CoinGecko
- ✅ Risk management and validation
- ✅ Portfolio analytics and tracking
- ✅ Documented and deployment-ready
- ✅ Open-source and extensible

## NullShot Hacks Season 0

Built for **Track 1a: MCPs/Agents using the Nullshot Framework**

This integration showcases:

- Composable AI tools via MCP protocol
- Agentic economy with blockchain integration
- Interoperability across AI agents
- Production-ready trading infrastructure
