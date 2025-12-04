import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenvConfig();

const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const SOMNIA_RPC_URL = process.env.SOMNIA_RPC_URL ?? "";

const accounts = PRIVATE_KEY !== "" ? [PRIVATE_KEY] : [];

const networks: HardhatUserConfig["networks"] = {
  hardhat: {},
};

if (SOMNIA_RPC_URL !== "") {
  networks.somniaTestnet = {
    url: SOMNIA_RPC_URL,
    accounts,
  };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
  etherscan: {
    apiKey: process.env.SOMNIA_SCAN_API_KEY || "",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
