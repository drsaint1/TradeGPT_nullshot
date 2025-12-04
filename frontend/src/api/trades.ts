import client from './client';
import type { ChatResponse, Trade, PreparedTransaction } from '../types';

export async function sendChatMessage(payload: {
  userId: string;
  message: string;
}): Promise<ChatResponse> {
  const { data } = await client.post<ChatResponse>('/chat', payload);
  return data;
}

export async function stageTrade(payload: {
  userId: string;
  tradeId: string;
  account: string;
}): Promise<{ stagedOnChain: boolean; transaction?: PreparedTransaction; message?: string }> {
  const { data } = await client.post('/chat/stage', payload);
  return data as { stagedOnChain: boolean; transaction?: PreparedTransaction; message?: string };
}

export async function fetchTrades(userId: string): Promise<Trade[]> {
  const { data } = await client.get<{ trades: Trade[] }>('/trades', { params: { userId } });
  return data.trades;
}

export async function updateTrade(payload: {
  userId: string;
  tradeId: string;
  stopLoss?: number;
  takeProfit?: number;
  leverage?: number;
  collateral?: number;
  status?: Trade['status'];
  transactionHash?: string;
  preparedTx?: PreparedTransaction;
}): Promise<Trade> {
  const { data } = await client.patch<{ trade: Trade }>(`/trades/${payload.tradeId}`, payload);
  return data.trade;
}

