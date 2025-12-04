import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { VoiceInput } from "./VoiceInput";
import type { ChatMessage } from "../types";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend(message: string): void;
  isLoading?: boolean;
}

export function ChatWindow({ messages, onSend, isLoading }: ChatWindowProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    onSend(input.trim());
    setInput("");
  };

  return (
    <Card sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      bgcolor: "#111213",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      overflow: "hidden"
    }}>
      <CardContent sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        "&:last-child": { pb: 2 }
      }}>
        <Box sx={{
          pb: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0
        }}>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#22c55e",
            boxShadow: "0 0 8px #22c55e"
          }} />
          <Typography variant="h6" fontWeight={600} color="white">
            AI Assistant
          </Typography>
        </Box>

        <Stack
          spacing={2}
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 1,
            my: 2,
            minHeight: 0,
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: msg.role === "user" ? "#7b61ff" : "rgba(255,255,255,0.05)",
                color: "white",
                px: 2,
                py: 1.5,
                borderRadius: 2,
                maxWidth: "85%",
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}
            >
              {msg.role === "assistant" ? (
                <Box
                  sx={{
                    "& p": { margin: 0, lineHeight: 1.6, fontSize: "0.875rem" },
                    "& strong": { fontWeight: 700, color: "#a78bfa" },
                  }}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
                  {msg.content}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5, display: "block" }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </Typography>
            </Box>
          ))}
          {messages.length === 0 && (
            <Box sx={{
              textAlign: "center",
              py: 8,
              color: "rgba(255,255,255,0.4)"
            }}>
              <Typography variant="h6" gutterBottom color="rgba(255,255,255,0.6)">
                Start a conversation
              </Typography>
              <Typography variant="body2">
                Ask about market analysis, trading strategies, or request a trade setup
              </Typography>
            </Box>
          )}
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            gap: 1,
            flexShrink: 0,
            pt: 2,
            borderTop: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <VoiceInput
            onTranscript={(text) => setInput(text)}
            disabled={isLoading}
          />
          <TextField
            fullWidth
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about ETH price, request a trade setup..."
            disabled={isLoading}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "white",
                borderRadius: 2,
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.1)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.2)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#7b61ff",
                },
              },
              "& .MuiInputBase-input::placeholder": {
                color: "rgba(255,255,255,0.4)",
                opacity: 1,
              },
            }}
          />
          <IconButton
            type="submit"
            sx={{
              bgcolor: "#7b61ff",
              color: "white",
              width: 48,
              height: 48,
              flexShrink: 0,
              "&:hover": {
                bgcolor: "#6a52e3",
                transform: "scale(1.05)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)"
              },
              transition: "all 0.2s",
            }}
            disabled={isLoading || input.trim().length === 0}
          >
            <Send size={20} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
