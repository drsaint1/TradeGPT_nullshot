import { OpenAI } from "openai";
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { appConfig } from "../config.js";
import { AiResponse, ChatMessage, TradeSuggestion } from "../types.js";
import { MarketDataService } from "./marketDataService.js";

interface ConversationContext {
  userId: string;
  messages: ChatMessage[];
}

const SYSTEM_PROMPT = `You are TradeGPT, an institutional-grade trading assistant operating on the Somnia blockchain.

IMPORTANT RULES:
1. Be conversational and answer questions directly when users ask informational questions (e.g., "What is ETH price?", "Should I buy now?")
2. Only provide structured trade recommendations when users explicitly request a trade setup
3. Use the current market data provided to give accurate, real-time analysis
4. Format trade recommendations with **bold** labels, each on a NEW LINE with a blank line between them:

**Asset**: [symbol]

**Direction**: LONG/SHORT

**Leverage**: [number]X

**Collateral**: $[amount]

**Entry**: $[price from market data]

**Stop Loss**: $[price]

**Take Profit**: $[price]

**Risk/Reward**: [ratio]

5. When answering price questions, use the EXACT price from the market snapshot provided
6. Be helpful, analytical, and provide context for your recommendations`;

export class AiRouter {
  private readonly openai?: OpenAI;
  private readonly gemini?: GenerativeModel;

  constructor(private readonly marketData: MarketDataService) {
    const openAiKey = appConfig.openAiKey.trim();
    if (openAiKey && !openAiKey.startsWith("<replace") && openAiKey.length > 10) {
      this.openai = new OpenAI({ apiKey: appConfig.openAiKey });
      console.log("✓ OpenAI configured");
    }
    const geminiKey = appConfig.geminiApiKey.trim();
    if (geminiKey && geminiKey.length > 10) {
      try {
        const geminiClient = new GoogleGenerativeAI(geminiKey);
      this.gemini = geminiClient.getGenerativeModel({
        model: appConfig.geminiModel,
        systemInstruction: SYSTEM_PROMPT,
      });
        console.log("✓ Gemini configured with model:", appConfig.geminiModel);
      } catch (error) {
        console.error("Failed to configure Gemini:", error);
      }
    }

    if (!this.openai && !this.gemini) {
      console.warn("⚠️  No AI provider configured. Using fallback responses.");
      console.warn("   Add GEMINI_API_KEY or OPENAI_API_KEY to .env");
    }
  }

  async generate(context: ConversationContext): Promise<AiResponse> {
    const latestUserMessage = context.messages[context.messages.length - 1];
    const inferredSymbol = this.detectSymbol(latestUserMessage.content) ?? "ETH";
    const snapshot = await this.marketData.getSnapshot(inferredSymbol);

    if (this.gemini) {
      return this.generateWithGemini(context, snapshot, latestUserMessage);
    }

    if (this.openai) {
      return this.generateWithOpenAI(context, snapshot, latestUserMessage);
    }

    throw new Error("No AI provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env file.");
  }

  private async generateWithOpenAI(
    context: ConversationContext,
    snapshot: Awaited<ReturnType<MarketDataService["getSnapshot"]>>,
    latestUserMessage: ChatMessage,
  ): Promise<AiResponse> {
    if (!this.openai) {
      throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to .env");
    }

    const openAiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...context.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "system" as const,
        content: `Latest market snapshot for ${snapshot.symbol}: price ${snapshot.price}, 24h change ${snapshot.change24h}%, RSI ${snapshot.rsi}.`,
      },
    ];

    const completion = await this.openai.chat.completions.create({
      model: appConfig.aiModel,
      messages: openAiMessages,
      temperature: 0.2,
    });

    const answer = completion.choices[0]?.message?.content ?? "Unable to process request.";
    const suggestion = this.deriveSuggestion(answer, snapshot, latestUserMessage.content);

    return {
      reply: {
        id: uuidv4(),
        role: "assistant",
        content: answer,
        createdAt: new Date(),
      },
      suggestion,
    };
  }

  private async generateWithGemini(
    context: ConversationContext,
    snapshot: Awaited<ReturnType<MarketDataService["getSnapshot"]>>,
    latestUserMessage: ChatMessage,
  ): Promise<AiResponse> {
    if (!this.gemini) {
      throw new Error("Gemini is not configured. Add GEMINI_API_KEY to .env");
    }

    const contents = context.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [
        {
          text: `Latest market snapshot for ${snapshot.symbol}: price ${snapshot.price}, 24h change ${snapshot.change24h}%, RSI ${snapshot.rsi}.`,
        },
      ],
    });

    const result = await this.gemini.generateContent({ contents });
    const answer = result.response.text() ?? "Unable to process request.";
    const suggestion = this.deriveSuggestion(answer, snapshot, latestUserMessage.content);

    return {
      reply: {
        id: uuidv4(),
        role: "assistant",
        content: answer,
        createdAt: new Date(),
      },
      suggestion,
    };
  }

  private generateFallback(userMessage: string, snapshot: Awaited<ReturnType<MarketDataService["getSnapshot"]>>): AiResponse {
    const trade = this.deriveSuggestion("", snapshot, userMessage);

    const explanation = [
      `Quick take on ${snapshot.symbol}: price ${snapshot.price.toFixed(2)} (24h change ${snapshot.change24h.toFixed(2)}%), RSI ${snapshot.rsi}.`,
      trade
        ? `Suggested ${trade.side} with ${trade.leverage}x leverage using ${trade.collateral} collateral. Stop loss ${trade.stopLoss}, take profit ${trade.takeProfit}.`
        : "No high-conviction setup detected; consider staying flat until momentum builds.",
      "You can adjust leverage, collateral, stop loss, or take profit before staging the transaction.",
    ].join("\n");

    return {
      reply: {
        id: uuidv4(),
        role: "assistant",
        content: explanation,
        createdAt: new Date(),
      },
      suggestion: trade ?? undefined,
    };
  }

  private detectSymbol(content: string): string | undefined {
    const lower = content.toLowerCase();
    if (lower.includes("btc")) {
      return "BTC";
    }
    if (lower.includes("eth")) {
      return "ETH";
    }
    if (lower.includes("sol")) {
      return "SOL";
    }
    const match = content.match(/([A-Z]{2,6})/);
    return match ? match[1].toUpperCase() : undefined;
  }

  private deriveSuggestion(
    responseText: string,
    snapshot: Awaited<ReturnType<MarketDataService["getSnapshot"]>>,
    userMessage: string,
  ): TradeSuggestion | undefined {
    const combined = `${responseText}\n${userMessage}`.toLowerCase();
    const side: "LONG" | "SHORT" = combined.includes("short") && !combined.includes("long") ? "SHORT" : "LONG";

    const leverageMatch = combined.match(/(\d+(?:\.\d+)?)\s*x/);
    const leverage = leverageMatch ? Number(leverageMatch[1]) : 5;

    const collateralMatch = combined.match(/(\d+(?:\.\d+)?)\s*(usdc|usd|eth)?/);
    const collateral = collateralMatch ? Number(collateralMatch[1]) : 100;

    const riskMultiple = side === "LONG" ? 0.97 : 1.03;
    const rewardMultiple = side === "LONG" ? 1.06 : 0.94;

    const stopLoss = Number((snapshot.price * riskMultiple).toFixed(2));
    const takeProfit = Number((snapshot.price * rewardMultiple).toFixed(2));

    return {
      id: uuidv4(),
      asset: snapshot.symbol,
      symbol: snapshot.symbol,
      side,
      leverage,
      collateral,
      stopLoss,
      takeProfit,
      rationale: `Momentum is ${snapshot.change24h >= 0 ? "bullish" : "bearish"} with RSI ${snapshot.rsi}. Risk defined at ${stopLoss}.`,
      confidence: Math.min(95, Math.max(40, 60 + snapshot.change24h * 5)),
      riskReward: Number(((Math.abs(takeProfit - snapshot.price) / Math.abs(snapshot.price - stopLoss)) || 1).toFixed(2)),
      entryPrice: snapshot.price,
      metadata: {
        price: snapshot.price,
        change24h: snapshot.change24h,
      },
    };
  }

}
