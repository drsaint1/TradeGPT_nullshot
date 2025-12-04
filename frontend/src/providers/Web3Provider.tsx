import { ReactNode } from "react";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";

const somniaTestnet = {
  id: Number(import.meta.env.VITE_SOMNIA_CHAIN_ID ?? 50312),
  name: "Somnia Testnet",
  iconUrl: "https://app.somnia.network/icon.png",
  nativeCurrency: {
    name: "Somnia Testnet",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_RPC ?? "https://dream-rpc.somnia.network"],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_RPC ?? "https://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: import.meta.env.VITE_SOMNIA_EXPLORER ?? "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
} as const;

const config = getDefaultConfig({
  appName: "TradeGPT Assistant",
  projectId: import.meta.env.VITE_WALLETCONNECT_ID ?? "demo",
  chains: [somniaTestnet],
  ssr: false,
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider theme={darkTheme({ accentColor: "#7b61ff" })} modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
