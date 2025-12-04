import { Box, Typography, LinearProgress } from '@mui/material';
import { Shield, AlertTriangle } from 'lucide-react';

interface RiskScoreProps {
  score: number; 
  leverage: number;
  collateral: number;
}

export function RiskScore({ score, leverage, collateral }: RiskScoreProps) {
  const getRiskLevel = (score: number) => {
    if (score <= 3) return { label: 'Low', color: '#22c55e' };
    if (score <= 6) return { label: 'Moderate', color: '#f59e0b' };
    return { label: 'High', color: '#ef4444' };
  };

  const risk = getRiskLevel(score);

  return (
    <Box sx={{
      bgcolor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 2,
      p: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {score <= 6 ? (
          <Shield size={18} color={risk.color} />
        ) : (
          <AlertTriangle size={18} color={risk.color} />
        )}
        <Typography variant="subtitle2" color="white" fontWeight={600}>
          AI Risk Analysis
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="rgba(255,255,255,0.7)">
            Risk Score
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ color: risk.color }}>
            {score}/10 - {risk.label}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score * 10}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              bgcolor: risk.color,
              borderRadius: 4,
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Leverage Impact
          </Typography>
          <Typography variant="body2" color="white" fontWeight={600}>
            {leverage}x {leverage >= 10 ? '⚠️' : ''}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Position Size
          </Typography>
          <Typography variant="body2" color="white" fontWeight={600}>
            ${collateral * leverage}
          </Typography>
        </Box>
      </Box>

      {score > 7 && (
        <Box sx={{
          mt: 2,
          p: 1.5,
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 1,
        }}>
          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
            ⚠️ High Risk: Consider reducing leverage or position size
          </Typography>
        </Box>
      )}
    </Box>
  );
}
