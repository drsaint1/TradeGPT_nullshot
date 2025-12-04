import { Router } from 'express';
import { z } from 'zod';
import { TradeStore } from '../store/tradeStore.js';
import { SocketHub } from '../websocket.js';

const preparedTxSchema = z
  .object({
    to: z.string().length(42),
    data: z.string().min(2),
    value: z.string().min(1),
    chainId: z.number().optional(),
  })
  .optional();

const updateSchema = z.object({
  userId: z.string().min(1),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  leverage: z.number().optional(),
  collateral: z.number().optional(),
  status: z.enum(['draft', 'staged', 'executed', 'cancelled', 'expired']).optional(),
  transactionHash: z.string().optional(),
  preparedTx: preparedTxSchema,
});

const querySchema = z.object({
  userId: z.string().min(1),
});

export function buildTradeRouter(trades: TradeStore, sockets: SocketHub) {
  const router = Router();

  router.get('/', (req, res) => {
    const { userId } = querySchema.parse(req.query);
    res.json({ trades: trades.list(userId) });
  });

  router.patch('/:tradeId', (req, res) => {
    const tradeId = req.params.tradeId;
    const payload = updateSchema.parse(req.body);
    const updated = trades.update(payload.userId, tradeId, payload);
    if (!updated) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    sockets.broadcast({ type: 'trade.updated', payload: updated });
    res.json({ trade: updated });
  });

  return router;
}

