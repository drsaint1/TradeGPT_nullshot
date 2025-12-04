import { Switch, Box, Typography, Chip } from '@mui/material';

interface PaperTradingToggleProps {
  isPaper: boolean;
  onToggle: (isPaper: boolean) => void;
}

export function PaperTradingToggle({ isPaper, onToggle }: PaperTradingToggleProps) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      bgcolor: isPaper ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${isPaper ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      borderRadius: 2,
      px: 2,
      py: 1,
    }}>
      <Typography variant="body2" color="white" fontWeight={600}>
        {isPaper ? 'Paper Trading' : 'Live Trading'}
      </Typography>
      <Switch
        checked={isPaper}
        onChange={(e) => onToggle(e.target.checked)}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#22c55e',
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#22c55e',
          },
        }}
      />
      <Chip
        label={isPaper ? 'Safe Mode' : 'Real Money'}
        size="small"
        sx={{
          bgcolor: isPaper ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: isPaper ? '#22c55e' : '#ef4444',
          fontWeight: 600,
          fontSize: '0.75rem',
        }}
      />
    </Box>
  );
}
