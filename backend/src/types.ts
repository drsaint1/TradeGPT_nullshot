export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export type TradeSide = "LONG" | "SHORT";

export interface TradeSuggestion {
  id: string;
  asset: string;
  symbol: string;
  side: TradeSide;
  leverage: number;
  collateral: number;
  stopLoss?: number;
  takeProfit?: number;
  rationale: string;
  confidence: number;
  riskReward: number;
  entryPrice: number;
  metadata?: Record<string, unknown>;
}

export type TradeStatus = "draft" | "staged" | "executed" | "cancelled" | "expired";

export interface PreparedTransaction {
  to: string;
  data: string;
  value: string;
  chainId?: number;
}

export interface StoredTrade extends TradeSuggestion {
  userId: string;
  status: TradeStatus;
  createdAt: Date;
  updatedAt: Date;
  proposalId?: bigint;
  transactionHash?: string;
  preparedTx?: PreparedTransaction;
}

export interface AiResponse {
  reply: ChatMessage;
  suggestion?: TradeSuggestion;
}

// Alias for compatibility
export type Trade = StoredTrade;
