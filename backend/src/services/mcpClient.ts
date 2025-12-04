import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import { fileURLToPath } from "url";
import { appConfig } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCP Client for TradeGPT Backend
 *
 * Manages connections to MCP servers and provides a clean interface
 * for calling tools on market-data, trading, and portfolio servers.
 */

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private initialized: Set<string> = new Set();

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

  constructor() {
    console.log("MCPClientManager initialized");
  }

  /**
   * Initialize connection to a specific MCP server
   */
  private async initializeServer(serverName: string): Promise<void> {
    if (this.initialized.has(serverName)) {
      return;
    }

    const serverConfig = this.servers.find(s => s.name === serverName);
    if (!serverConfig) {
      throw new Error(`MCP server ${serverName} not found in configuration`);
    }

    try {
      // Prepare environment variables for MCP servers
      const mcpEnv = {
        ...process.env,
        COINGECKO_API_KEY: appConfig.marketDataApiKey || "",
        MARKET_DATA_API: appConfig.marketDataEndpoint || "https://api.coingecko.com/api/v3",
      };

      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env: mcpEnv,
      });

      const client = new Client(
        {
          name: `tradegpt-backend-${serverName}`,
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);

      this.clients.set(serverName, client);
      this.transports.set(serverName, transport);
      this.initialized.add(serverName);

      console.log(`✓ MCP ${serverName} server connected`);
    } catch (error) {
      console.error(`Failed to initialize MCP ${serverName} server:`, error);
      throw error;
    }
  }

  /**
   * Call a tool on an MCP server
   */
  private async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    await this.initializeServer(serverName);

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP client for ${serverName} not initialized`);
    }

    try {
      const result = await client.request(
        {
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args,
          },
        },
        CallToolResultSchema
      );

      return result;
    } catch (error) {
      console.error(`Error calling ${toolName} on ${serverName}:`, error);
      throw error;
    }
  }

  /**
   * Parse MCP response content
   */
  private parseResponse(result: any): any {
    if (result.isError) {
      throw new Error(result.content[0]?.text || "MCP tool call failed");
    }

    const textContent = result.content?.find((c: any) => c.type === "text")?.text;
    if (!textContent) {
      throw new Error("No text content in MCP response");
    }

    try {
      return JSON.parse(textContent);
    } catch (error) {
      return textContent;
    }
  }

  // ========== Market Data MCP Tools ==========

  async getMarketPrice(symbol: string): Promise<{ symbol: string; price: number; timestamp: number }> {
    const result = await this.callTool("market-data", "get_market_price", { symbol });
    return this.parseResponse(result);
  }

  async getMarketSnapshot(symbol: string): Promise<{
    symbol: string;
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    rsi: number;
    timestamp: number;
  }> {
    const result = await this.callTool("market-data", "get_market_snapshot", { symbol });
    return this.parseResponse(result);
  }

  async getMultipleAssets(symbols: string[]): Promise<any[]> {
    const result = await this.callTool("market-data", "get_multiple_assets", { symbols });
    return this.parseResponse(result);
  }

  async checkRsiSignal(symbol: string): Promise<{
    symbol: string;
    rsi: number;
    signal: string;
    description: string;
    price: number;
  }> {
    const result = await this.callTool("market-data", "check_rsi_signal", { symbol });
    return this.parseResponse(result);
  }

  // ========== Trading MCP Tools ==========

  async createTradeSetup(params: {
    asset: string;
    side: "LONG" | "SHORT";
    leverage: number;
    collateral: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
  }): Promise<any> {
    const result = await this.callTool("trading", "create_trade_setup", params);
    return this.parseResponse(result);
  }

  async calculatePositionSize(params: {
    collateral: number;
    leverage: number;
    assetPrice: number;
  }): Promise<any> {
    const result = await this.callTool("trading", "calculate_position_size", params);
    return this.parseResponse(result);
  }

  async calculateRiskReward(params: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    side: "LONG" | "SHORT";
  }): Promise<any> {
    const result = await this.callTool("trading", "calculate_risk_reward", params);
    return this.parseResponse(result);
  }

  async validateTradeParameters(tradeId: string): Promise<any> {
    const result = await this.callTool("trading", "validate_trade_parameters", { tradeId });
    return this.parseResponse(result);
  }

  async listPendingTrades(): Promise<any> {
    const result = await this.callTool("trading", "list_pending_trades", {});
    return this.parseResponse(result);
  }

  // ========== Portfolio MCP Tools ==========

  async getPortfolioBalance(token?: string): Promise<any> {
    const result = await this.callTool("portfolio", "get_portfolio_balance", { token });
    return this.parseResponse(result);
  }

  async getPortfolioStats(accountAddress: string): Promise<any> {
    const result = await this.callTool("portfolio", "get_portfolio_stats", { accountAddress });
    return this.parseResponse(result);
  }

  async getOpenPositions(accountAddress: string): Promise<any> {
    const result = await this.callTool("portfolio", "get_open_positions", { accountAddress });
    return this.parseResponse(result);
  }

  async getTradeHistory(accountAddress: string, limit?: number, asset?: string): Promise<any> {
    const result = await this.callTool("portfolio", "get_trade_history", {
      accountAddress,
      limit,
      asset,
    });
    return this.parseResponse(result);
  }

  async calculatePortfolioValue(prices: Record<string, number>): Promise<any> {
    const result = await this.callTool("portfolio", "calculate_portfolio_value", { prices });
    return this.parseResponse(result);
  }

  async getPerformanceMetrics(accountAddress: string): Promise<any> {
    const result = await this.callTool("portfolio", "get_performance_metrics", { accountAddress });
    return this.parseResponse(result);
  }

  async addTradeRecord(params: {
    asset: string;
    side: "LONG" | "SHORT";
    entryPrice: number;
    size: number;
    leverage: number;
  }): Promise<any> {
    const result = await this.callTool("portfolio", "add_trade_record", params);
    return this.parseResponse(result);
  }

  /**
   * Close all MCP connections
   */
  async close(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`✓ MCP ${name} server disconnected`);
      } catch (error) {
        console.error(`Error closing ${name} client:`, error);
      }
    }

    this.clients.clear();
    this.transports.clear();
    this.initialized.clear();
  }
}

// Singleton instance
let mcpClientInstance: MCPClientManager | null = null;

export function getMCPClient(): MCPClientManager {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClientManager();
  }
  return mcpClientInstance;
}

export async function closeMCPClient(): Promise<void> {
  if (mcpClientInstance) {
    await mcpClientInstance.close();
    mcpClientInstance = null;
  }
}
