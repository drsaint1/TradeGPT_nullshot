import { ethers } from 'ethers';
import { appConfig } from '../config.js';
import type { PreparedTransaction, TradeSuggestion } from '../types.js';
import routerArtifact from '../abis/ISomniaDexRouter.json' with { type: 'json' };

const KNOWN_ASSETS: Record<string, string> = {
  STT: process.env.SOMNIA_STT_ADDRESS ?? ethers.ZeroAddress,
  ETH: process.env.SOMNIA_ETH_ADDRESS ?? ethers.ZeroAddress,
  BTC: process.env.SOMNIA_BTC_ADDRESS ?? ethers.ZeroAddress,
  SOL: process.env.SOMNIA_SOL_ADDRESS ?? ethers.ZeroAddress,
  USDC: process.env.SOMNIA_USDC_ADDRESS ?? ethers.ZeroAddress,
};

const ASSET_DECIMALS: Record<string, number> = {
  STT: 18,
  ETH: 18,
  BTC: 8,
  SOL: 9,
  USDC: 6,
};

const DEFAULT_CHAIN_ID = Number(process.env.VITE_SOMNIA_CHAIN_ID ?? 50312);

export class TradeTransactionBuilder {
  private readonly routerInterface = new ethers.Interface(routerArtifact.abi);
  private readonly routerAddress = appConfig.routerAddress;

  build(accountAddress: string, trade: TradeSuggestion): PreparedTransaction {
    if (!this.routerAddress) {
      throw new Error('SOMNIA_ROUTER_ADDRESS not configured');
    }

    const symbol = trade.symbol.toUpperCase();
    const assetAddress = KNOWN_ASSETS[symbol] ?? ethers.ZeroAddress;

    const collateralDecimals = trade.side === 'LONG'
      ? ASSET_DECIMALS['USDC']
      : ASSET_DECIMALS[symbol] ?? 18;

    const collateralAmount = ethers.parseUnits(trade.collateral.toString(), collateralDecimals);

    const leverageBps = BigInt(Math.round(trade.leverage * 100));
    const stopLoss = trade.stopLoss ? ethers.parseUnits(trade.stopLoss.toString(), 2) : 0n;
    const takeProfit = trade.takeProfit ? ethers.parseUnits(Number(trade.takeProfit).toFixed(2), 2) : 0n;

    const metadataPayload = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string'],
      [
        JSON.stringify({
          rationale: trade.rationale,
          confidence: trade.confidence,
          entryPrice: trade.entryPrice,
        }),
      ],
    );

    const callData = this.routerInterface.encodeFunctionData('executeTrade', [
      accountAddress,
      assetAddress,
      trade.side === 'LONG',
      collateralAmount,
      leverageBps,
      stopLoss,
      takeProfit,
      metadataPayload,
    ]);

    return {
      to: this.routerAddress,
      data: callData,
      value: '0',
      chainId: DEFAULT_CHAIN_ID,
    };
  }
}

