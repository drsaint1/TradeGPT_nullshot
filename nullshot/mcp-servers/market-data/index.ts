import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

/**
 * Market Data MCP Server for TradeGPT
 *
 * Provides real-time cryptocurrency market data tools for AI agents
 * Built for NullShot Hacks Season 0
 */

interface MarketSnapshot {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  rsi: number;
  timestamp: number;
}

class MarketDataServer {
  private server: Server;
  private supportedAssets = ["BTC", "ETH", "SOL"];
  private coingeckoApiKey: string | undefined;
  private marketDataEndpoint: string;
  private cache: Map<string, { data: MarketSnapshot; timestamp: number }> = new Map();
  private cacheTTL = 60000; // 1 minute cache to avoid rate limiting

  constructor() {
    // Read API configuration from environment
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
    this.marketDataEndpoint = process.env.MARKET_DATA_API || "https://api.coingecko.com/api/v3";

    console.error(`[Market Data MCP] Using endpoint: ${this.marketDataEndpoint}`);
    console.error(`[Market Data MCP] API Key configured: ${this.coingeckoApiKey ? "Yes" : "No"}`);

    this.server = new Server(
      {
        name: "tradegpt-market-data",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
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
        name: "get_market_price",
        description: "Get the current market price for a cryptocurrency asset (BTC, ETH, SOL)",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "The cryptocurrency symbol (BTC, ETH, or SOL)",
              enum: this.supportedAssets,
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_market_snapshot",
        description: "Get comprehensive market data including price, 24h change, volume, high, low, and RSI indicator",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "The cryptocurrency symbol (BTC, ETH, or SOL)",
              enum: this.supportedAssets,
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_multiple_assets",
        description: "Get market data for multiple cryptocurrency assets at once",
        inputSchema: {
          type: "object",
          properties: {
            symbols: {
              type: "array",
              description: "Array of cryptocurrency symbols",
              items: {
                type: "string",
                enum: this.supportedAssets,
              },
            },
          },
          required: ["symbols"],
        },
      },
      {
        name: "check_rsi_signal",
        description: "Check if RSI indicates oversold (< 30) or overbought (> 70) conditions for trading signals",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "The cryptocurrency symbol (BTC, ETH, or SOL)",
              enum: this.supportedAssets,
            },
          },
          required: ["symbol"],
        },
      },
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get_market_price":
          return await this.getMarketPrice(args.symbol);

        case "get_market_snapshot":
          return await this.getMarketSnapshot(args.symbol);

        case "get_multiple_assets":
          return await this.getMultipleAssets(args.symbols);

        case "check_rsi_signal":
          return await this.checkRsiSignal(args.symbol);

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

  private async getMarketPrice(symbol: string) {
    const data = await this.fetchMarketData(symbol);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            symbol: data.symbol,
            price: data.price,
            timestamp: data.timestamp,
          }, null, 2),
        },
      ],
    };
  }

  private async getMarketSnapshot(symbol: string) {
    const data = await this.fetchMarketData(symbol);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getMultipleAssets(symbols: string[]) {
    const dataPromises = symbols.map(symbol => this.fetchMarketData(symbol));
    const results = await Promise.all(dataPromises);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async checkRsiSignal(symbol: string) {
    const data = await this.fetchMarketData(symbol);

    let signal = "NEUTRAL";
    let description = "";

    if (data.rsi < 30) {
      signal = "OVERSOLD";
      description = "RSI indicates potential buying opportunity (oversold condition)";
    } else if (data.rsi > 70) {
      signal = "OVERBOUGHT";
      description = "RSI indicates potential selling opportunity (overbought condition)";
    } else {
      description = "RSI is in neutral range";
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            symbol: data.symbol,
            rsi: data.rsi,
            signal,
            description,
            price: data.price,
          }, null, 2),
        },
      ],
    };
  }

  private async fetchMarketData(symbol: string): Promise<MarketSnapshot> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.error(`[Market Data MCP] ✓ Cache hit for ${symbol} (${((Date.now() - cached.timestamp) / 1000).toFixed(0)}s old)`);
      return cached.data;
    }

    try {
      // Using CoinGecko API for real market data
      const coinIds: Record<string, string> = {
        BTC: "bitcoin",
        ETH: "ethereum",
        SOL: "solana",
      };

      const coinId = coinIds[symbol];
      const headers = this.coingeckoApiKey
        ? { "x-cg-demo-api-key": this.coingeckoApiKey }
        : undefined;

      console.error(`[Market Data MCP] Fetching ${symbol} (${coinId}) from ${this.marketDataEndpoint}`);

      const response = await axios.get(
        `${this.marketDataEndpoint}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: "usd",
            days: 1,
            // Note: 'interval' parameter removed - it's Enterprise-only
            // Free tier automatically provides appropriate intervals based on 'days'
          },
          headers,
        }
      );

      const prices = response.data.prices;
      const currentPrice = prices[prices.length - 1][1];
      const yesterdayPrice = prices[0][1];
      const change24h = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;

      // Calculate RSI (simplified 14-period)
      const recentPrices = prices.slice(-14).map((p: any) => p[1]);
      const rsi = this.calculateRSI(recentPrices);

      const allPrices = prices.map((p: any) => p[1]);
      const high24h = Math.max(...allPrices);
      const low24h = Math.min(...allPrices);

      console.error(`[Market Data MCP] ✓ Real data fetched: ${symbol} = $${currentPrice} (${change24h.toFixed(2)}%)`);

      const snapshot: MarketSnapshot = {
        symbol,
        price: currentPrice,
        change24h,
        volume24h: 0, // CoinGecko requires different endpoint for volume
        high24h,
        low24h,
        rsi,
        timestamp: Date.now(),
      };

      // Cache the result
      this.cache.set(symbol, { data: snapshot, timestamp: Date.now() });

      return snapshot;
    } catch (error) {
      // Fallback to mock data if API fails
      const errorMsg = error instanceof Error ? error.message : String(error);
      const axiosError = error as any;
      if (axiosError.response) {
        console.error(`[Market Data MCP] ⚠ API failed for ${symbol} (${axiosError.response.status}):`, axiosError.response.data);
      } else {
        console.error(`[Market Data MCP] ⚠ API failed for ${symbol}:`, errorMsg);
      }
      return this.getMockMarketData(symbol);
    }
  }

  private calculateRSI(prices: number[]): number {
    if (prices.length < 2) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / prices.length;
    const avgLoss = losses / prices.length;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Math.round(rsi * 100) / 100;
  }

  private getMockMarketData(symbol: string): MarketSnapshot {
    const mockPrices: Record<string, number> = {
      BTC: 97234.56,
      ETH: 3678.23,
      SOL: 234.12,
    };

    return {
      symbol,
      price: mockPrices[symbol] || 1000,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000000,
      high24h: mockPrices[symbol] * 1.05,
      low24h: mockPrices[symbol] * 0.95,
      rsi: 45 + Math.random() * 30,
      timestamp: Date.now(),
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TradeGPT Market Data MCP Server running on stdio");
  }
}

const server = new MarketDataServer();
server.run().catch(console.error);
