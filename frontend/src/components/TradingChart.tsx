import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';

interface TradingChartProps {
  symbol: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface BinanceKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingChart({ symbol, entryPrice, stopLoss, takeProfit }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart: IChartApi | null = null;
    let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
    let updateInterval: NodeJS.Timeout | null = null;

    const initializeChart = () => {
      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#111213' },
          textColor: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
        },
      });

      candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      if (entryPrice && candlestickSeries) {
        candlestickSeries.createPriceLine({
          price: entryPrice,
          color: '#7b61ff',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Entry',
        });
      }

      if (stopLoss && candlestickSeries) {
        candlestickSeries.createPriceLine({
          price: stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Stop Loss',
        });
      }

      if (takeProfit && candlestickSeries) {
        candlestickSeries.createPriceLine({
          price: takeProfit,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Take Profit',
        });
      }
    };

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        let binanceSymbol = symbol.replace(/[/-]/g, '').toUpperCase();
        if (!binanceSymbol.endsWith('USDT')) {
          binanceSymbol = binanceSymbol + 'USDT';
        }

        console.log('Fetching chart data for:', binanceSymbol);

        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&limit=100`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || `Failed to fetch chart data for ${binanceSymbol}`);
        }

        const rawData = await response.json();

        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('No chart data available');
        }

        const chartData: BinanceKline[] = rawData.map((candle: any[]) => ({
          time: Math.floor(candle[0] / 1000), 
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
        }));

        if (seriesRef.current) {
          seriesRef.current.setData(chartData as any);
        }

        setLoading(false);
        console.log('Chart data loaded successfully');
      } catch (err: any) {
        console.error('Error fetching chart data:', err);
        setError(err.message || 'Failed to load chart data');
        setLoading(false);
      }
    };

    initializeChart();
    fetchChartData();

    updateInterval = setInterval(fetchChartData, 60000);

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (chart) {
        chart.remove();
      }
    };
  }, [symbol, entryPrice, stopLoss, takeProfit]);

  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="white" fontWeight={600}>
            {symbol} Live Chart
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {entryPrice && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#7b61ff' }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">Entry</Typography>
              </Box>
            )}
            {stopLoss && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#ef4444' }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">SL</Typography>
              </Box>
            )}
            {takeProfit && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 2, bgcolor: '#22c55e' }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">TP</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
            <CircularProgress size={40} sx={{ color: '#7b61ff' }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            {error}
          </Alert>
        )}

        <div ref={chartContainerRef} style={{ display: loading ? 'none' : 'block' }} />
      </CardContent>
    </Card>
  );
}
