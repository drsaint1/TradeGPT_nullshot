import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Container, Stack, Typography, Tab, Tabs } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import { ChatWindow } from './components/ChatWindow';
import { TradeComposer } from './components/TradeComposer';
import { Portfolio } from './components/Portfolio';
import { CryptoChartViewer } from './components/CryptoChartViewer';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { NewsFeed } from './components/NewsFeed';
import { Leaderboard } from './components/Leaderboard';
import { PaperTradingToggle } from './components/PaperTradingToggle';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { SidebarNav } from './components/SidebarNav';
import { SmartAccountSetup } from './components/SmartAccountSetup';
import { FundManagement } from './components/FundManagement';
import { TokenFaucet } from './components/TokenFaucet';
import type { ChatMessage, Trade } from './types';
import { fetchTrades, sendChatMessage, stageTrade, updateTrade } from './api/trades';
import { useSocket } from './hooks/useSocket';
import { useSmartAccount } from './hooks/useSmartAccount';

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000/api';
const wsUrl = backendUrl.replace(/\/api$/, '');

function upsertTrade(list: Trade[], trade: Trade): Trade[] {
  const index = list.findIndex((item) => item.id === trade.id);
  if (index === -1) {
    return [trade, ...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  const updated = [...list];
  updated[index] = trade;
  return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isStaging, setIsStaging] = useState(false);
  const [isPaperTrading, setIsPaperTrading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('trade');
  const [showSmartAccountSetup, setShowSmartAccountSetup] = useState(false);

  const { address, chain } = useAccount();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();
  const { smartAccount, hasAccount, loading: loadingAccount, refetch: refetchAccount, factoryAddress, factoryAbi } = useSmartAccount();

  const userId = useMemo(() => {
    const existing = localStorage.getItem('tradegpt:userId');
    if (existing) {
      return existing;
    }
    const generated = uuidv4();
    localStorage.setItem('tradegpt:userId', generated);
    return generated;
  }, []);

  useEffect(() => {
    fetchTrades(userId).then(setTrades).catch(console.error);
  }, [userId]);

  useSocket(wsUrl, (event) => {
    if (event.type.startsWith('trade.')) {
      const trade = event.payload as Trade;
      setTrades((prev) => upsertTrade(prev, trade));
    }
  });

  const handleSend = useCallback(
    async (message: string) => {
      const optimisticMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setIsSending(true);
      try {
        const response = await sendChatMessage({ userId, message });
        const assistantMessage: ChatMessage = {
          ...response.reply,
          createdAt: response.reply.createdAt ?? new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (response.trade) {
          setTrades((prev) => upsertTrade(prev, response.trade as Trade));
          toast.success('Trade setup created! 🎯', {
            style: {
              background: '#111213',
              color: '#fff',
              border: '1px solid #7b61ff',
            },
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to get AI response', {
          style: {
            background: '#111213',
            color: '#fff',
            border: '1px solid #ef4444',
          },
        });
      } finally {
        setIsSending(false);
      }
    },
    [userId],
  );

  const activeTrade = trades[0];

  const handleUpdateTrade = useCallback(
    async (values: Partial<Pick<Trade, 'stopLoss' | 'takeProfit' | 'leverage' | 'collateral'>>) => {
      if (!activeTrade) {
        return;
      }
      try {
        const updated = await updateTrade({
          userId,
          tradeId: activeTrade.id,
          stopLoss: values.stopLoss,
          takeProfit: values.takeProfit,
          leverage: values.leverage,
          collateral: values.collateral,
        });
        setTrades((prev) => upsertTrade(prev, updated));
      } catch (error) {
        console.error(error);
      }
    },
    [activeTrade, userId],
  );

  const handleStage = useCallback(async () => {
    const client = walletClient.data;
    if (!activeTrade || !address || !client) {
      return;
    }

    if (!isPaperTrading) {
      toast.loading('Preparing transaction...', { id: 'staging' });
    }

    setIsStaging(true);
    try {
      if (isPaperTrading) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updated = await updateTrade({
          userId,
          tradeId: activeTrade.id,
          status: 'executed',
          transactionHash: '0xPAPER' + Math.random().toString(36).substring(7),
        });
        setTrades((prev) => upsertTrade(prev, updated));
        toast.success('Paper trade executed! 📊', {
          style: {
            background: '#111213',
            color: '#fff',
            border: '1px solid #22c55e',
          },
        });
      } else {
        const response = await stageTrade({
          userId,
          tradeId: activeTrade.id,
          account: address,
        });

        if (response.transaction) {
          if (response.transaction.chainId && chain && chain.id !== response.transaction.chainId) {
            toast.error('Wrong network! Please switch chains.', {
              style: { background: '#111213', color: '#fff', border: '1px solid #ef4444' },
            });
            setIsStaging(false);
            return;
          }

          toast.loading('Confirm in wallet...', { id: 'staging' });
          const txHash = await client.sendTransaction({
            to: response.transaction.to as `0x${string}`,
            data: response.transaction.data as `0x${string}`,
            value: response.transaction.value ? BigInt(response.transaction.value) : undefined,
            gas: 1000000n, 
            chain,
          });

          toast.loading('Waiting for confirmation...', { id: 'staging' });
          if (publicClient) {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          }

          const updated = await updateTrade({
            userId,
            tradeId: activeTrade.id,
            status: 'executed',
            transactionHash: txHash,
            preparedTx: response.transaction,
          });

          setTrades((prev) => upsertTrade(prev, updated));
          toast.success('Trade executed! 🚀', { id: 'staging', style: { background: '#111213', color: '#fff', border: '1px solid #22c55e' } });
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Transaction failed', { id: 'staging', style: { background: '#111213', color: '#fff', border: '1px solid #ef4444' } });
    } finally {
      setIsStaging(false);
    }
  }, [activeTrade, address, chain, publicClient, userId, walletClient.data, isPaperTrading]);

  const handlePaperTradingToggle = useCallback((newIsPaper: boolean) => {
    // If trying to switch to live trading (newIsPaper = false)
    if (!newIsPaper && address && !hasAccount && !loadingAccount) {
      // Show smart account setup modal
      setShowSmartAccountSetup(true);
      toast('Please create a trading account to enable live trading', {
        icon: '⚠️',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #f59e0b',
        },
      });
      return;
    }

    // Otherwise, allow the toggle
    setIsPaperTrading(newIsPaper);

    if (newIsPaper) {
      toast.success('Switched to Paper Trading Mode 📊', {
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });
    } else {
      toast('Live Trading Mode Active 🔴', {
        icon: '⚠️',
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #ef4444',
        },
      });
    }
  }, [address, hasAccount, loadingAccount]);

  const handleSmartAccountCreated = useCallback(() => {
    setShowSmartAccountSetup(false);
    refetchAccount();
    // Auto-switch to live trading after account creation
    setTimeout(() => {
      setIsPaperTrading(false);
      toast.success('Live Trading Mode Enabled! 🚀', {
        style: {
          background: '#111213',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });
    }, 2000);
  }, [refetchAccount]);

  return (
    <>
      <Toaster position="top-right" />
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#0a0b0d',
        color: 'white',
      }}>
        <Box
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(10,11,13,0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Container maxWidth='lg' sx={{ py: 2 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Box>
                <Typography variant='h5' fontWeight={700} sx={{
                  background: 'linear-gradient(90deg, #7b61ff 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  TradeGPT
                </Typography>
                <Typography variant='body2' color='rgba(255,255,255,0.6)' sx={{ mt: 0.5 }}>
                  AI-Powered Trading on Somnia
                </Typography>
              </Box>
              <Stack direction='row' spacing={2} alignItems='center'>
                <PaperTradingToggle isPaper={isPaperTrading} onToggle={handlePaperTradingToggle} />
                <ThemeSwitcher />
                <ConnectButton />
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
          <SidebarNav activeTab={sidebarTab} onTabChange={setSidebarTab} />

              {sidebarTab === 'trade' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <Grid container spacing={2}>
                <Grid xs={12} lg={7}>
                  <Box sx={{ height: { xs: '600px', lg: '750px' } }}>
                    <ChatWindow messages={messages} onSend={handleSend} isLoading={isSending} />
                  </Box>
                </Grid>

                <Grid xs={12} lg={5}>
                  <TradeComposer
                    trade={activeTrade}
                    onUpdate={handleUpdateTrade}
                    onStage={handleStage}
                    stagingDisabled={!address || !walletClient.data}
                    busy={isStaging}
                    smartAccount={smartAccount}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {sidebarTab === 'analytics' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <Grid container spacing={3}>
                {hasAccount && smartAccount && (
                  <Grid xs={12}>
                    <FundManagement smartAccount={smartAccount} />
                  </Grid>
                )}
                <Grid xs={12}>
                  <PortfolioAnalytics trades={trades} />
                </Grid>
              </Grid>
            </Box>
          )}

          {sidebarTab === 'chart' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <CryptoChartViewer />
            </Box>
          )}

          {sidebarTab === 'news' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <NewsFeed />
            </Box>
          )}

          {sidebarTab === 'traders' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <Leaderboard />
            </Box>
          )}

          {sidebarTab === 'history' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <Portfolio trades={trades} />
            </Box>
          )}

          {sidebarTab === 'settings' && (
            <Box sx={{ flex: 1, p: 3 }}>
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <TokenFaucet />
                </Grid>
                <Grid xs={12}>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="h6" color="white" gutterBottom>Settings</Typography>
                    <Typography variant="body2" color="rgba(255,255,255,0.6)">
                      Additional settings - Coming soon
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        {/* Smart Account Setup Modal */}
        {showSmartAccountSetup && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowSmartAccountSetup(false)}
          >
            <Box onClick={(e) => e.stopPropagation()}>
              <SmartAccountSetup
                factoryAddress={factoryAddress}
                factoryAbi={factoryAbi as any}
                onAccountCreated={handleSmartAccountCreated}
              />
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
