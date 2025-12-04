import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme, GlobalStyles } from "@mui/material";
import { Web3Provider } from "./providers/Web3Provider";
import { ThemeProvider as AppThemeProvider } from "./contexts/ThemeContext";
import App from "./App";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7b61ff" },
    secondary: { main: "#41d1ff" },
    background: {
      default: "#0f0f1a",
      paper: "#151526",
    },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
});

const globalStyles = (
  <GlobalStyles
    styles={{
      "*::-webkit-scrollbar": {
        display: "none",
      },
      "*": {
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      },
    }}
  />
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <AppThemeProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {globalStyles}
            <App />
          </ThemeProvider>
        </AppThemeProvider>
      </Web3Provider>
    </QueryClientProvider>
  </React.StrictMode>,
);
