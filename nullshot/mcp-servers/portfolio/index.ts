import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Portfolio MCP Server for TradeGPT
 *
 * Provides portfolio tracking and analytics tools for AI agents
 * Built for NullShot Hacks Season 0
 */

interface Trade {
  id: string;
  asset: string;
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice?: number;
  size: number;
  leverage: number;
  pnl?: number;
  status: "open" | "closed" | "liquidated";
  openedAt: number;
  closedAt?: number;
}

interface PortfolioStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnL: number;
  averagePnL: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number;
}

class PortfolioServer {
  private server: Server;
  private trades: Map<string, Trade> = new Map();
  private balances: Map<string, number> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "tradegpt-portfolio",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.initializeMockData();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initializeMockData() {
    // Initialize with some demo balances
    this.balances.set("USDC", 10000);
    this.balances.set("WETH", 2.5);
    this.balances.set("WBTC", 0.1);
    this.balances.set("WSOL", 50);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) =>
      this.handleToolCall(request)
    );
  }

  private getTools(): Tool[] {
    return [
      {
        name: "get_portfolio_balance",
        description: "Get current balance for a specific token or all tokens in the portfolio",
        inputSchema: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "Token symbol (optional, returns all if not specified)",
            },
          },
        },
      },
      {
        name: "get_portfolio_stats",
        description: "Get comprehensive portfolio statistics including PnL, win rate, and performance metrics",
        inputSchema: {
          type: "object",
          properties: {
            accountAddress: {
              type: "string",
              description: "Smart account address to fetch stats for",
            },
          },
        },
      },
      {
        name: "get_open_positions",
        description: "Get all currently open trading positions",
        inputSchema: {
          type: "object",
          properties: {
            accountAddress: {
              type: "string",
              description: "Smart account address",
            },
          },
        },
      },
      {
        name: "get_trade_history",
        description: "Get historical trade records with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            accountAddress: {
              type: "string",
              description: "Smart account address",
            },
            limit: {
              type: "number",
              description: "Number of trades to return (default: 10)",
              default: 10,
            },
            asset: {
              type: "string",
              description: "Filter by asset (optional)",
            },
          },
          required: ["accountAddress"],
        },
      },
      {
        name: "calculate_portfolio_value",
        description: "Calculate total portfolio value in USD including all assets",
        inputSchema: {
          type: "object",
          properties: {
            prices: {
              type: "object",
              description: "Current prices for each asset",
              additionalProperties: {
                type: "number",
              },
            },
          },
          required: ["prices"],
        },
      },
      {
        name: "get_performance_metrics",
        description: "Get detailed performance metrics including Sharpe ratio, max drawdown, and ROI",
        inputSchema: {
          type: "object",
          properties: {
            accountAddress: {
              type: "string",
              description: "Smart account address",
            },
          },
          required: ["accountAddress"],
        },
      },
      {
        name: "add_trade_record",
        description: "Record a new trade in the portfolio history",
        inputSchema: {
          type: "object",
          properties: {
            asset: {
              type: "string",
              description: "Asset traded",
            },
            side: {
              type: "string",
              enum: ["LONG", "SHORT"],
            },
            entryPrice: {
              type: "number",
            },
            size: {
              type: "number",
            },
            leverage: {
              type: "number",
            },
          },
          required: ["asset", "side", "entryPrice", "size", "leverage"],
        },
      },
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get_portfolio_balance":
          return await this.getPortfolioBalance(args.token);

        case "get_portfolio_stats":
          return await this.getPortfolioStats(args.accountAddress);

        case "get_open_positions":
          return await this.getOpenPositions(args.accountAddress);

        case "get_trade_history":
          return await this.getTradeHistory(args);

        case "calculate_portfolio_value":
          return await this.calculatePortfolioValue(args.prices);

        case "get_performance_metrics":
          return await this.getPerformanceMetrics(args.accountAddress);

        case "add_trade_record":
          return await this.addTradeRecord(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getPortfolioBalance(token?: string) {
    if (token) {
      const balance = this.balances.get(token) || 0;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              token,
              balance,
            }, null, 2),
          },
        ],
      };
    }

    const allBalances = Object.fromEntries(this.balances);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            balances: allBalances,
            timestamp: Date.now(),
          }, null, 2),
        },
      ],
    };
  }

  private async getPortfolioStats(accountAddress: string): Promise<any> {
    const allTrades = Array.from(this.trades.values());
    const closedTrades = allTrades.filter(t => t.status === "closed" && t.pnl !== undefined);

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const pnls = closedTrades.map(t => t.pnl || 0);

    const stats: PortfolioStats = {
      totalTrades: allTrades.length,
      openTrades: allTrades.filter(t => t.status === "open").length,
      closedTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalPnL,
      averagePnL: closedTrades.length > 0 ? totalPnL / closedTrades.length : 0,
      bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
      worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
      sharpeRatio: this.calculateSharpeRatio(pnls),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            accountAddress,
            stats,
            timestamp: Date.now(),
          }, null, 2),
        },
      ],
    };
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return Math.round((mean / stdDev) * 100) / 100;
  }

  private async getOpenPositions(accountAddress: string) {
    const openTrades = Array.from(this.trades.values()).filter(t => t.status === "open");

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            accountAddress,
            count: openTrades.length,
            positions: openTrades,
          }, null, 2),
        },
      ],
    };
  }

  private async getTradeHistory(params: any) {
    let trades = Array.from(this.trades.values());

    if (params.asset) {
      trades = trades.filter(t => t.asset === params.asset);
    }

    trades.sort((a, b) => b.openedAt - a.openedAt);
    const limited = trades.slice(0, params.limit || 10);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            accountAddress: params.accountAddress,
            count: limited.length,
            total: trades.length,
            trades: limited,
          }, null, 2),
        },
      ],
    };
  }

  private async calculatePortfolioValue(prices: Record<string, number>) {
    let totalValue = 0;
    const breakdown: Record<string, any> = {};

    for (const [token, balance] of this.balances.entries()) {
      const price = prices[token] || 0;
      const value = balance * price;
      totalValue += value;

      breakdown[token] = {
        balance,
        price,
        value,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            totalValue,
            breakdown,
            timestamp: Date.now(),
          }, null, 2),
        },
      ],
    };
  }

  private async getPerformanceMetrics(accountAddress: string) {
    const allTrades = Array.from(this.trades.values());
    const closedTrades = allTrades.filter(t => t.status === "closed");
    const pnls = closedTrades.map(t => t.pnl || 0);

    const totalPnL = pnls.reduce((sum, p) => sum + p, 0);
    const initialCapital = 10000; // Assume starting with 10k
    const roi = (totalPnL / initialCapital) * 100;

    // Calculate max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let current = initialCapital;

    for (const pnl of pnls) {
      current += pnl;
      if (current > peak) {
        peak = current;
      }
      const drawdown = ((peak - current) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            accountAddress,
            metrics: {
              roi: roi.toFixed(2) + "%",
              totalPnL,
              sharpeRatio: this.calculateSharpeRatio(pnls),
              maxDrawdown: maxDrawdown.toFixed(2) + "%",
              numberOfTrades: closedTrades.length,
              averageTradeSize: closedTrades.length > 0
                ? closedTrades.reduce((sum, t) => sum + t.size, 0) / closedTrades.length
                : 0,
            },
            timestamp: Date.now(),
          }, null, 2),
        },
      ],
    };
  }

  private async addTradeRecord(params: any) {
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const trade: Trade = {
      id: tradeId,
      asset: params.asset,
      side: params.side,
      entryPrice: params.entryPrice,
      size: params.size,
      leverage: params.leverage,
      status: "open",
      openedAt: Date.now(),
    };

    this.trades.set(tradeId, trade);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            tradeId,
            trade,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TradeGPT Portfolio MCP Server running on stdio");
  }
}

const server = new PortfolioServer();
server.run().catch(console.error);
