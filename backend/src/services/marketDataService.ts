import axios from "axios";
import { appConfig } from "../config.js";
import { getMCPClient } from "./mcpClient.js";

interface MarketSnapshot {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  rsi: number;
  support: number;
  resistance: number;
}

const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  BTC: "bitcoin",
  SOL: "solana",
  STT: "scattered-truth",
  USDC: "usd-coin",
  USDT: "tether",
};

export class MarketDataService {
  private readonly endpoint = appConfig.marketDataEndpoint;
  private readonly apiKey = appConfig.marketDataApiKey;
  private readonly useMCP = true; // Set to true once MCP SDK version is fixed - fallback to direct API for now

  async getSnapshot(symbol: string): Promise<MarketSnapshot> {
    // Try MCP first if enabled
    if (this.useMCP) {
      try {
        return await this.getSnapshotViaMCP(symbol);
      } catch (error) {
        console.warn(
          `MCP market data failed, falling back to direct API: ${
            error instanceof Error ? error.message : error
          }`
        );
        // Fall through to direct API call
      }
    }

    // Fallback to direct API call
    return await this.getSnapshotViaDirect(symbol);
  }

  private async getSnapshotViaMCP(symbol: string): Promise<MarketSnapshot> {
    const mcpClient = getMCPClient();
    const uppercase = symbol.toUpperCase();

    console.log(`Fetching market data for ${uppercase} via MCP`);

    const snapshot = await mcpClient.getMarketSnapshot(uppercase);

    // Calculate support and resistance from the data
    const support = Number((snapshot.price * 0.97).toFixed(2));
    const resistance = Number((snapshot.price * 1.03).toFixed(2));

    console.log(
      `✓ MCP Market data fetched: ${uppercase} = $${
        snapshot.price
      } (${snapshot.change24h.toFixed(2)}%)`
    );

    return {
      symbol: uppercase,
      price: snapshot.price,
      change24h: snapshot.change24h,
      volume24h: snapshot.volume24h,
      rsi: snapshot.rsi,
      support,
      resistance,
    };
  }

  private async getSnapshotViaDirect(symbol: string): Promise<MarketSnapshot> {
    const uppercase = symbol.toUpperCase();
    const coinId = COINGECKO_IDS[uppercase] ?? uppercase.toLowerCase();
    const headers = this.apiKey
      ? { "x-cg-demo-api-key": this.apiKey }
      : undefined;

    try {
      console.log(
        `Fetching market data for ${uppercase} (${coinId}) from ${this.endpoint}`
      );
      const priceResponse = await axios.get(`${this.endpoint}/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: "usd",
          include_24hr_change: true,
        },
        headers,
      });

      const pricePayload = priceResponse.data?.[coinId];
      if (!pricePayload) {
        throw new Error("Price data missing");
      }

      const price = Number(pricePayload.usd);
      const change24h = Number(pricePayload.usd_24h_change ?? 0);
      console.log(
        `✓ Price fetched: ${uppercase} = $${price} (${change24h.toFixed(2)}%)`
      );

      let prices: number[] = [];
      let volumes: number[] = [];

      try {
        const marketChartResp = await axios.get(
          `${this.endpoint}/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: "usd",
              days: 1,
              interval: "hourly",
            },
            headers,
          }
        );

        prices =
          marketChartResp.data?.prices?.map(([, p]: [number, number]) =>
            Number(p)
          ) ?? [];
        volumes =
          marketChartResp.data?.total_volumes?.map(([, v]: [number, number]) =>
            Number(v)
          ) ?? [];
        console.log(`✓ Historical data fetched: ${prices.length} price points`);
      } catch (chartErr) {
        console.warn(
          `⚠ Historical data not available (may require paid API): ${
            chartErr instanceof Error ? chartErr.message : chartErr
          }`
        );
      }

      const rsi = this.calculateRsi(prices);
      const windowPrices = prices.slice(-20);
      const support =
        windowPrices.length > 0
          ? Math.min(...windowPrices)
          : Number((price * 0.97).toFixed(2));
      const resistance =
        windowPrices.length > 0
          ? Math.max(...windowPrices)
          : Number((price * 1.03).toFixed(2));
      const volume24h = volumes.length > 0 ? volumes[volumes.length - 1] : 0;

      return {
        symbol: uppercase,
        price,
        change24h,
        volume24h,
        rsi,
        support: Number(support.toFixed(2)),
        resistance: Number(resistance.toFixed(2)),
      };
    } catch (err) {
      console.error(
        `✗ Market data fetch failed for ${uppercase}:`,
        err instanceof Error ? err.message : err
      );
      throw new Error(
        `Unable to fetch market data for ${uppercase}. Please check your MARKET_DATA_API and COINGECKO_API_KEY configuration.`
      );
    }
  }

  private calculateRsi(prices: number[], period = 14): number {
    if (prices.length <= period) {
      return 50;
    }

    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i += 1) {
      const delta = prices[i] - prices[i - 1];
      if (delta >= 0) {
        gains += delta;
      } else {
        losses -= delta;
      }
    }

    gains /= period;
    losses /= period === 0 ? 1 : period;

    for (let i = period + 1; i < prices.length; i += 1) {
      const delta = prices[i] - prices[i - 1];
      if (delta >= 0) {
        gains = (gains * (period - 1) + delta) / period;
        losses = (losses * (period - 1)) / period;
      } else {
        gains = (gains * (period - 1)) / period;
        losses = (losses * (period - 1) - delta) / period;
      }
    }

    if (losses === 0) {
      return 70;
    }

    const rs = gains / losses;
    const rsi = 100 - 100 / (1 + rs);
    return Number(rsi.toFixed(2));
  }
}
