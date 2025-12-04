import { Card, CardContent, Typography, Box, Grid, Stack } from '@mui/material';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import type { Trade } from '../types';

interface PortfolioAnalyticsProps {
  trades: Trade[];
}

export function PortfolioAnalytics({ trades }: PortfolioAnalyticsProps) {
  const totalTrades = trades.length;
  const executedTrades = trades.filter(t => t.status === 'executed');

  const tradesWithPnL = executedTrades.map(trade => {
    const estimatedPnL = trade.side === 'LONG'
      ? ((trade.takeProfit || trade.entryPrice) - trade.entryPrice) * trade.collateral * trade.leverage
      : (trade.entryPrice - (trade.takeProfit || trade.entryPrice)) * trade.collateral * trade.leverage;
    return {
      ...trade,
      pnl: estimatedPnL
    };
  });

  const totalPnL = tradesWithPnL.reduce((acc, trade) => acc + trade.pnl, 0);

  const winningTrades = tradesWithPnL.filter(trade => trade.pnl > 0).length;
  const winRate = executedTrades.length > 0
    ? ((winningTrades / executedTrades.length) * 100).toFixed(1)
    : '0';

  const pnlChartData = (() => {
    if (tradesWithPnL.length === 0) {
      return [{ time: 'Now', value: 0 }];
    }

    const sortedTrades = [...tradesWithPnL].sort((a, b) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );

    let cumulativePnL = 0;
    const dataPoints = sortedTrades.map((trade, index) => {
      cumulativePnL += trade.pnl;
      return {
        time: `T${index + 1}`,
        value: cumulativePnL
      };
    });

    return [{ time: 'Start', value: 0 }, ...dataPoints];
  })();

  const assetAllocation = trades.reduce((acc, trade) => {
    acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(assetAllocation).map(([name, value]) => ({ name, value }));
  const COLORS = ['#7b61ff', '#22c55e', '#ef4444', '#f59e0b', '#06b6d4'];

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card sx={{
      bgcolor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'none',
    }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} color="white" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {trend && (
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 0.5 }}>
                {trend > 0 ? (
                  <TrendingUp size={14} color="#22c55e" />
                ) : (
                  <TrendingDown size={14} color="#ef4444" />
                )}
                <Typography variant="caption" sx={{ color: trend > 0 ? '#22c55e' : '#ef4444' }}>
                  {Math.abs(trend)}%
                </Typography>
              </Stack>
            )}
          </Box>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            bgcolor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={20} color={color} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom color="white" fontWeight={600} sx={{ mb: 3 }}>
          Portfolio Analytics
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Total P&L"
              value={`$${totalPnL.toFixed(2)}`}
              icon={DollarSign}
              trend={null}
              color={totalPnL >= 0 ? "#22c55e" : "#ef4444"}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Win Rate"
              value={`${winRate}%`}
              icon={TrendingUp}
              color="#7b61ff"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Total Trades"
              value={totalTrades}
              icon={Activity}
              color="#06b6d4"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              title="Active"
              value={trades.filter(t => t.status !== 'executed').length}
              icon={Activity}
              color="#f59e0b"
            />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              borderRadius: 2,
              p: 2,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Typography variant="subtitle2" color="rgba(255,255,255,0.8)" gutterBottom>
                P&L Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pnlChartData}>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" style={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: 'white',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#7b61ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              borderRadius: 2,
              p: 2,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <Typography variant="subtitle2" color="rgba(255,255,255,0.8)" gutterBottom>
                Asset Allocation
              </Typography>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: 'white',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="rgba(255,255,255,0.4)">
                    No data yet
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
