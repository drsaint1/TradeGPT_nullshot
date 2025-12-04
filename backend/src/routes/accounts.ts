import { Router } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import { appConfig } from '../config.js';

const FACTORY_ABI = [
  {
    inputs: [{ name: 'accountOwner', type: 'address' }],
    name: 'getAccountsByOwner',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
];

const accountQuerySchema = z.object({
  ownerAddress: z.string().length(42),
});

export function buildAccountRouter() {
  const router = Router();
  const provider = new ethers.JsonRpcProvider(appConfig.somniaRpcUrl);

  router.get('/smart-account/:ownerAddress', async (req, res, next) => {
    try {
      const { ownerAddress } = accountQuerySchema.parse(req.params);

      if (!appConfig.factoryAddress) {
        return res.status(500).json({ error: 'Factory address not configured' });
      }

      const factory = new ethers.Contract(
        appConfig.factoryAddress,
        FACTORY_ABI,
        provider
      );

      const accounts = await factory.getAccountsByOwner(ownerAddress);

      res.json({
        hasAccount: accounts.length > 0,
        smartAccount: accounts.length > 0 ? accounts[0] : null,
        totalAccounts: accounts.length,
        accounts: accounts,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/smart-account/:ownerAddress/balance', async (req, res, next) => {
    try {
      const { ownerAddress } = accountQuerySchema.parse(req.params);

      if (!appConfig.factoryAddress) {
        return res.status(500).json({ error: 'Factory address not configured' });
      }

      const factory = new ethers.Contract(
        appConfig.factoryAddress,
        FACTORY_ABI,
        provider
      );

      const accounts = await factory.getAccountsByOwner(ownerAddress);

      if (accounts.length === 0) {
        return res.json({ balance: '0', hasAccount: false });
      }

      const smartAccount = accounts[0];
      const balance = await provider.getBalance(smartAccount);

      res.json({
        hasAccount: true,
        smartAccount,
        balance: balance.toString(),
        balanceFormatted: ethers.formatEther(balance),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
