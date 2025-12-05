import 'dotenv/config';

export const appConfig = {
  port: Number(process.env.PORT ?? 4000),
  openAiKey: process.env.OPENAI_API_KEY ?? '',
  aiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
  marketDataEndpoint: (() => {
    const raw = process.env.MARKET_DATA_API ?? '';
    return raw.startsWith('http') ? raw : 'https://api.coingecko.com/api/v3';
  })(),
  marketDataApiKey: (() => {
    const direct = process.env.COINGECKO_API_KEY ?? '';
    if (direct) {
      return direct;
    }
    const fallback = process.env.MARKET_DATA_API ?? '';
    return fallback.startsWith('http') ? '' : fallback;
  })(),
  somniaRpcUrl: process.env.SOMNIA_RPC_URL ?? 'https://dream-rpc.somnia.network',
  factoryAddress: process.env.SOMNIA_FACTORY_ADDRESS ?? '',
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY ?? '',
  routerAddress: process.env.SOMNIA_ROUTER_ADDRESS ?? '',
  enableStreaming: (process.env.ENABLE_STREAMING ?? 'true').toLowerCase() === 'true',
};

export const featureFlags = {
  autoStageTrades: (process.env.AUTO_STAGE_TRADES ?? 'false').toLowerCase() === 'true',
};

export const securityConfig = {
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

