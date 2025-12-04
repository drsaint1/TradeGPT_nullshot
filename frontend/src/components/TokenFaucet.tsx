import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import toast from 'react-hot-toast';

const TOKENS = [
  {
    symbol: 'USDC',
    name: 'Test USDC',
    address: import.meta.env.VITE_USDC_ADDRESS,
    amount: '1,000',
    decimals: 6,
    color: '#2775CA',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped ETH',
    address: import.meta.env.VITE_WETH_ADDRESS,
    amount: '1,000',
    decimals: 18,
    color: '#627EEA',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: import.meta.env.VITE_WBTC_ADDRESS,
    amount: '1,000',
    decimals: 8,
    color: '#F7931A',
  },
  {
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    address: import.meta.env.VITE_WSOL_ADDRESS,
    amount: '1,000',
    decimals: 9,
    color: '#14F195',
  },
];

const FAUCET_ABI = [
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function TokenFaucet() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [selectedToken, setSelectedToken] = useState<string>('');

  const handleGetTokens = async (tokenAddress: string, tokenSymbol: string) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSelectedToken(tokenSymbol);
    toast.loading(`Requesting ${tokenSymbol}...`, { id: 'faucet' });

    try {
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'faucet',
        gas: 100000n, 
      });
    } catch (error: any) {
      console.error('Faucet error:', error);
      toast.error(error.message || 'Failed to get tokens', { id: 'faucet' });
      setSelectedToken('');
    }
  };

  useEffect(() => {
    if (isSuccess && selectedToken) {
      toast.success(`Successfully received 1,000 ${selectedToken}! 🎉`, {
        id: 'faucet',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
        duration: 5000,
      });
      setSelectedToken('');
    }
  }, [isSuccess, selectedToken]);

  const handleGetAllTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    toast.loading('Getting all tokens...', { id: 'faucet-all' });

    try {
      for (const token of TOKENS) {
        await writeContract({
          address: token.address as `0x${string}`,
          abi: FAUCET_ABI,
          functionName: 'faucet',
          gas: 100000n, 
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.success('Successfully received all tokens! 🎉', {
        id: 'faucet-all',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });
    } catch (error: any) {
      console.error('Faucet error:', error);
      toast.error(error.message || 'Failed to get tokens', { id: 'faucet-all' });
    }
  };

  return (
    <Card
      sx={{
        bgcolor: '#111213',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700} color="white" gutterBottom>
            🚰 Token Faucet
          </Typography>
          <Typography variant="body2" color="rgba(255,255,255,0.6)">
            Get free test tokens to start trading. Each token gives you 1,000 units.
          </Typography>
        </Box>

        {!isConnected && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              bgcolor: 'rgba(255, 193, 7, 0.1)',
              color: '#ffc107',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              '& .MuiAlert-icon': {
                color: '#ffc107',
              },
            }}
          >
            Please connect your wallet to use the faucet
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleGetAllTokens}
          disabled={!isConnected || isPending || isConfirming}
          sx={{
            mb: 3,
            bgcolor: '#7b61ff',
            color: 'white',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#6a52e3',
            },
            '&:disabled': {
              bgcolor: 'rgba(123, 97, 255, 0.3)',
            },
          }}
        >
          {isPending || isConfirming ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Getting Tokens...
            </>
          ) : (
            '🎁 Get All Tokens (One Click)'
          )}
        </Button>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="caption" color="rgba(255,255,255,0.5)">
            or get individual tokens below
          </Typography>
        </Box>

        <Stack spacing={2}>
          {TOKENS.map((token) => (
            <Box
              key={token.symbol}
              sx={{
                p: 2,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: token.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: 'white',
                  }}
                >
                  {token.symbol.slice(0, 2)}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600} color="white">
                    {token.symbol}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">
                    {token.name}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`+${token.amount}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    fontWeight: 600,
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleGetTokens(token.address, token.symbol)}
                  disabled={!isConnected || (isPending && selectedToken === token.symbol) || isConfirming}
                  sx={{
                    borderColor: token.color,
                    color: token.color,
                    minWidth: '80px',
                    '&:hover': {
                      borderColor: token.color,
                      bgcolor: `${token.color}20`,
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  {isPending && selectedToken === token.symbol ? (
                    <CircularProgress size={16} />
                  ) : (
                    'Get'
                  )}
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>

        <Alert
          severity="info"
          sx={{
            mt: 3,
            bgcolor: 'rgba(123, 97, 255, 0.1)',
            color: 'rgba(255,255,255,0.8)',
            border: '1px solid rgba(123, 97, 255, 0.3)',
            '& .MuiAlert-icon': {
              color: '#7b61ff',
            },
          }}
        >
          <Typography variant="caption">
            <strong>💡 Tip:</strong> You can request tokens as many times as you need! Each request gives you 1,000 tokens instantly.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
