import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Stack,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { AccountBalanceWallet, TrendingUp, TrendingDown, ContentCopy } from '@mui/icons-material';
import { useAccount, useBalance, usePublicClient, useWalletClient, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, formatUnits, parseUnits } from 'viem';
import toast from 'react-hot-toast';

const TOKENS = [
  {
    symbol: 'USDC',
    name: 'Test USDC',
    address: import.meta.env.VITE_USDC_ADDRESS,
    decimals: 6,
    color: '#2775CA',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped ETH',
    address: import.meta.env.VITE_WETH_ADDRESS,
    decimals: 18,
    color: '#627EEA',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: import.meta.env.VITE_WBTC_ADDRESS,
    decimals: 8,
    color: '#F7931A',
  },
  {
    symbol: 'WSOL',
    name: 'Wrapped SOL',
    address: import.meta.env.VITE_WSOL_ADDRESS,
    decimals: 9,
    color: '#14F195',
  },
];

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

const SMART_ACCOUNT_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'recoverFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approveToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

interface FundManagementProps {
  smartAccount: string;
}

function TokenBalanceRow({
  token,
  eoaAddress,
  smartAccountAddress
}: {
  token: typeof TOKENS[0];
  eoaAddress: string;
  smartAccountAddress: string;
}) {
  const { data: eoaBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [eoaAddress as `0x${string}`],
  });

  const { data: smartBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [smartAccountAddress as `0x${string}`],
  });

  const eoaFormatted = eoaBalance
    ? parseFloat(formatUnits(eoaBalance, token.decimals)).toFixed(4)
    : '0.0000';

  const smartFormatted = smartBalance
    ? parseFloat(formatUnits(smartBalance, token.decimals)).toFixed(4)
    : '0.0000';

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: token.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: 'white',
            }}
          >
            {token.symbol.slice(0, 2)}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="white">
              {token.symbol}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)">
              {token.name}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="white" fontFamily="monospace">
          {eoaFormatted}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" color="#22c55e" fontWeight={600} fontFamily="monospace">
          {smartFormatted}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function FundManagement({ smartAccount }: FundManagementProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const { writeContract: writeDepositContract, data: depositHash } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  const { writeContract: writeWithdrawContract, data: withdrawHash } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

  const { writeContract: writeApproveContract, data: approveHash } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [selectedDepositToken, setSelectedDepositToken] = useState('USDC');
  const [selectedWithdrawToken, setSelectedWithdrawToken] = useState('USDC');

  const { data: smartAccountBalance, refetch: refetchSmartBalance } = useBalance({
    address: smartAccount as `0x${string}`,
  });

  const { data: eoaBalance } = useBalance({
    address: address as `0x${string}`,
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(smartAccount);
    toast.success('Smart account address copied!', {
      icon: '📋',
      style: {
        background: '#111213',
        color: '#fff',
        border: '1px solid #7b61ff',
      },
    });
  };

  const handleDeposit = async () => {
    if (!address || !depositAmount || !walletClient.data) return;

    setIsDepositing(true);
    toast.loading('Preparing deposit...', { id: 'deposit' });

    try {
      if (selectedDepositToken === 'STT') {
        const amount = parseEther(depositAmount);

        const hash = await walletClient.data.sendTransaction({
          to: smartAccount as `0x${string}`,
          value: amount,
        });

        toast.loading('Confirming deposit...', { id: 'deposit' });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        toast.success(`Deposited ${depositAmount} ${selectedDepositToken} successfully!`, {
          id: 'deposit',
          style: {
            background: '#111213',
            color: '#fff',
            border: '1px solid #22c55e',
          },
        });

        setDepositAmount('');
        setTimeout(() => refetchSmartBalance(), 2000);
      } else {
        const token = TOKENS.find(t => t.symbol === selectedDepositToken);
        if (!token) return;

        const amount = parseUnits(depositAmount, token.decimals);

        toast.loading('Confirm deposit in wallet...', { id: 'deposit' });

        writeDepositContract({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [smartAccount as `0x${string}`, amount],
          gas: 100000n,
        });

      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Deposit failed', { id: 'deposit' });
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) return;

    setIsWithdrawing(true);
    toast.loading('Confirm withdrawal in wallet...', { id: 'withdraw' });

    try {
      if (selectedWithdrawToken === 'STT') {
        const amount = parseEther(withdrawAmount);

        writeWithdrawContract({
          address: smartAccount as `0x${string}`,
          abi: SMART_ACCOUNT_ABI,
          functionName: 'recoverFunds',
          args: [
            '0x0000000000000000000000000000000000000000', 
            address as `0x${string}`,
            amount,
          ],
          gas: 150000n,
        });
      } else {
        const token = TOKENS.find(t => t.symbol === selectedWithdrawToken);
        if (!token) return;

        const amount = parseUnits(withdrawAmount, token.decimals);

        writeWithdrawContract({
          address: smartAccount as `0x${string}`,
          abi: SMART_ACCOUNT_ABI,
          functionName: 'recoverFunds',
          args: [
            token.address as `0x${string}`,
            address as `0x${string}`,
            amount,
          ],
          gas: 150000n,
        });
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Withdrawal failed', { id: 'withdraw' });
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    if (depositSuccess) {
      toast.success(`Deposited ${depositAmount} ${selectedDepositToken} successfully!`, {
        id: 'deposit',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });

      setDepositAmount('');
      setIsDepositing(false);
      setTimeout(() => refetchSmartBalance(), 2000);
    }
  }, [depositSuccess]);

  useEffect(() => {
    if (withdrawSuccess) {
      toast.success(`Withdrew ${withdrawAmount} ${selectedWithdrawToken} successfully!`, {
        id: 'withdraw',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });

      setWithdrawAmount('');
      setIsWithdrawing(false);
      setTimeout(() => refetchSmartBalance(), 2000);
    }
  }, [withdrawSuccess]);

  const handleApproveRouter = async () => {
    if (!address) return;

    const ROUTER_ADDRESS = import.meta.env.VITE_ROUTER_ADDRESS;
    const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    setIsApproving(true);
    toast.loading('Approving router for all tokens...', { id: 'approve' });

    try {
      for (const token of TOKENS) {
        writeApproveContract({
          address: smartAccount as `0x${string}`,
          abi: SMART_ACCOUNT_ABI,
          functionName: 'approveToken',
          args: [
            token.address as `0x${string}`,
            ROUTER_ADDRESS as `0x${string}`,
            BigInt(MAX_UINT256),
          ],
          gas: 100000n,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast.loading('Confirming approvals...', { id: 'approve' });
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Approval failed', { id: 'approve' });
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (approveSuccess) {
      toast.success('Router approved successfully! You can now execute trades.', {
        id: 'approve',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });
      setIsApproving(false);
    }
  }, [approveSuccess]);

  return (
    <Card
      sx={{
        bgcolor: '#111213',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <AccountBalanceWallet sx={{ color: '#7b61ff' }} />
          <Typography variant="h6" color="white" fontWeight={600}>
            Fund Management
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(123, 97, 255, 0.05)',
            border: '1px solid rgba(123, 97, 255, 0.2)',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.6)">
                Smart Account Address
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
                onClick={copyAddress}
                sx={{
                  color: '#7b61ff',
                  textTransform: 'none',
                  minWidth: 'auto',
                  p: 0.5,
                }}
              >
                Copy
              </Button>
            </Box>
            <Typography
              variant="body2"
              fontFamily="monospace"
              color="white"
              sx={{
                wordBreak: 'break-all',
                fontSize: '0.75rem',
              }}
            >
              {smartAccount}
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={2} mb={3}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  Trading Account Balance
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#22c55e" sx={{ mt: 0.5 }}>
                  {smartAccountBalance
                    ? `${parseFloat(smartAccountBalance.formatted).toFixed(4)} ${smartAccountBalance.symbol}`
                    : '0.0000 STT'}
                </Typography>
              </Box>
              <TrendingUp sx={{ color: '#22c55e', fontSize: 32 }} />
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  Your Wallet Balance
                </Typography>
                <Typography variant="h6" fontWeight={600} color="white" sx={{ mt: 0.5 }}>
                  {eoaBalance
                    ? `${parseFloat(eoaBalance.formatted).toFixed(4)} ${eoaBalance.symbol}`
                    : '0.0000 STT'}
                </Typography>
              </Box>
              <AccountBalanceWallet sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 28 }} />
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

        <Box mb={3}>
          <Typography variant="h6" color="white" fontWeight={600} mb={2}>
            Token Balances
          </Typography>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'none',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Token
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Wallet
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Trading Account
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#7b61ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          color: 'white',
                        }}
                      >
                        ST
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="white">
                          STT
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">
                          Somnia Test Token
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" color="white" fontFamily="monospace">
                      {eoaBalance ? parseFloat(eoaBalance.formatted).toFixed(4) : '0.0000'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" color="#22c55e" fontWeight={600} fontFamily="monospace">
                      {smartAccountBalance ? parseFloat(smartAccountBalance.formatted).toFixed(4) : '0.0000'}
                    </Typography>
                  </TableCell>
                </TableRow>
                {address && TOKENS.map((token) => (
                  <TokenBalanceRow
                    key={token.symbol}
                    token={token}
                    eoaAddress={address}
                    smartAccountAddress={smartAccount}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Alert
            severity="info"
            sx={{
              mt: 2,
              bgcolor: 'rgba(123, 97, 255, 0.1)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(123, 97, 255, 0.3)',
              '& .MuiAlert-icon': {
                color: '#7b61ff',
              },
            }}
          >
            <Typography variant="caption">
              <strong>💡 Tip:</strong> Get free test tokens from the <strong>Faucet</strong> tab, then deposit them to your Trading Account for AI-powered trading!
            </Typography>
          </Alert>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

        <Box mb={3}>
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              bgcolor: 'rgba(234, 179, 8, 0.1)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              '& .MuiAlert-icon': {
                color: '#eab308',
              },
            }}
          >
            <Typography variant="caption" display="block" mb={1}>
              <strong>⚠️ Required for Trading:</strong> Approve the router to spend tokens from your trading account.
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)">
              This is a one-time setup. The router needs permission to execute trades on your behalf.
            </Typography>
          </Alert>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApproveRouter}
            disabled={isApproving || isApproveConfirming}
            sx={{
              bgcolor: '#eab308',
              color: '#000',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#ca8a04',
              },
              '&:disabled': {
                bgcolor: 'rgba(234, 179, 8, 0.3)',
                color: 'rgba(0,0,0,0.5)',
              },
            }}
          >
            {isApproving || isApproveConfirming ? 'Approving Router...' : '🔐 Approve Router for Trading'}
          </Button>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

        <Box mb={3}>
          <Typography variant="subtitle2" color="white" fontWeight={600} mb={1.5}>
            Deposit Funds
          </Typography>
          <Stack direction="row" spacing={1} mb={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedDepositToken}
                onChange={(e) => setSelectedDepositToken(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
              >
                <MenuItem value="STT">STT</MenuItem>
                {TOKENS.map((token) => (
                  <MenuItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              placeholder="Amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              type="number"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                },
                '& input': {
                  color: 'white',
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleDeposit}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
              sx={{
                bgcolor: '#22c55e',
                minWidth: '100px',
                '&:hover': {
                  bgcolor: '#16a34a',
                },
                '&:disabled': {
                  bgcolor: 'rgba(34, 197, 94, 0.3)',
                },
              }}
            >
              {isDepositing ? 'Depositing...' : 'Deposit'}
            </Button>
          </Stack>
          <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, display: 'block' }}>
            Transfer {selectedDepositToken} from your wallet to trading account
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" color="white" fontWeight={600} mb={1.5}>
            Withdraw Funds
          </Typography>
          <Stack direction="row" spacing={1} mb={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedWithdrawToken}
                onChange={(e) => setSelectedWithdrawToken(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  },
                }}
              >
                <MenuItem value="STT">STT</MenuItem>
                {TOKENS.map((token) => (
                  <MenuItem key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              placeholder="Amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              type="number"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                },
                '& input': {
                  color: 'white',
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawing || isWithdrawConfirming}
              sx={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                minWidth: '100px',
                '&:hover': {
                  borderColor: '#ef4444',
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                },
                '&:disabled': {
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: 'rgba(239, 68, 68, 0.3)',
                },
              }}
            >
              {isWithdrawing || isWithdrawConfirming ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </Stack>
          <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, display: 'block' }}>
            Transfer {selectedWithdrawToken} back to your wallet
          </Typography>
        </Box>

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
            <strong>💡 Tip:</strong> Keep funds in your trading account for automated stop-loss execution and faster trades. You can deposit and withdraw anytime!
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}
