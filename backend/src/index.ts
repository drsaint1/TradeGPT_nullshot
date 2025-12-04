import cors from "cors";
import express from "express";
import http from "http";
import { appConfig, securityConfig } from "./config.js";
import { MarketDataService } from "./services/marketDataService.js";
import { AiRouter } from "./services/aiRouter.js";
import { TradeTransactionBuilder } from "./services/tradeTransactionBuilder.js";
import { StopLossMonitor } from "./services/stopLossMonitor.js";
import { TradeStore } from "./store/tradeStore.js";
import { ConversationStore } from "./store/conversationStore.js";
import { SocketHub } from "./websocket.js";
import { buildChatRouter } from "./routes/chat.js";
import { buildTradeRouter } from "./routes/trades.js";
import { buildAccountRouter } from "./routes/accounts.js";
import { buildMCPRouter } from "./routes/mcp.js";
import { closeMCPClient } from "./services/mcpClient.js";

const app = express();

app.use(
  cors({
    origin: securityConfig.corsOrigins.includes("*") ? true : securityConfig.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());

const marketData = new MarketDataService();
const aiRouter = new AiRouter(marketData);
const tradeStore = new TradeStore();
const conversations = new ConversationStore();
const sockets = new SocketHub();
const transactionBuilder = new TradeTransactionBuilder();

const stopLossMonitor = new StopLossMonitor(tradeStore, sockets, appConfig.somniaRpcUrl);
stopLossMonitor.start(15000);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stop-loss/status", (_req, res) => {
  res.json(stopLossMonitor.getStatus());
});

app.use("/api/chat", buildChatRouter(aiRouter, conversations, tradeStore, sockets, transactionBuilder));
app.use("/api/trades", buildTradeRouter(tradeStore, sockets));
app.use("/api/accounts", buildAccountRouter());
app.use("/api/mcp", buildMCPRouter());

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Request failed", err);
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: "Unknown error" });
  }
});

const server = http.createServer(app);
sockets.attach(server);

server.listen(appConfig.port, () => {
  console.log(`TradeGPT backend listening on port ${appConfig.port}`);
  console.log(`MCP integration enabled - using Nullshot MCP servers`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down gracefully...");

  try {
    stopLossMonitor.stop();
    await closeMCPClient();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
