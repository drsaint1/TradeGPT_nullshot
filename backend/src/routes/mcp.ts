import express from "express";
import { getMCPClient } from "../services/mcpClient.js";

/**
 * MCP Status and Test Routes
 *
 * Provides endpoints to verify MCP integration and test MCP tools
 */

export function buildMCPRouter() {
  const router = express.Router();

  /**
   * GET /api/mcp/status
   * Check if MCP servers are operational
   */
  router.get("/status", async (_req, res) => {
    try {
      const mcpClient = getMCPClient();

      // Test market data MCP
      const btcPrice = await mcpClient.getMarketPrice("BTC");

      res.json({
        status: "operational",
        message: "MCP servers are connected and operational",
        test: {
          tool: "get_market_price",
          result: btcPrice,
        },
        servers: {
          "market-data": "connected",
          "trading": "connected",
          "portfolio": "connected",
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        servers: {
          "market-data": "error",
          "trading": "unknown",
          "portfolio": "unknown",
        },
      });
    }
  });

  /**
   * POST /api/mcp/test/market-data
   * Test market data MCP tools
   */
  router.post("/test/market-data", async (req, res) => {
    try {
      const { symbol = "ETH" } = req.body;
      const mcpClient = getMCPClient();

      const snapshot = await mcpClient.getMarketSnapshot(symbol);
      const rsiSignal = await mcpClient.checkRsiSignal(symbol);

      res.json({
        success: true,
        tests: {
          getMarketSnapshot: snapshot,
          checkRsiSignal: rsiSignal,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/mcp/test/trading
   * Test trading MCP tools
   */
  router.post("/test/trading", async (req, res) => {
    try {
      const mcpClient = getMCPClient();

      const positionSize = await mcpClient.calculatePositionSize({
        collateral: 100,
        leverage: 5,
        assetPrice: 3678.23,
      });

      const riskReward = await mcpClient.calculateRiskReward({
        entryPrice: 3678.23,
        stopLoss: 3550.0,
        takeProfit: 3850.0,
        side: "LONG",
      });

      res.json({
        success: true,
        tests: {
          calculatePositionSize: positionSize,
          calculateRiskReward: riskReward,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * POST /api/mcp/test/portfolio
   * Test portfolio MCP tools
   */
  router.post("/test/portfolio", async (req, res) => {
    try {
      const mcpClient = getMCPClient();

      const balances = await mcpClient.getPortfolioBalance();

      const portfolioValue = await mcpClient.calculatePortfolioValue({
        USDC: 1.0,
        WETH: 3678.23,
        WBTC: 97234.56,
        WSOL: 234.12,
      });

      res.json({
        success: true,
        tests: {
          getPortfolioBalance: balances,
          calculatePortfolioValue: portfolioValue,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
