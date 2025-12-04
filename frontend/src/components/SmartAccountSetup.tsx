import { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Stack, Alert } from '@mui/material';
import { AccountBalanceWallet, CheckCircle } from '@mui/icons-material';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import toast from 'react-hot-toast';

interface SmartAccountSetupProps {
  factoryAddress: string;
  factoryAbi: any[];
  onAccountCreated: () => void;
}

export function SmartAccountSetup({ factoryAddress, factoryAbi, onAccountCreated }: SmartAccountSetupProps) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createAccount = async () => {
    if (!address) return;

    try {
      await writeContract({
        address: factoryAddress as `0x${string}`,
        abi: factoryAbi,
        functionName: 'createAccount',
        args: [address, '0x0000000000000000000000000000000000000000'],
        gas: 50000000n, 
      });

      toast.loading('Creating your trading account...', { id: 'create-account' });
    } catch (err: any) {
      console.error('Failed to create account:', err);
      toast.error(err.message || 'Failed to create account', { id: 'create-account' });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success('Trading account created successfully! 🎉', {
        id: 'create-account',
        duration: 5000,
      });
      setTimeout(() => {
        onAccountCreated();
      }, 2000);
    }
  }, [isSuccess, onAccountCreated]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to create account. Please try again.', { id: 'create-account' });
    }
  }, [error]);

  return (
    <Card
        sx={{
          maxWidth: 600,
          bgcolor: '#111213',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(123, 97, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWallet sx={{ fontSize: 40, color: '#7b61ff' }} />
            </Box>

            <Typography variant="h4" fontWeight={700} color="white" textAlign="center">
              Welcome to TradeGPT
            </Typography>

            <Typography variant="body1" color="rgba(255,255,255,0.7)" textAlign="center">
              To start trading with AI-powered insights, we need to create a secure trading account for you.
              This is a one-time setup that takes just a few seconds.
            </Typography>

            <Box sx={{ width: '100%', mt: 2 }}>
              <Alert
                severity="info"
                sx={{
                  bgcolor: 'rgba(123, 97, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(123, 97, 255, 0.3)',
                  '& .MuiAlert-icon': {
                    color: '#7b61ff'
                  }
                }}
              >
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Benefits of Smart Trading Account:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                    Automated stop-loss protection
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                    One-time token approvals
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                    AI prepares trades, you just approve
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#22c55e' }} />
                    Enhanced security and control
                  </Typography>
                </Stack>
              </Alert>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={createAccount}
              disabled={isPending || isConfirming}
              sx={{
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
                  bgcolor: 'rgba(123, 97, 255, 0.5)',
                },
              }}
            >
              {isPending || isConfirming ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  {isPending ? 'Confirm in Wallet...' : 'Creating Account...'}
                </>
              ) : (
                'Create My Trading Account'
              )}
            </Button>

            <Typography variant="caption" color="rgba(255,255,255,0.5)" textAlign="center">
              This will create a smart contract account on Somnia blockchain.
              <br />
              Estimated gas cost: ~0.2-0.25 STT (one-time cost)
            </Typography>
          </Stack>
        </CardContent>
      </Card>
  );
}
