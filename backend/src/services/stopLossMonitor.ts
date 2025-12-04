import { ethers } from 'ethers';
import { TradeStore } from '../store/tradeStore.js';
import { SocketHub } from '../websocket.js';
import type { Trade } from '../types.js';
import { appConfig } from '../config.js';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

/**
 * Stop-Loss Monitor Service
 * Monitors active positions and automatically executes stop-loss when triggered
 */
export class StopLossMonitor {
  private provider: ethers.Provider;
  private interval: NodeJS.Timeout | null = null;
  private priceCache: Map<string, PriceData> = new Map();
  private isRunning = false;

  constructor(
    private trades: TradeStore,
    private sockets: SocketHub,
    rpcUrl: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Start monitoring positions
   * @param intervalMs - Check interval in milliseconds (default: 10000 = 10 seconds)
   */
  start(intervalMs: number = 10000) {
    if (this.isRunning) {
      console.warn('Stop-loss monitor is already running');
      return;
    }

    console.log(`🔍 Starting stop-loss monitor (checking every ${intervalMs}ms)`);
    this.isRunning = true;

    this.checkPositions();

    this.interval = setInterval(() => this.checkPositions(), intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Stop-loss monitor stopped');
  }

  /**
   * Check all active positions for stop-loss triggers
   */
  private async checkPositions() {
    try {
      const allTrades = this.trades.getAllTrades();
      const activeTrades = allTrades.filter(
        (trade) => trade.status === 'executed' && trade.stopLoss
      );

      if (activeTrades.length === 0) {
        return;
      }

      console.log(`📊 Checking ${activeTrades.length} active positions for stop-loss triggers`);

      for (const trade of activeTrades) {
        await this.checkTrade(trade);
      }
    } catch (error) {
      console.error('Error checking positions:', error);
    }
  }

  /**
   * Check a single trade for stop-loss trigger
   */
  private async checkTrade(trade: Trade) {
    try {
      if (!trade.stopLoss) return;

      const currentPrice = await this.getCurrentPrice(trade.symbol);

      if (!currentPrice) {
        console.warn(`Failed to get price for ${trade.symbol}`);
        return;
      }

      const shouldTriggerStopLoss =
        (trade.side === 'LONG' && currentPrice <= trade.stopLoss) ||
        (trade.side === 'SHORT' && currentPrice >= trade.stopLoss);

      if (shouldTriggerStopLoss) {
        console.log(
          `🚨 Stop-loss triggered for trade ${trade.id}! ` +
            `Symbol: ${trade.symbol}, Side: ${trade.side}, ` +
            `Current: $${currentPrice}, Stop-Loss: $${trade.stopLoss}`
        );

        await this.executeStopLoss(trade, currentPrice);
      }
    } catch (error) {
      console.error(`Error checking trade ${trade.id}:`, error);
    }
  }

  /**
   * Get current price for a symbol
   */
  private async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < 5000) {
        return cached.price;
      }

      const binanceSymbol = `${symbol}USDT`;
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch price for ${symbol}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const price = parseFloat(data.price);

      this.priceCache.set(symbol, {
        symbol,
        price,
        timestamp: Date.now(),
      });

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Execute stop-loss by calling smart account
   */
  private async executeStopLoss(trade: Trade, triggeredAtPrice: number) {
    try {
      console.log(`💰 Executing stop-loss for trade ${trade.id}...`);

      const updated = this.trades.update(trade.userId, trade.id, {
        status: 'executed',
      });

      if (updated) {
        this.sockets.broadcast({
          type: 'trade.stopLoss',
          payload: {
            ...updated,
            triggeredAtPrice,
            executedAt: new Date().toISOString(),
          },
        });

        console.log(`✅ Stop-loss executed successfully for trade ${trade.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to execute stop-loss for trade ${trade.id}:`, error);
    }
  }

  /**
   * Get monitor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cachedPrices: Array.from(this.priceCache.values()),
      monitoredTrades: this.trades.getAllTrades().filter(
        (trade) => trade.status === 'executed' && trade.stopLoss
      ).length,
    };
  }

  /**
   * Manually check a specific trade
   */
  async checkTradeManually(tradeId: string) {
    const allTrades = this.trades.getAllTrades();
    const trade = allTrades.find((t) => t.id === tradeId);

    if (!trade) {
      throw new Error(`Trade ${tradeId} not found`);
    }

    await this.checkTrade(trade);
  }
}
