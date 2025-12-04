export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export type TradeSide = "LONG" | "SHORT";

export interface Trade {
  id: string;
  userId: string;
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
  status: "draft" | "staged" | "executed" | "cancelled" | "expired";
  createdAt: string;
  updatedAt: string;
  transactionHash?: string;
  preparedTx?: PreparedTransaction;
}

export interface PreparedTransaction {
  to: string;
  data: string;
  value: string;
  chainId?: number;
}

export interface ChatResponse {
  reply: ChatMessage;
  trade?: Trade;
  stagedOnChain: boolean;
  transaction?: PreparedTransaction;
}
