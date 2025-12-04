import { Box, Stack, Typography, alpha } from "@mui/material";
import {
  BarChart3,
  TrendingUp,
  Newspaper,
  Users,
  History,
  Settings,
  Bot,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems: NavItem[] = [
  { id: "trade", label: "Trade", icon: <Bot size={20} /> },
  { id: "analytics", label: "Wallet", icon: <BarChart3 size={20} /> },
  { id: "chart", label: "Chart", icon: <TrendingUp size={20} /> },
  { id: "news", label: "News", icon: <Newspaper size={20} /> },
  { id: "traders", label: "Traders", icon: <Users size={20} /> },
  { id: "history", label: "History", icon: <History size={20} /> },
  { id: "settings", label: "Faucet", icon: <Settings size={20} /> },
];

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <Box
      sx={{
        width: 80,
        bgcolor: "#111213",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        height: "calc(100vh - 80px)",
        position: "sticky",
        top: 80,
        display: "flex",
        flexDirection: "column",
        py: 2,
      }}
    >
      <Stack spacing={1}>
        {navItems.map((item) => (
          <Box
            key={item.id}
            onClick={() => onTabChange(item.id)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              py: 1.5,
              px: 1,
              cursor: "pointer",
              borderLeft:
                activeTab === item.id
                  ? "3px solid #7b61ff"
                  : "3px solid transparent",
              bgcolor:
                activeTab === item.id ? alpha("#7b61ff", 0.1) : "transparent",
              color:
                activeTab === item.id ? "#7b61ff" : "rgba(255,255,255,0.6)",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor:
                  activeTab === item.id
                    ? alpha("#7b61ff", 0.15)
                    : "rgba(255,255,255,0.05)",
                color:
                  activeTab === item.id ? "#7b61ff" : "rgba(255,255,255,0.9)",
              },
            }}
          >
            {item.icon}
            <Typography
              variant="caption"
              fontSize="0.65rem"
              fontWeight={600}
              textAlign="center"
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
