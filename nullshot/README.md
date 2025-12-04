# TradeGPT MCP Servers & Nullshot Agent

This directory contains the Model Context Protocol (MCP) servers and Nullshot agent configuration for TradeGPT. These components enable AI agents to access trading tools, market data, and portfolio analytics in a composable, interoperable way.

## Overview

TradeGPT provides three specialized MCP servers that can be used by any MCP-compatible AI agent:

1. **Market Data MCP** - Real-time cryptocurrency market intelligence
2. **Trading MCP** - Trade execution and risk management tools
3. **Portfolio MCP** - Portfolio tracking and performance analytics

## Quick Start

### Installation

```bash
# From the nullshot directory
npm install

# Build all MCP servers
npm run build
```

### Running MCP Servers

```bash
# Run individual servers for development
npm run dev:market-data
npm run dev:trading
npm run dev:portfolio

# Or run built versions
node mcp-servers/market-data/dist/index.js
node mcp-servers/trading/dist/index.js
node mcp-servers/portfolio/dist/index.js
```

## MCP Servers

### 1. Market Data MCP Server

**Location**: `mcp-servers/market-data/`

Provides real-time cryptocurrency market data and technical analysis tools.

#### Available Tools

##### `get_market_price`
Get the current market price for a cryptocurrency.

**Input:**
```json
{
  "symbol": "BTC" | "ETH" | "SOL"
}
```

**Output:**
```json
{
  "symbol": "BTC",
  "price": 97234.56,
  "timestamp": 1701445234567
}
```

##### `get_market_snapshot`
Get comprehensive market data including price, 24h change, volume, RSI, etc.

**Input:**
```json
{
  "symbol": "ETH"
}
```

**Output:**
```json
{
  "symbol": "ETH",
  "price": 3678.23,
  "change24h": 5.42,
  "volume24h": 15000000000,
  "high24h": 3720.00,
  "low24h": 3450.00,
  "rsi": 62.5,
  "timestamp": 1701445234567
}
```

##### `get_multiple_assets`
Get market data for multiple assets at once.

**Input:**
```json
{
  "symbols": ["BTC", "ETH", "SOL"]
}
```

##### `check_rsi_signal`
Check if RSI indicates oversold or overbought conditions.

**Input:**
```json
{
  "symbol": "SOL"
}
```

**Output:**
```json
{
  "symbol": "SOL",
  "rsi": 28.5,
  "signal": "OVERSOLD",
  "description": "RSI indicates potential buying opportunity (oversold condition)",
  "price": 234.12
}
```

### 2. Trading MCP Server

**Location**: `mcp-servers/trading/`

Handles trade setup creation, position sizing, risk calculations, and validation.

#### Available Tools

##### `create_trade_setup`
Create a structured trade setup with all necessary parameters.

**Input:**
```json
{
  "asset": "ETH",
  "side": "LONG",
  "leverage": 5,
  "collateral": 100,
  "entryPrice": 3678.23,
  "stopLoss": 3550.00,
  "takeProfit": 3850.00
}
```

**Output:**
```json
{
  "success": true,
  "tradeId": "trade_1701445234567_abc123",
  "trade": {
    "id": "trade_1701445234567_abc123",
    "asset": "ETH",
    "side": "LONG",
    "leverage": 5,
    "collateral": 100,
    "entryPrice": 3678.23,
    "stopLoss": 3550.00,
    "takeProfit": 3850.00,
    "riskReward": 1.34
  },
  "message": "Trade setup created successfully. Ready for execution."
}
```

##### `calculate_position_size`
Calculate position size based on collateral and leverage.

**Input:**
```json
{
  "collateral": 100,
  "leverage": 5,
  "assetPrice": 3678.23
}
```

**Output:**
```json
{
  "collateral": 100,
  "leverage": 5,
  "assetPrice": 3678.23,
  "positionValue": 500,
  "positionSize": 0.136,
  "unit": "tokens"
}
```

##### `calculate_risk_reward`
Calculate the risk/reward ratio for a trade.

**Input:**
```json
{
  "entryPrice": 3678.23,
  "stopLoss": 3550.00,
  "takeProfit": 3850.00,
  "side": "LONG"
}
```

**Output:**
```json
{
  "entryPrice": 3678.23,
  "stopLoss": 3550.00,
  "takeProfit": 3850.00,
  "side": "LONG",
  "riskReward": 1.34,
  "risk": 128.23,
  "reward": 171.77,
  "riskPercent": "3.49",
  "rewardPercent": "4.67",
  "assessment": "Acceptable"
}
```

##### `validate_trade_parameters`
Validate if trade parameters meet safety criteria.

**Input:**
```json
{
  "tradeId": "trade_1701445234567_abc123"
}
```

**Output:**
```json
{
  "tradeId": "trade_1701445234567_abc123",
  "valid": true,
  "validations": {
    "leverageValid": true,
    "collateralValid": true,
    "riskRewardValid": false,
    "stopLossValid": true,
    "takeProfitValid": true
  },
  "message": "Trade parameters failed validation checks"
}
```

##### `get_trade_setup` / `list_pending_trades`
Retrieve pending trade setups.

### 3. Portfolio MCP Server

**Location**: `mcp-servers/portfolio/`

Provides portfolio tracking, performance analytics, and trade history management.

#### Available Tools

##### `get_portfolio_balance`
Get token balances in the portfolio.

**Input:**
```json
{
  "token": "USDC"  // Optional - omit for all balances
}
```

**Output:**
```json
{
  "token": "USDC",
  "balance": 10000
}
```

##### `get_portfolio_stats`
Get comprehensive portfolio statistics.

**Input:**
```json
{
  "accountAddress": "0x..."
}
```

**Output:**
```json
{
  "accountAddress": "0x...",
  "stats": {
    "totalTrades": 45,
    "openTrades": 3,
    "closedTrades": 42,
    "winRate": 65.5,
    "totalPnL": 1234.56,
    "averagePnL": 29.39,
    "bestTrade": 345.67,
    "worstTrade": -123.45,
    "sharpeRatio": 1.85
  },
  "timestamp": 1701445234567
}
```

##### `get_open_positions`
Get all currently open trading positions.

##### `get_trade_history`
Get historical trade records with filtering.

**Input:**
```json
{
  "accountAddress": "0x...",
  "limit": 10,
  "asset": "ETH"  // Optional filter
}
```

##### `calculate_portfolio_value`
Calculate total portfolio value in USD.

**Input:**
```json
{
  "prices": {
    "USDC": 1.0,
    "WETH": 3678.23,
    "WBTC": 97234.56,
    "WSOL": 234.12
  }
}
```

**Output:**
```json
{
  "totalValue": 28456.78,
  "breakdown": {
    "USDC": {
      "balance": 10000,
      "price": 1.0,
      "value": 10000
    },
    "WETH": {
      "balance": 2.5,
      "price": 3678.23,
      "value": 9195.58
    }
  },
  "timestamp": 1701445234567
}
```

##### `get_performance_metrics`
Get detailed performance metrics including ROI, Sharpe ratio, and drawdown.

##### `add_trade_record`
Record a new trade in the portfolio history.

## Nullshot Agent Configuration

### Agent File

**Location**: `agent/tradegpt-agent.ts`

Defines the TradeGPT agent configuration including:
- System prompt with trading guidelines
- Model provider (Google Gemini)
- MCP server connections
- Capability definitions

### MCP Configuration

**Location**: `mcp.json`

Orchestrates all three MCP servers:

```json
{
  "mcpServers": {
    "tradegpt-market-data": {
      "command": "node",
      "args": ["./mcp-servers/market-data/dist/index.js"],
      "description": "Real-time cryptocurrency market data provider"
    },
    "tradegpt-trading": {
      "command": "node",
      "args": ["./mcp-servers/trading/dist/index.js"],
      "description": "Trading execution and risk management tools"
    },
    "tradegpt-portfolio": {
      "command": "node",
      "args": ["./mcp-servers/portfolio/dist/index.js"],
      "description": "Portfolio tracking and performance analytics"
    }
  }
}
```

## Integration with Other Agents

### Using TradeGPT MCP Servers

Other AI agents can integrate our MCP servers by:

1. **Add to your mcp.json:**
```json
{
  "mcpServers": {
    "tradegpt-market-data": {
      "command": "node",
      "args": ["/path/to/nullshot/mcp-servers/market-data/dist/index.js"]
    }
  }
}
```

2. **Use the tools in your agent:**
Your agent will automatically have access to all tools provided by the MCP server.

### Example Agent Flow

```
User: "What's the price of ETH and should I buy?"

Agent:
1. Calls get_market_snapshot(ETH)
2. Calls check_rsi_signal(ETH)
3. Analyzes the data
4. Provides recommendation

If user wants to trade:
5. Calls create_trade_setup(...)
6. Calls validate_trade_parameters(...)
7. Presents trade to user for approval
```

## Development

### Project Structure

```
nullshot/
├── mcp-servers/
│   ├── market-data/
│   │   ├── index.ts          # Market data MCP implementation
│   │   ├── tsconfig.json     # TypeScript config
│   │   └── dist/             # Compiled output
│   ├── trading/
│   │   ├── index.ts          # Trading MCP implementation
│   │   ├── tsconfig.json
│   │   └── dist/
│   └── portfolio/
│       ├── index.ts          # Portfolio MCP implementation
│       ├── tsconfig.json
│       └── dist/
├── agent/
│   └── tradegpt-agent.ts     # Nullshot agent config
├── mcp.json                  # MCP orchestration
├── package.json              # Dependencies
├── tsconfig.json             # Root TypeScript config
└── README.md                 # This file
```

### Building

```bash
# Build all servers
npm run build

# Build individual servers
npm run build:market-data
npm run build:trading
npm run build:portfolio

# Clean build artifacts
npm run clean
```

### Testing

Test MCP servers using stdio:

```bash
# Start a server
npm run dev:market-data

# In another terminal, send JSON-RPC requests
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-servers/market-data/dist/index.js
```

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `axios` - HTTP client for API calls
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution for development

## Technical Details

### Protocol

MCP servers use the stdio transport for communication, making them compatible with:
- Claude Desktop
- Nullshot platform
- Any MCP-compatible client

### Data Sources

- **Market Data**: CoinGecko API (free tier) with fallback to mock data
- **Trading**: In-memory state management
- **Portfolio**: In-memory storage with demo data

### Error Handling

All tools return standardized error responses:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: [error message]"
  }],
  "isError": true
}
```

## Roadmap

- [ ] Add WebSocket support for real-time market data
- [ ] Implement persistent storage for trading/portfolio data
- [ ] Add more technical indicators (MACD, Bollinger Bands)
- [ ] Support for additional exchanges and data sources
- [ ] Rate limiting and caching for API calls
- [ ] Comprehensive test suite
- [ ] Docker deployment configuration

## Contributing

Contributions are welcome! Areas for improvement:

- Additional MCP tools and capabilities
- More sophisticated risk management algorithms
- Integration with additional data providers
- Performance optimizations
- Documentation improvements

## License

MIT License - See [LICENSE](../LICENSE) for details

## Support

For questions or issues:
- Open an issue on GitHub
- See main [README](../README.md) for project documentation
- Check [HACKATHON.md](../HACKATHON.md) for detailed architecture

---

**Built for NullShot Hacks Season 0** - Advancing the Agentic Economy with composable AI tools and blockchain integration.
