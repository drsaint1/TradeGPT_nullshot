import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Trading MCP Server for TradeGPT
 *
 * Provides trading execution and management tools for AI agents
 * Built for NullShot Hacks Season 0
 */

interface TradeSetup {
  id: string;
  asset: string;
  side: "LONG" | "SHORT";
  leverage: number;
  collateral: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
}

interface TradeExecution {
  tradeId: string;
  status: "pending" | "executed" | "failed";
  txHash?: string;
  executionPrice?: number;
  timestamp: number;
}

class TradingServer {
  private server: Server;
  private pendingTrades: Map<string, TradeSetup> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "tradegpt-trading",
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
        name: "create_trade_setup",
        description: "Create a trade setup with specified parameters including asset, direction, leverage, and risk management",
        inputSchema: {
          type: "object",
          properties: {
            asset: {
              type: "string",
              description: "Trading pair asset (BTC, ETH, SOL)",
              enum: ["BTC", "ETH", "SOL"],
            },
            side: {
              type: "string",
              description: "Trade direction",
              enum: ["LONG", "SHORT"],
            },
            leverage: {
              type: "number",
              description: "Leverage multiplier (1-20x)",
              minimum: 1,
              maximum: 20,
            },
            collateral: {
              type: "number",
              description: "Collateral amount in USDC",
              minimum: 10,
            },
            entryPrice: {
              type: "number",
              description: "Entry price for the trade",
            },
            stopLoss: {
              type: "number",
              description: "Stop loss price",
            },
            takeProfit: {
              type: "number",
              description: "Take profit target price",
            },
          },
          required: ["asset", "side", "leverage", "collateral", "entryPrice", "stopLoss", "takeProfit"],
        },
      },
      {
        name: "calculate_position_size",
        description: "Calculate the position size based on collateral and leverage",
        inputSchema: {
          type: "object",
          properties: {
            collateral: {
              type: "number",
              description: "Collateral amount in USDC",
            },
            leverage: {
              type: "number",
              description: "Leverage multiplier",
            },
            assetPrice: {
              type: "number",
              description: "Current asset price",
            },
          },
          required: ["collateral", "leverage", "assetPrice"],
        },
      },
      {
        name: "calculate_risk_reward",
        description: "Calculate the risk/reward ratio for a trade setup",
        inputSchema: {
          type: "object",
          properties: {
            entryPrice: {
              type: "number",
              description: "Entry price",
            },
            stopLoss: {
              type: "number",
              description: "Stop loss price",
            },
            takeProfit: {
              type: "number",
              description: "Take profit price",
            },
            side: {
              type: "string",
              description: "Trade direction",
              enum: ["LONG", "SHORT"],
            },
          },
          required: ["entryPrice", "stopLoss", "takeProfit", "side"],
        },
      },
      {
        name: "validate_trade_parameters",
        description: "Validate if trade parameters are within acceptable risk limits",
        inputSchema: {
          type: "object",
          properties: {
            tradeId: {
              type: "string",
              description: "The trade setup ID to validate",
            },
          },
          required: ["tradeId"],
        },
      },
      {
        name: "get_trade_setup",
        description: "Retrieve details of a pending trade setup",
        inputSchema: {
          type: "object",
          properties: {
            tradeId: {
              type: "string",
              description: "The trade setup ID",
            },
          },
          required: ["tradeId"],
        },
      },
      {
        name: "list_pending_trades",
        description: "List all pending trade setups awaiting execution",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_trade_setup":
          return await this.createTradeSetup(args);

        case "calculate_position_size":
          return await this.calculatePositionSize(args);

        case "calculate_risk_reward":
          return await this.calculateRiskReward(args);

        case "validate_trade_parameters":
          return await this.validateTradeParameters(args.tradeId);

        case "get_trade_setup":
          return await this.getTradeSetup(args.tradeId);

        case "list_pending_trades":
          return await this.listPendingTrades();

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

  private async createTradeSetup(params: any) {
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const riskReward = this.calculateRR(
      params.entryPrice,
      params.stopLoss,
      params.takeProfit,
      params.side
    );

    const trade: TradeSetup = {
      id: tradeId,
      asset: params.asset,
      side: params.side,
      leverage: params.leverage,
      collateral: params.collateral,
      entryPrice: params.entryPrice,
      stopLoss: params.stopLoss,
      takeProfit: params.takeProfit,
      riskReward,
    };

    this.pendingTrades.set(tradeId, trade);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            tradeId,
            trade,
            message: "Trade setup created successfully. Ready for execution.",
          }, null, 2),
        },
      ],
    };
  }

  private async calculatePositionSize(params: any) {
    const positionValue = params.collateral * params.leverage;
    const positionSize = positionValue / params.assetPrice;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            collateral: params.collateral,
            leverage: params.leverage,
            assetPrice: params.assetPrice,
            positionValue,
            positionSize,
            unit: "tokens",
          }, null, 2),
        },
      ],
    };
  }

  private async calculateRiskReward(params: any) {
    const riskReward = this.calculateRR(
      params.entryPrice,
      params.stopLoss,
      params.takeProfit,
      params.side
    );

    const risk = Math.abs(params.entryPrice - params.stopLoss);
    const reward = Math.abs(params.takeProfit - params.entryPrice);
    const riskPercent = (risk / params.entryPrice) * 100;
    const rewardPercent = (reward / params.entryPrice) * 100;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            entryPrice: params.entryPrice,
            stopLoss: params.stopLoss,
            takeProfit: params.takeProfit,
            side: params.side,
            riskReward,
            risk,
            reward,
            riskPercent: riskPercent.toFixed(2),
            rewardPercent: rewardPercent.toFixed(2),
            assessment: riskReward >= 2 ? "Good" : riskReward >= 1.5 ? "Acceptable" : "Poor",
          }, null, 2),
        },
      ],
    };
  }

  private calculateRR(entry: number, stopLoss: number, takeProfit: number, side: string): number {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);

    if (risk === 0) return 0;

    return Math.round((reward / risk) * 100) / 100;
  }

  private async validateTradeParameters(tradeId: string) {
    const trade = this.pendingTrades.get(tradeId);

    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    const validations = {
      leverageValid: trade.leverage >= 1 && trade.leverage <= 20,
      collateralValid: trade.collateral >= 10,
      riskRewardValid: trade.riskReward >= 1.5,
      stopLossValid: trade.side === "LONG"
        ? trade.stopLoss < trade.entryPrice
        : trade.stopLoss > trade.entryPrice,
      takeProfitValid: trade.side === "LONG"
        ? trade.takeProfit > trade.entryPrice
        : trade.takeProfit < trade.entryPrice,
    };

    const allValid = Object.values(validations).every(v => v);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            tradeId,
            valid: allValid,
            validations,
            message: allValid
              ? "Trade parameters are valid and within acceptable risk limits"
              : "Trade parameters failed validation checks",
          }, null, 2),
        },
      ],
    };
  }

  private async getTradeSetup(tradeId: string) {
    const trade = this.pendingTrades.get(tradeId);

    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(trade, null, 2),
        },
      ],
    };
  }

  private async listPendingTrades() {
    const trades = Array.from(this.pendingTrades.values());

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            count: trades.length,
            trades,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("TradeGPT Trading MCP Server running on stdio");
  }
}

const server = new TradingServer();
server.run().catch(console.error);
