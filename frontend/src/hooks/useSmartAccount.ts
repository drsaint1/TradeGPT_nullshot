import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

const FACTORY_ABI = [
  {
    inputs: [{ name: 'accountOwner', type: 'address' }],
    name: 'getAccountsByOwner',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'accountOwner', type: 'address' },
      { name: 'customAgent', type: 'address' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useSmartAccount() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [smartAccount, setSmartAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!address || !publicClient) {
      setLoading(false);
      return;
    }

    async function checkAccount() {
      try {
        setLoading(true);
        if (!publicClient || !address) return;

        const accounts = (await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: 'getAccountsByOwner',
          args: [address as `0x${string}`],
        })) as readonly `0x${string}`[];

        console.log('[useSmartAccount] Factory:', FACTORY_ADDRESS);
        console.log('[useSmartAccount] Found accounts:', accounts);

        if (accounts && accounts.length > 0) {
          const newAccount = accounts[0];
          console.log('[useSmartAccount] Setting smart account:', newAccount);
          setSmartAccount(newAccount);
          setHasAccount(true);
        } else {
          console.log('[useSmartAccount] No accounts found');
          setSmartAccount(null);
          setHasAccount(false);
        }
      } catch (error) {
        console.error('Failed to check smart account:', error);
        setHasAccount(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccount();
  }, [address, publicClient, refreshKey]);

  const refetch = async () => {
    if (!address || !publicClient) return;

    try {
      const accounts = (await publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: 'getAccountsByOwner',
        args: [address as `0x${string}`],
      })) as readonly `0x${string}`[];

      console.log('[useSmartAccount.refetch] Found accounts:', accounts);

      if (accounts && accounts.length > 0) {
        setSmartAccount(accounts[0]);
        setHasAccount(true);
      } else {
        setSmartAccount(null);
        setHasAccount(false);
      }

      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to refetch smart account:', error);
    }
  };

  return { smartAccount, hasAccount, loading, refetch, factoryAddress: FACTORY_ADDRESS, factoryAbi: FACTORY_ABI };
}
