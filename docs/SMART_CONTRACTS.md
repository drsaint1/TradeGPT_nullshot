# Smart Contracts Documentation

## Overview

TradeGPT's smart contract system provides a secure, non-custodial infrastructure for AI-powered trading. The system consists of factory contracts, smart accounts, DEX integration, and test token implementations.

## Contract Architecture

```
SomniaTradeFactory
    │
    ├─→ Creates: SomniaTradeAccount (per user)
    │           │
    │           ├─→ Holds: ERC20 tokens
    │           ├─→ Executes: Trades via DEX
    │           └─→ Controlled by: User's EOA
    │
    └─→ Tracks: All created accounts by owner

SomniaDexRouter
    │
    ├─→ Interfaces with: MockDexRouter (testnet)
    └─→ Executes: Token swaps

MockERC20 Tokens
    │
    ├─→ USDC (6 decimals)
    ├─→ WETH (18 decimals)
    ├─→ WBTC (8 decimals)
    └─→ WSOL (9 decimals)
```

## Contracts

### 1. SomniaTradeFactory

**File:** `contracts/SomniaTradeFactory.sol`

**Purpose:** Factory contract for creating and managing smart trading accounts.

#### Key Features
- Deterministic account creation using CREATE2
- Track accounts by owner address
- Prevent duplicate accounts per owner
- Event emission for indexing

#### Functions

```solidity
function createAccount(
    address accountOwner,
    address customAgent
) external returns (address account)
```

**Description:** Creates a new smart trading account for the specified owner.

**Parameters:**
- `accountOwner`: Address that will own and control the account
- `customAgent`: Address of AI agent (can be zero address)

**Returns:** Address of the newly created account

**Events Emitted:**
```solidity
event AccountCreated(
    address indexed owner,
    address indexed account,
    address agent
);
```

**Usage Example:**
```typescript
const tx = await factory.createAccount(
    userAddress,
    "0x0000000000000000000000000000000000000000"
);
await tx.wait();
```

---

```solidity
function getAccountsByOwner(
    address owner
) external view returns (address[] memory)
```

**Description:** Retrieve all accounts owned by a specific address.

**Parameters:**
- `owner`: Address to query accounts for

**Returns:** Array of account addresses

**Usage Example:**
```typescript
const accounts = await factory.getAccountsByOwner(userAddress);
console.log("User accounts:", accounts);
```

---

```solidity
function computeAccountAddress(
    address accountOwner,
    address customAgent
) public view returns (address)
```

**Description:** Compute the address of an account before creation (deterministic).

**Parameters:**
- `accountOwner`: Owner address
- `customAgent`: Agent address

**Returns:** Predicted account address

---

#### Storage

```solidity
mapping(address => address[]) private _accountsByOwner;
```

Tracks all accounts created for each owner.

---

### 2. SomniaTradeAccount

**File:** `contracts/SomniaTradeAccount.sol`

**Purpose:** Individual user-controlled trading account with AI agent integration.

#### Key Features
- Owner-only access control
- Token management (deposits, withdrawals, approvals)
- DEX integration for swaps
- Agent delegation for AI proposals
- Fund recovery mechanisms

#### State Variables

```solidity
address public immutable owner;      // EOA that controls this account
address public agent;                 // AI agent address (optional)
address public factory;               // Factory that created this account
```

#### Functions

```solidity
function execute(
    address target,
    bytes calldata data
) external payable onlyOwner returns (bytes memory)
```

**Description:** Execute arbitrary calls from the smart account.

**Parameters:**
- `target`: Contract address to call
- `data`: Encoded function call data

**Returns:** Return data from the call

**Modifiers:** `onlyOwner` - Only account owner can execute

**Usage Example:**
```typescript
const encoded Data = dexRouter.interface.encodeFunctionData("swap", [...]);
await account.execute(dexRouterAddress, encodedData);
```

---

```solidity
function approveToken(
    address token,
    address spender,
    uint256 amount
) external onlyOwner
```

**Description:** Approve a spender to use tokens owned by this account.

**Parameters:**
- `token`: ERC20 token address
- `spender`: Address to approve (usually DEX router)
- `amount`: Amount to approve

**Usage Example:**
```typescript
// Approve router to spend USDC
await account.approveToken(
    usdcAddress,
    routerAddress,
    ethers.MaxUint256
);
```

---

```solidity
function recoverFunds(
    address token,
    address to,
    uint256 amount
) external onlyOwner
```

**Description:** Withdraw tokens from the account back to owner or another address.

**Parameters:**
- `token`: Token address (or zero address for native STT)
- `to`: Recipient address
- `amount`: Amount to withdraw

**Usage Example:**
```typescript
// Withdraw USDC to owner
await account.recoverFunds(
    usdcAddress,
    ownerAddress,
    ethers.parseUnits("100", 6)
);

// Withdraw native STT
await account.recoverFunds(
    "0x0000000000000000000000000000000000000000",
    ownerAddress,
    ethers.parseEther("1.0")
);
```

---

```solidity
function setAgent(address _agent) external onlyOwner
```

**Description:** Set or update the AI agent address.

**Parameters:**
- `_agent`: New agent address

---

```solidity
receive() external payable
```

**Description:** Accept native STT transfers.

---

#### Events

```solidity
event Executed(address indexed target, uint256 value, bytes data);
event AgentUpdated(address indexed oldAgent, address indexed newAgent);
event FundsRecovered(address indexed token, address indexed to, uint256 amount);
```

---

### 3. SomniaDexRouter

**File:** `contracts/SomniaDexRouter.sol`

**Purpose:** Unified interface for DEX interactions.

#### Key Features
- Abstraction layer for multiple DEXes
- Slippage protection
- Multi-path routing support
- Emergency pause functionality

#### Functions

```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,
    address recipient
) external returns (uint256 amountOut)
```

**Description:** Execute a token swap.

**Parameters:**
- `tokenIn`: Token to sell
- `tokenOut`: Token to buy
- `amountIn`: Amount of tokenIn to swap
- `minAmountOut`: Minimum acceptable amount of tokenOut (slippage protection)
- `recipient`: Address to receive tokenOut

**Returns:** Actual amount of tokenOut received

**Usage Example:**
```typescript
// Swap 100 USDC for WETH
await router.swap(
    usdcAddress,
    wethAddress,
    ethers.parseUnits("100", 6),
    ethers.parseEther("0.03"), // min 0.03 WETH expected
    smartAccountAddress
);
```

---

### 4. MockDexRouter

**File:** `contracts/mocks/MockDexRouter.sol`

**Purpose:** Testnet DEX simulator with simplified 1:1 swap logic.

#### Key Features
- Pre-funded liquidity pools
- 1:1 exchange rate (for testing)
- No slippage simulation
- Instant swaps

#### Functions

```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external returns (uint256)
```

**Description:** Simple swap with 1:1 rate.

**Parameters:**
- `tokenIn`: Token to sell
- `tokenOut`: Token to buy
- `amountIn`: Amount to swap

**Returns:** Amount of tokenOut (same as amountIn due to 1:1 rate)

**Note:** This is for testing only. Production would use real DEX with actual market rates.

---

### 5. MockERC20

**File:** `contracts/mocks/MockERC20.sol`

**Purpose:** Test token implementation with faucet functionality.

#### Key Features
- Standard ERC20 implementation
- Free faucet for testing
- Configurable decimals
- Unlimited minting for tests

#### Functions

```solidity
function faucet() external
```

**Description:** Get free tokens for testing (1,000 tokens).

**Usage Example:**
```typescript
await usdc.faucet();
console.log("Received 1,000 test USDC");
```

---

```solidity
function mint(address to, uint256 amount) external
```

**Description:** Mint new tokens (only for testing).

**Parameters:**
- `to`: Recipient address
- `amount`: Amount to mint

---

#### Token Specifications

| Token | Symbol | Decimals | Faucet Amount |
|-------|--------|----------|---------------|
| Test USDC | USDC | 6 | 1,000 |
| Wrapped ETH | WETH | 18 | 1,000 |
| Wrapped BTC | WBTC | 8 | 1,000 |
| Wrapped SOL | WSOL | 9 | 1,000 |

---

## Deployment

### Deployment Scripts

#### Deploy All Contracts

**Script:** `scripts/deployAll.ts`

```bash
npx hardhat run scripts/deployAll.ts --network somniaTestnet
```

**What it does:**
1. Deploys test tokens (USDC, WETH, WBTC, WSOL)
2. Deploys SomniaTradeFactory
3. Deploys MockDexRouter
4. Funds MockDexRouter with tokens
5. Outputs all contract addresses

**Expected Output:**
```
🚀 Deploying TradeGPT Contracts to Somnia Testnet

📦 Deploying Test Tokens...
✅ USDC deployed to: 0x...
✅ WETH deployed to: 0x...
✅ WBTC deployed to: 0x...
✅ WSOL deployed to: 0x...

🏭 Deploying Factory Contract...
✅ Factory deployed to: 0x...

🌐 Deploying MockDexRouter...
✅ MockDexRouter deployed to: 0x...

💰 Funding MockDexRouter...
✅ Router funded with 1M USDC
✅ Router funded with 10K WETH
✅ Router funded with 1K WBTC
✅ Router funded with 100K WSOL

📋 Deployment Summary:
Factory: 0x...
Router: 0x...
USDC: 0x...
WETH: 0x...
WBTC: 0x...
WSOL: 0x...

🎉 Deployment complete!
```

---

#### Create Smart Account

**Script:** `scripts/createAccount.ts`

```bash
npx hardhat run scripts/createAccount.ts --network somniaTestnet
```

Creates a smart account for the deployer address.

---

#### Use Faucet

**Script:** `scripts/useFaucet.ts`

```bash
npx hardhat run scripts/useFaucet.ts --network somniaTestnet
```

Claims tokens from all test token faucets.

---

#### Fund MockDex

**Script:** `scripts/fundMockDex.ts`

```bash
npx hardhat run scripts/fundMockDex.ts --network somniaTestnet
```

Transfers tokens to MockDexRouter for liquidity.

---

#### Approve Router

**Script:** `scripts/approveRouter.ts`

```bash
npx hardhat run scripts/approveRouter.ts --network somniaTestnet
```

Approves router to spend tokens from your wallet.

---

## Security Considerations

### Access Control

1. **Smart Account Ownership**
   - Each account has a single owner (EOA)
   - Only owner can execute transactions
   - Owner can be transferred, but this should be done carefully

2. **Agent Permissions**
   - Agents can propose trades but cannot execute
   - Agent address is optional
   - Agent can be changed by owner

3. **Factory Permissions**
   - No admin functions
   - Fully decentralized
   - No upgrade mechanism (deploy new factory if needed)

### Best Practices

1. **Always verify contract addresses before interacting**
2. **Use separate wallets for testnet and mainnet**
3. **Set reasonable token approval amounts**
4. **Monitor smart account activity**
5. **Keep private keys secure**
6. **Test thoroughly on testnet first**

### Audit Checklist

Before mainnet deployment:

- [ ] Conduct professional security audit
- [ ] Test all functions with edge cases
- [ ] Verify access control on all functions
- [ ] Check for reentrancy vulnerabilities
- [ ] Test with various token decimals
- [ ] Simulate failure scenarios
- [ ] Review all external calls
- [ ] Verify event emissions
- [ ] Test upgrade paths (if applicable)
- [ ] Document all assumptions

---

## Gas Usage

Approximate gas costs on Somnia testnet:

| Operation | Gas Used | STT Cost (estimate) |
|-----------|----------|---------------------|
| Create Account | ~350,000 | 0.0007 STT |
| Approve Token | ~45,000 | 0.00009 STT |
| Execute Swap | ~150,000 | 0.0003 STT |
| Recover Funds | ~50,000 | 0.0001 STT |
| Faucet Claim | ~45,000 | 0.00009 STT |

*Gas prices may vary based on network conditions*

---

## Testing

### Running Tests

```bash
cd contracts
npx hardhat test
```

### Test Coverage

Generate coverage report:

```bash
npx hardhat coverage
```

### Writing Tests

Example test structure:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SomniaTradeFactory", function () {
  it("Should create a new account", async function () {
    const [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SomniaTradeFactory");
    const factory = await Factory.deploy();

    await factory.createAccount(owner.address, ethers.ZeroAddress);

    const accounts = await factory.getAccountsByOwner(owner.address);
    expect(accounts.length).to.equal(1);
  });
});
```

---

## Contract Verification

### Verify on Block Explorer

```bash
npx hardhat verify --network somniaTestnet CONTRACT_ADDRESS
```

### With Constructor Arguments

```bash
npx hardhat verify --network somniaTestnet CONTRACT_ADDRESS "arg1" "arg2"
```

---

## Upgradeability

Current contracts are **not upgradeable** by design for security and simplicity.

### If Upgradeability Needed

Consider using OpenZeppelin's upgrade patterns:

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
```

### Migration Path

If contracts need updates:

1. Deploy new contracts
2. Update backend/frontend .env files
3. Migrate user accounts (if needed)
4. Deprecate old contracts

---

## Troubleshooting

### Common Issues

**1. "Execution reverted" errors**
- Check token balances
- Verify approvals
- Ensure correct function parameters
- Check access control

**2. Gas estimation failures**
- Set explicit gas limits
- Check for require() failures
- Verify contract addresses

**3. Account creation fails**
- Check if account already exists
- Ensure sufficient STT for gas
- Verify factory address

**4. Swap failures**
- Check token approvals
- Verify router has liquidity
- Ensure minimum output not too high

---

## API Reference

### Factory ABI

```json
[
  {
    "inputs": [
      {"name": "accountOwner", "type": "address"},
      {"name": "customAgent", "type": "address"}
    ],
    "name": "createAccount",
    "outputs": [{"name": "account", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "getAccountsByOwner",
    "outputs": [{"name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
]
```

### Smart Account ABI

```json
[
  {
    "inputs": [
      {"name": "target", "type": "address"},
      {"name": "data", "type": "bytes"}
    ],
    "name": "execute",
    "outputs": [{"name": "", "type": "bytes"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "token", "type": "address"},
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approveToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "token", "type": "address"},
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "recoverFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

---

## Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Somnia Documentation](https://docs.somnia.network/)
- [Ethers.js Documentation](https://docs.ethers.org/)
