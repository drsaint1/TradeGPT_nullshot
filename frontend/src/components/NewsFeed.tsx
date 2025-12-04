import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, Stack, CircularProgress, Link } from '@mui/material';
import { Newspaper, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  asset: string;
  time: string;
  url?: string;
  source?: string;
}

interface CryptoPanicNewsItem {
  id: number;
  title: string;
  published_at: string;
  url: string;
  source: {
    title: string;
  };
  currencies?: Array<{
    code: string;
  }>;
  votes?: {
    positive: number;
    negative: number;
    important: number;
  };
}

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Altcoin,Trading'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();

        if (data.Response === 'Error') {
          throw new Error(data.Message || 'API Error');
        }

        const formattedNews: NewsItem[] = data.Data.slice(0, 15).map((item: any) => {
          let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          const categories = item.categories?.toLowerCase() || '';
          const tags = item.tags?.toLowerCase() || '';
          const title = item.title?.toLowerCase() || '';

          if (title.includes('bull') || title.includes('surge') || title.includes('rally') ||
              title.includes('gain') || title.includes('rise') || title.includes('up')) {
            sentiment = 'bullish';
          } else if (title.includes('bear') || title.includes('crash') || title.includes('drop') ||
                     title.includes('fall') || title.includes('decline') || title.includes('down')) {
            sentiment = 'bearish';
          }

          let asset = 'CRYPTO';
          if (categories.includes('btc') || tags.includes('btc') || title.includes('bitcoin')) {
            asset = 'BTC';
          } else if (categories.includes('eth') || tags.includes('eth') || title.includes('ethereum')) {
            asset = 'ETH';
          } else if (categories.includes('sol') || tags.includes('sol') || title.includes('solana')) {
            asset = 'SOL';
          }

          const publishedDate = new Date(item.published_on * 1000);
          const now = new Date();
          const diffMs = now.getTime() - publishedDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);

          let timeAgo = '';
          if (diffDays > 0) {
            timeAgo = `${diffDays}d ago`;
          } else if (diffHours > 0) {
            timeAgo = `${diffHours}h ago`;
          } else if (diffMins > 0) {
            timeAgo = `${diffMins}m ago`;
          } else {
            timeAgo = 'Just now';
          }

          return {
            id: item.id.toString(),
            title: item.title,
            sentiment,
            asset,
            time: timeAgo,
            url: item.url || item.guid,
            source: item.source,
          };
        });

        setNews(formattedNews);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    const interval = setInterval(fetchNews, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' };
      case 'bearish':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.7)' };
    }
  };

  return (
    <Card sx={{
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)"
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Newspaper size={20} color="#7b61ff" />
          <Typography variant='h6' color="white" fontWeight={600}>
            Live Crypto News
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} sx={{ color: '#7b61ff' }} />
          </Box>
        )}

        {error && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <Typography variant="body2" color="#ef4444">
              {error}
            </Typography>
          </Box>
        )}

        {!loading && !error && (
          <Stack spacing={2}>
            {news.map((item) => {
              const sentiment = getSentimentColor(item.sentiment);
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="none"
                  sx={{ display: 'block' }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderColor: '#7b61ff',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Chip
                        label={item.asset}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(123, 97, 255, 0.2)',
                          color: '#a78bfa',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Typography variant="caption" color="rgba(255,255,255,0.5)">
                        {item.time}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="white" sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {item.sentiment === 'bullish' ? (
                          <TrendingUp size={14} color={sentiment.color} />
                        ) : item.sentiment === 'bearish' ? (
                          <TrendingDown size={14} color={sentiment.color} />
                        ) : null}
                        <Typography
                          variant="caption"
                          sx={{
                            color: sentiment.color,
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {item.sentiment}
                        </Typography>
                      </Box>
                      {item.source && (
                        <Typography variant="caption" color="rgba(255,255,255,0.4)" fontSize="0.65rem">
                          {item.source}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Link>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
