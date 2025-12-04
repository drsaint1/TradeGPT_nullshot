import { Card, CardContent, Typography, Box, Avatar, Button, Chip, Stack } from '@mui/material';
import { Trophy, Users, TrendingUp } from 'lucide-react';

interface Trader {
  id: string;
  name: string;
  winRate: number;
  totalPnL: number;
  trades: number;
  followers: number;
}

const mockTraders: Trader[] = [
  { id: '1', name: 'CryptoWhale', winRate: 78, totalPnL: 15420, trades: 142, followers: 523 },
  { id: '2', name: 'TraderPro', winRate: 72, totalPnL: 12100, trades: 89, followers: 381 },
  { id: '3', name: 'DiamondHands', winRate: 68, totalPnL: 9850, trades: 67, followers: 267 },
];

export function Leaderboard() {
  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Trophy size={20} color="#f59e0b" />
          <Typography variant='h6' color="white" fontWeight={600}>
            Top Traders
          </Typography>
          <Chip
            label="Copy Trading"
            size="small"
            sx={{
              ml: 'auto',
              bgcolor: 'rgba(123, 97, 255, 0.2)',
              color: '#a78bfa',
              fontWeight: 600,
            }}
          />
        </Box>

        <Stack spacing={2}>
          {mockTraders.map((trader, index) => (
            <Box
              key={trader.id}
              sx={{
                p: 2,
                bgcolor: index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${index === 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 2,
                position: 'relative',
              }}
            >
              {index === 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: -8,
                  right: 8,
                }}>
                  <Chip
                    label="🏆 #1"
                    size="small"
                    sx={{
                      bgcolor: '#f59e0b',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                    width: 40,
                    height: 40,
                    fontWeight: 700,
                  }}
                >
                  #{index + 1}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="white" fontWeight={700}>
                    {trader.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Users size={12} color="rgba(255,255,255,0.5)" />
                      <Typography variant="caption" color="rgba(255,255,255,0.5)">
                        {trader.followers}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="rgba(255,255,255,0.3)">
                      •
                    </Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      {trader.trades} trades
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" color="#22c55e" fontWeight={700}>
                    +${trader.totalPnL.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.6)">
                    {trader.winRate}% win rate
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="small"
                fullWidth
                startIcon={<TrendingUp size={16} />}
                sx={{
                  bgcolor: '#7b61ff',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#6a52e3',
                  },
                }}
              >
                Copy Trades
              </Button>
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            sx={{
              color: '#7b61ff',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(123, 97, 255, 0.1)',
              },
            }}
          >
            View Full Leaderboard
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
