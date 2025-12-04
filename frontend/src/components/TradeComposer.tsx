import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { RiskScore } from './RiskScore';
import type { Trade, TradeSide } from '../types';

interface TradeComposerProps {
  trade?: Trade;
  onUpdate(values: Partial<Pick<Trade, 'stopLoss' | 'takeProfit' | 'leverage' | 'collateral'>>): void;
  onStage(): void;
  stagingDisabled?: boolean;
  busy?: boolean;
  smartAccount?: string | null;
}

const sides: TradeSide[] = ['LONG', 'SHORT'];

export function TradeComposer({ trade, onUpdate, onStage, stagingDisabled, busy, smartAccount }: TradeComposerProps) {
  const [local, setLocal] = useState({
    stopLoss: trade?.stopLoss ?? 0,
    takeProfit: trade?.takeProfit ?? 0,
    leverage: trade?.leverage ?? 1,
    collateral: trade?.collateral ?? 0,
  });

  useEffect(() => {
    if (trade) {
      setLocal({
        stopLoss: trade.stopLoss ?? 0,
        takeProfit: trade.takeProfit ?? 0,
        leverage: trade.leverage,
        collateral: trade.collateral,
      });
    }
  }, [trade?.id]);

  if (!trade) {
    return (
      <Card sx={{
        bgcolor: "#111213",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom color="white" fontWeight={600}>
            Trade Composer
          </Typography>
          <Typography variant='body2' sx={{ color: "rgba(255,255,255,0.6)" }}>
            Ask the AI for a trade setup to begin. You'll be able to adjust parameters and execute directly from your wallet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (field: keyof typeof local, value: number) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onUpdate({ [field]: value });
  };

  const { status } = trade;
  const lastTx = trade.transactionHash ?? 'pending';

  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6' color="white" fontWeight={600}>Trade Setup</Typography>
          <Stack direction="row" spacing={1}>
            {smartAccount && (
              <Chip
                label="Smart Account"
                size="small"
                sx={{
                  bgcolor: 'rgba(123, 97, 255, 0.2)',
                  color: '#7b61ff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  border: '1px solid #7b61ff',
                }}
              />
            )}
            <Chip
              label={status.toUpperCase()}
              size="small"
              sx={{
                bgcolor: status === 'executed' ? 'rgba(34, 197, 94, 0.2)' : status === 'staged' ? 'rgba(168, 139, 250, 0.2)' : 'rgba(255,255,255,0.1)',
                color: status === 'executed' ? '#22c55e' : status === 'staged' ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                fontWeight: 600,
                border: '1px solid',
                borderColor: status === 'executed' ? '#22c55e' : status === 'staged' ? '#a78bfa' : 'rgba(255,255,255,0.2)',
              }}
            />
          </Stack>
        </Box>
        <Stack direction='row' spacing={2} alignItems="center">
          <Typography variant='h4' color="white" fontWeight={700}>{trade.symbol}</Typography>
          <Chip
            label={trade.side}
            size="medium"
            sx={{
              bgcolor: trade.side === 'LONG' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: '1px solid',
              borderColor: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
            }}
          />
        </Stack>
        <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", fontStyle: "italic" }}>
          {trade.rationale}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            fullWidth
            label='Direction'
            value={trade.side}
            disabled
            helperText='AI Recommended'
            size="small"
            sx={textFieldStyles}
          >
            {sides.map((side) => (
              <MenuItem key={side} value={side}>
                {side}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label='Leverage'
            type='number'
            value={local.leverage}
            onChange={(event) => handleChange('leverage', Number(event.target.value))}
            size="small"
            sx={textFieldStyles}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            label='Collateral (USDC)'
            type='number'
            value={local.collateral}
            onChange={(event) => handleChange('collateral', Number(event.target.value))}
            size="small"
            sx={textFieldStyles}
          />
          <TextField
            fullWidth
            label='Entry Price'
            type='number'
            value={trade.entryPrice}
            disabled
            size="small"
            sx={textFieldStyles}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            label='Stop Loss'
            type='number'
            value={local.stopLoss}
            onChange={(event) => handleChange('stopLoss', Number(event.target.value))}
            size="small"
            sx={textFieldStyles}
          />
          <TextField
            fullWidth
            label='Take Profit'
            type='number'
            value={local.takeProfit}
            onChange={(event) => handleChange('takeProfit', Number(event.target.value))}
            size="small"
            sx={textFieldStyles}
          />
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />

        <Stack direction="row" spacing={2} sx={{
          bgcolor: "rgba(255,255,255,0.03)",
          p: 1.5,
          borderRadius: 1,
          border: "1px solid rgba(255,255,255,0.05)"
        }}>
          <Box flex={1}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Confidence</Typography>
            <Typography variant="body2" color="white" fontWeight={600}>{trade.confidence}%</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>R/R Ratio</Typography>
            <Typography variant="body2" color="white" fontWeight={600}>{trade.riskReward}</Typography>
          </Box>
        </Stack>

        <RiskScore
          score={Math.min(10, Math.floor(local.leverage / 2) + (local.collateral > 5000 ? 2 : 0))}
          leverage={local.leverage}
          collateral={local.collateral}
        />

        <Button
          variant='contained'
          onClick={onStage}
          disabled={stagingDisabled || busy}
          fullWidth
          sx={{
            bgcolor: "#7b61ff",
            color: "white",
            py: 1.5,
            fontWeight: 600,
            fontSize: "1rem",
            textTransform: "none",
            "&:hover": {
              bgcolor: "#6a52e3",
            },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)"
            },
          }}
        >
          {busy ? 'Submitting...' : 'Execute Trade'}
        </Button>
      </CardContent>
    </Card>
  );
}

const textFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.05)",
    color: "white",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.2)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#7b61ff",
    },
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.5)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.5)",
    "&.Mui-focused": {
      color: "#a78bfa",
    },
  },
  "& .MuiFormHelperText-root": {
    color: "rgba(255,255,255,0.4)",
  },
};

