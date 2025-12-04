import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TableContainer,
} from '@mui/material';
import type { Trade } from '../types';

interface PortfolioProps {
  trades: Trade[];
}

export function Portfolio({ trades }: PortfolioProps) {
  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom color="white" fontWeight={600}>
          Trade History
        </Typography>
        <TableContainer sx={{
          overflowX: 'auto',
          maxHeight: '300px',
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeaderStyles}>Asset</TableCell>
                <TableCell sx={tableHeaderStyles}>Side</TableCell>
                <TableCell sx={tableHeaderStyles}>Collateral</TableCell>
                <TableCell sx={tableHeaderStyles}>Entry</TableCell>
                <TableCell sx={tableHeaderStyles}>Lev.</TableCell>
                <TableCell sx={tableHeaderStyles}>Status</TableCell>
                <TableCell sx={tableHeaderStyles}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={tableCellStyles}>
                    <Typography variant="body2" fontWeight={600} color="white">
                      {trade.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Chip
                      size='small'
                      label={trade.side}
                      sx={{
                        bgcolor: trade.side === 'LONG' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        border: '1px solid',
                        borderColor: trade.side === 'LONG' ? '#22c55e' : '#ef4444',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">
                      ${trade.collateral} USDC
                    </Typography>
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">
                      ${trade.entryPrice}
                    </Typography>
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">
                      {trade.leverage}x
                    </Typography>
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Chip
                      size='small'
                      label={trade.status}
                      sx={{
                        bgcolor: trade.status === 'executed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: trade.status === 'executed' ? '#22c55e' : 'rgba(255,255,255,0.7)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={tableCellStyles}>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)">
                      {new Date(trade.updatedAt).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ ...tableCellStyles, textAlign: 'center', py: 4 }}>
                    <Typography variant='body2' color='rgba(255,255,255,0.4)'>
                      No trades yet. Request a trade setup from the AI to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

const tableHeaderStyles = {
  bgcolor: 'rgba(255,255,255,0.02)',
  color: 'rgba(255,255,255,0.6)',
  fontWeight: 600,
  fontSize: '0.75rem',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  py: 1,
  px: 1.5,
};

const tableCellStyles = {
  color: 'rgba(255,255,255,0.8)',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  py: 1.5,
  px: 1.5,
};
