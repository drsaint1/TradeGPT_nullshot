import { useState } from 'react';
import { IconButton, Box, Typography } from '@mui/material';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.start();
      setRecognition(recognitionInstance);
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        sx={{
          bgcolor: isListening ? '#ef4444' : 'rgba(255,255,255,0.05)',
          color: isListening ? 'white' : 'rgba(255,255,255,0.7)',
          width: 48,
          height: 48,
          '&:hover': {
            bgcolor: isListening ? '#dc2626' : 'rgba(255,255,255,0.1)',
          },
          transition: 'all 0.2s',
          animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
        }}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </IconButton>
      {isListening && (
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}>
          <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
            Listening...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
