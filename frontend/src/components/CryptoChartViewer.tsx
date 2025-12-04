import { useState } from 'react';
import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton, Stack } from '@mui/material';
import { TradingChart } from './TradingChart';

const CRYPTO_SYMBOLS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
];

export function CryptoChartViewer() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');

  const handleSymbolChange = (_event: React.MouseEvent<HTMLElement>, newSymbol: string | null) => {
    if (newSymbol !== null) {
      setSelectedSymbol(newSymbol);
    }
  };

  return (
    <Box>
      <Card sx={{
        bgcolor: "#111213",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        mb: 2
      }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Typography variant="h6" color="white" fontWeight={600}>
              Live Crypto Charts
            </Typography>
            <ToggleButtonGroup
              value={selectedSymbol}
              exclusive
              onChange={handleSymbolChange}
              aria-label="crypto selection"
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255,255,255,0.6)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: '#7b61ff',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#6a52e3',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(123, 97, 255, 0.1)',
                  },
                },
              }}
            >
              {CRYPTO_SYMBOLS.map((crypto) => (
                <ToggleButton key={crypto.symbol} value={crypto.symbol}>
                  {crypto.symbol}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      <TradingChart symbol={selectedSymbol} />
    </Box>
  );
}
