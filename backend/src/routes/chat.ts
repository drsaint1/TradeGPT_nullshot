import { Router } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import { AiRouter } from "../services/aiRouter.js";
import { ConversationStore } from "../store/conversationStore.js";
import { TradeStore } from "../store/tradeStore.js";
import { SocketHub } from "../websocket.js";
import { TradeTransactionBuilder } from "../services/tradeTransactionBuilder.js";
import { SmartAccountTransactionBuilder } from "../services/smartAccountTransactionBuilder.js";
import { appConfig } from "../config.js";
import factoryArtifact from "../abis/SomniaTradeFactory.json" with { type: "json" };
import accountArtifact from "../abis/SomniaTradeAccount.json" with { type: "json" };

const chatSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
});

export function buildChatRouter(
  aiRouter: AiRouter,
  conversations: ConversationStore,
  trades: TradeStore,
  sockets: SocketHub,
  builder: TradeTransactionBuilder,
) {
  const router = Router();
  const smartAccountBuilder = new SmartAccountTransactionBuilder();
  const provider = new ethers.JsonRpcProvider(appConfig.somniaRpcUrl);

  /**
   * Check if an EOA has a smart account
   */
  async function getSmartAccount(ownerAddress: string): Promise<string | null> {
    try {
      if (!appConfig.factoryAddress) {
        return null;
      }
      const factory = new ethers.Contract(
        appConfig.factoryAddress,
        factoryArtifact.abi,
        provider
      );
      const accounts = await factory.getAccountsByOwner(ownerAddress);
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error("Error checking smart account:", error);
      return null;
    }
  }

  router.post("/", async (req, res, next) => {
    try {
      const { userId, message } = chatSchema.parse(req.body);
      conversations.append(userId, "user", message);
      const history = conversations.history(userId);

      const aiResult = await aiRouter.generate({ userId, messages: history });
      conversations.append(userId, aiResult.reply.role, aiResult.reply.content);

      let storedTrade;
      if (aiResult.suggestion) {
        storedTrade = trades.upsert(userId, aiResult.suggestion);
        sockets.broadcast({ type: "trade.draft", payload: storedTrade });
      }

      res.json({
        reply: aiResult.reply,
        trade: storedTrade,
        stagedOnChain: false,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/stage", async (req, res, next) => {
    try {
      const body = z
        .object({
          userId: z.string().min(1),
          account: z.string().length(42),
          tradeId: z.string().uuid(),
        })
        .parse(req.body);

      const trade = trades.get(body.userId, body.tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const smartAccount = await getSmartAccount(body.account);

      let preparedTx;
      let stagedOnChain = false;

      try {
        if (smartAccount) {
          console.log(`Using smart account ${smartAccount} for trade ${body.tradeId}`);

          if (appConfig.agentPrivateKey && appConfig.agentPrivateKey !== '') {
            try {
              const agentWallet = new ethers.Wallet(appConfig.agentPrivateKey, provider);
              const accountContract = new ethers.Contract(
                smartAccount,
                accountArtifact.abi,
                agentWallet
              );

              const hasPending = await accountContract.hasPendingTrade();
              if (hasPending) {
                console.log(`Smart account has pending trade, canceling it first...`);
                const cancelTx = await accountContract.cancelTrade();
                await cancelTx.wait();
                console.log(`Previous trade canceled: ${cancelTx.hash}`);
              }

              const prepareTxData = smartAccountBuilder.buildExecute(smartAccount, trade);

              console.log(`Agent preparing trade on-chain for ${smartAccount}...`);
              const tx = await agentWallet.sendTransaction({
                to: prepareTxData.to,
                data: prepareTxData.data,
                value: prepareTxData.value,
              });

              console.log(`Trade prepared on-chain, tx: ${tx.hash}`);
              await tx.wait();
              stagedOnChain = true;

              preparedTx = smartAccountBuilder.buildSimpleExecute(smartAccount);
              console.log(`User can now execute trade via executeTrade()`);
            } catch (agentError) {
              console.error("Agent failed to prepare trade on-chain:", agentError);
              preparedTx = smartAccountBuilder.buildExecute(smartAccount, trade);
            }
          } else {
            console.log(`No agent key configured, user will prepare trade`);
            preparedTx = smartAccountBuilder.buildExecute(smartAccount, trade);
          }
        } else {
          console.log(`Using EOA ${body.account} for trade ${body.tradeId}`);
          preparedTx = builder.build(body.account, trade);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to build transaction";
        return res.status(500).json({ error: message });
      }

      const updated = trades.update(body.userId, body.tradeId, {
        status: "staged",
        preparedTx,
      });

      if (updated) {
        sockets.broadcast({ type: "trade.staged", payload: updated });
      }

      res.json({
        stagedOnChain,
        transaction: preparedTx,
        smartAccountUsed: !!smartAccount,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
