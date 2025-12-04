import { StoredTrade, TradeSuggestion, TradeStatus } from "../types.js";

export class TradeStore {
  private readonly tradesByUser = new Map<string, Map<string, StoredTrade>>();

  list(userId: string): StoredTrade[] {
    return Array.from(this.tradesByUser.get(userId)?.values() ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  get(userId: string, tradeId: string): StoredTrade | undefined {
    return this.tradesByUser.get(userId)?.get(tradeId);
  }

  upsert(userId: string, suggestion: TradeSuggestion, status: TradeStatus = "draft"): StoredTrade {
    const now = new Date();
    const entry: StoredTrade = {
      ...suggestion,
      userId,
      status,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.tradesByUser.has(userId)) {
      this.tradesByUser.set(userId, new Map());
    }

    this.tradesByUser.get(userId)!.set(suggestion.id, entry);
    return entry;
  }

  update(userId: string, tradeId: string, patch: Partial<StoredTrade>): StoredTrade | undefined {
    const existing = this.get(userId, tradeId);
    if (!existing) {
      return undefined;
    }
    const merged: StoredTrade = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    this.tradesByUser.get(userId)!.set(tradeId, merged);
    return merged;
  }

  /**
   * Get all trades across all users (useful for monitoring)
   */
  getAllTrades(): StoredTrade[] {
    const allTrades: StoredTrade[] = [];
    for (const userTrades of this.tradesByUser.values()) {
      allTrades.push(...userTrades.values());
    }
    return allTrades.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}
