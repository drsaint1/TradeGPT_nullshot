# TradeGPT User Guide

Welcome to TradeGPT! This guide will help you get started with AI-powered trading on the Somnia blockchain.

## Table of Contents
- [Getting Started](#getting-started)
- [Understanding the Interface](#understanding-the-interface)
- [Your First Trade](#your-first-trade)
- [Advanced Features](#advanced-features)
- [Tips and Best Practices](#tips-and-best-practices)
- [FAQ](#faq)

## Getting Started

### Step 1: Connect Your Wallet

1. **Open TradeGPT** in your browser
2. **Click "Connect Wallet"** in the top-right corner
3. **Select your wallet** (MetaMask recommended)
4. **Approve the connection** in your wallet
5. **Ensure you're on Somnia Testnet**

**Network Details:**
```
Network Name: Somnia Testnet
RPC URL: https://dream-rpc.somnia.network
Chain ID: 50312
Currency: STT
```

**Adding Somnia Network to MetaMask:**
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter the details above
5. Save and switch to Somnia Testnet

---

### Step 2: Create Your Smart Account

A smart account is your personal trading account that works with the AI assistant.

1. **After connecting**, you'll see a "Create Smart Account" screen
2. **Click "Create Smart Account"**
3. **Approve the transaction** in MetaMask
   - Cost: ~0.0007 STT (very cheap!)
4. **Wait for confirmation** (usually 5-10 seconds)
5. **Your smart account address** will be displayed

**What is a Smart Account?**
- A blockchain account specifically for AI-assisted trading
- You control it completely (non-custodial)
- The AI can propose trades, but only you can execute them
- Holds your trading funds separately from your main wallet

---

### Step 3: Get Test Tokens

You need test tokens to start trading.

1. **Navigate to "Faucet" tab** (sidebar)
2. **Option A: Get all tokens at once**
   - Click "Get All Tokens (One Click)"
   - Approve 4 transactions in MetaMask
   - Receive 1,000 of each token (USDC, WETH, WBTC, WSOL)

3. **Option B: Get tokens individually**
   - Click "Get" next to each token
   - Approve transaction in MetaMask
   - Receive 1,000 of that token

**Available Tokens:**
- **USDC** - Test USD Coin (used for collateral)
- **WETH** - Wrapped Ethereum
- **WBTC** - Wrapped Bitcoin
- **WSOL** - Wrapped Solana

**Note:** These are test tokens with no real value. You can request them as many times as needed!

---

### Step 4: Deposit Funds to Smart Account

Before trading, deposit tokens from your wallet to your smart account.

1. **Go to "Analytics" tab**
2. **Find "Fund Management" section**
3. **Under "Deposit Funds":**
   - Select token (e.g., USDC)
   - Enter amount (e.g., 500)
   - Click "Deposit"
   - Approve transaction in MetaMask
4. **Wait for confirmation**
5. **Check "Token Balances" table** to see updated balance

**Recommended Initial Deposits:**
- 500-1000 USDC (for collateral)
- 100-500 of other tokens (for trading)

---

### Step 5: Approve Router for Trading

This allows the trading router to execute swaps on your behalf.

1. **In "Fund Management" section**
2. **Find the warning box** about router approval
3. **Click "Approve Router for Trading"**
4. **Approve transaction** in MetaMask
5. **Wait for confirmation**

**Why is this needed?**
The router needs permission to swap tokens in your smart account. This is a one-time setup that enables all future trades.

---

## Understanding the Interface

### Navigation Tabs

**Trade** 📊
- AI chat interface
- Trade composer panel
- Main trading view

**Analytics** 💼
- Fund management
- Portfolio performance metrics
- Win rate and PnL statistics

**Chart** 📈
- Live cryptocurrency price charts
- Technical analysis tools

**News** 📰
- Latest crypto news feed
- Market updates

**Traders** 🏆
- Leaderboard (coming soon)
- Top performers

**History** 📜
- All your past trades
- Trade status and details

**Faucet** 🚰
- Get free test tokens
- Available for all supported tokens

---

### Trade Interface

#### Left Panel: AI Chat

The chat interface lets you communicate with your AI trading assistant.

**What you can ask:**
- "What's the current BTC price?"
- "Should I buy ETH right now?"
- "I want to long BTC with 100 USDC"
- "Analyze the SOL market"
- "Give me a trading strategy for WETH"

**How it works:**
1. Type your question or request
2. AI analyzes market data
3. AI provides analysis and suggestions
4. If appropriate, AI creates a trade setup

**Chat Features:**
- Natural language understanding
- Market analysis
- Trade suggestions
- Educational explanations
- Markdown formatting support

#### Right Panel: Trade Composer

When AI suggests a trade, it appears here.

**Trade Parameters:**

**Asset** 🎯
- The cryptocurrency you're trading
- Examples: BTC, ETH, WBTC, SOL

**Side** ⬆️⬇️
- **LONG**: Bet price goes up
- **SHORT**: Bet price goes down

**Collateral** 💰
- Amount of USDC you're risking
- This is your trading capital for this position

**Entry Price** 📍
- Current market price
- Price at which you enter the trade

**Leverage** ⚡
- Multiplier for your position (1x - 100x)
- Higher leverage = higher profit/loss potential
- **Recommended**: Start with 1x-3x for safety

**Stop Loss** 🛑
- Price at which trade automatically closes if losing
- Protects you from excessive losses
- **Always set this!**

**Take Profit** 🎯
- Price at which trade automatically closes if winning
- Locks in profits
- Optional but recommended

**Example Trade:**
```
Asset: BTC
Side: LONG
Collateral: 100 USDC
Entry Price: $42,000
Leverage: 2x
Stop Loss: $40,000
Take Profit: $46,000
```

This means:
- You're betting BTC will go up
- Using 100 USDC with 2x leverage (200 USDC exposure)
- If BTC drops to $40,000, you exit (lose ~47 USDC)
- If BTC rises to $46,000, you exit (gain ~47 USDC)

---

## Your First Trade

### Complete Trading Walkthrough

#### 1. Start a Conversation

**In the chat, type:**
```
"I want to long BTC with 100 USDC"
```

#### 2. AI Analysis

The AI will:
- Fetch current BTC price
- Analyze market conditions
- Suggest trade parameters
- Explain the reasoning

**Example AI Response:**
```
Based on current market analysis:
- BTC is at $42,000
- Recent upward momentum
- Support at $40,000

I recommend:
- Collateral: 100 USDC
- Leverage: 2x
- Stop Loss: $40,000 (5% risk)
- Take Profit: $46,000 (10% gain)

This gives you a 2:1 risk-reward ratio.
```

#### 3. Review Trade Parameters

Check the right panel (Trade Composer):
- ✅ Asset: BTC
- ✅ Side: LONG
- ✅ Collateral: 100 USDC
- ✅ Entry: $42,000
- ✅ Leverage: 2x
- ✅ Stop Loss: $40,000
- ✅ Take Profit: $46,000

#### 4. Adjust If Needed

You can modify any parameter:
- **Collateral**: Change amount
- **Leverage**: Increase/decrease risk
- **Stop Loss**: Set tighter/wider
- **Take Profit**: Set closer/further

#### 5. Execute the Trade

1. **Click "Execute Trade"** button
2. **Check trade details** in MetaMask popup
3. **Approve transaction**
4. **Wait for confirmation** (5-10 seconds)
5. **Trade appears in History** tab

#### 6. Monitor Your Trade

**In History tab**, you'll see:
- Trade status: "executed"
- All trade details
- Transaction hash (click to view on explorer)

**In Analytics tab**, you'll see:
- Portfolio value updated
- Trade added to statistics

---

## Advanced Features

### Paper Trading Mode

Practice without risking real funds!

**Enable Paper Trading:**
1. Find toggle in top-right (next to wallet connect)
2. Switch to "Paper Trading"
3. All trades will be simulated

**When to use:**
- Learning how the platform works
- Testing strategies
- Trying new trade setups

**When to switch to Live:**
- Comfortable with the interface
- Understanding of risk management
- Ready for real blockchain transactions

---

### Managing Multiple Trades

You can have multiple positions simultaneously.

**Best Practices:**
- Don't over-leverage your account
- Diversify across different assets
- Monitor all positions regularly
- Use stop losses on every trade

---

### Withdrawing Profits

**To withdraw funds to your wallet:**

1. **Go to Analytics tab**
2. **Find "Withdraw Funds" section**
3. **Select token** (e.g., USDC)
4. **Enter amount** to withdraw
5. **Click "Withdraw"**
6. **Approve transaction** in MetaMask
7. **Tokens return to your wallet**

---

### Reading the Charts

**Chart Tab Features:**
- Live price updates
- Multiple timeframes
- Volume indicators
- Price history

**How to use:**
- Select asset from dropdown
- Choose timeframe (1H, 4H, 1D, etc.)
- Analyze trends before trading
- Use alongside AI suggestions

---

### Understanding Trade Status

**Pending** 🟡
- Trade suggested but not executed
- You can still edit or cancel
- No blockchain transaction yet

**Staged** 🔵
- Transaction prepared
- Awaiting your approval
- Can still cancel

**Executed** ✅
- Trade live on blockchain
- Position is open
- Cannot cancel (must close position)

**Cancelled** ❌
- Trade was cancelled before execution
- No funds were used

**Failed** ⛔
- Execution attempt failed
- Check error message
- Funds not used

---

## Tips and Best Practices

### Risk Management

**1. Start Small**
- Begin with small amounts (50-100 USDC)
- Get comfortable with the platform
- Gradually increase as you learn

**2. Use Stop Losses**
- Always set stop losses
- Limits maximum loss per trade
- Protects your capital

**3. Don't Over-Leverage**
- High leverage = high risk
- Start with 1x-2x leverage
- Only increase when experienced

**4. Diversify**
- Don't put all funds in one trade
- Spread across multiple assets
- Reduces overall risk

**5. Size Positions Appropriately**
- Risk only 1-5% of capital per trade
- Never risk more than you can afford to lose
- Keep reserves for new opportunities

---

### Trading Strategy

**1. Follow Trends**
- Trade with the trend, not against it
- Use AI analysis to identify trends
- Don't try to catch exact tops/bottoms

**2. Be Patient**
- Wait for good setups
- Don't force trades
- Quality over quantity

**3. Take Profits**
- Don't be greedy
- Set realistic profit targets
- Scale out of winning positions

**4. Cut Losses Quickly**
- Don't hold losing trades hoping for reversal
- Respect your stop losses
- Live to trade another day

**5. Learn Continuously**
- Ask AI to explain concepts
- Review your trade history
- Analyze wins and losses

---

### Using the AI Assistant Effectively

**Good Questions:**
```
✅ "What's your analysis on BTC right now?"
✅ "Should I long or short ETH at current levels?"
✅ "Give me a low-risk trade setup for WBTC"
✅ "Explain what leverage means"
✅ "How should I set my stop loss?"
```

**Less Effective:**
```
❌ "Will BTC go up?"
❌ "Make me rich"
❌ "Give me a 100x trade"
❌ Single word responses
```

**Best Practices:**
- Be specific about what you want
- Mention your risk tolerance
- Ask for explanations if unsure
- Request specific trade parameters

---

## FAQ

### General Questions

**Q: Is this real money?**
A: On testnet, no! These are test tokens with no real value. You can experiment freely.

**Q: How much does it cost?**
A: Only tiny gas fees in STT (usually $0.0001-0.001 per transaction). Test tokens are free.

**Q: Is my money safe?**
A: Yes! Your smart account is non-custodial - only you control it. AI can only propose trades, not execute them.

**Q: Can I lose money?**
A: On testnet, you can't lose real money since tokens are free. The experience simulates real trading to help you learn.

---

### Trading Questions

**Q: What's the difference between LONG and SHORT?**
A:
- **LONG**: You profit if price goes UP
- **SHORT**: You profit if price goes DOWN

**Q: What is leverage?**
A: Leverage multiplies your position size. With 2x leverage and 100 USDC, you get 200 USDC of exposure.

**Q: What's a stop loss?**
A: A price level where your trade automatically closes if losing. It limits your maximum loss.

**Q: What's a take profit?**
A: A price level where your trade automatically closes if winning. It locks in your profit.

**Q: How do I close a trade?**
A: Trades close automatically when stop loss or take profit is hit. (Manual closing feature coming soon!)

**Q: Can I have multiple trades at once?**
A: Yes! You can run multiple positions simultaneously across different assets.

---

### Technical Questions

**Q: What's a smart account?**
A: A smart contract wallet that holds your trading funds and executes trades. You control it with your regular wallet.

**Q: Why do I need to approve the router?**
A: The router needs permission to swap tokens in your smart account. This is standard for DeFi and is safe.

**Q: What if a transaction fails?**
A: Check you have:
- Enough STT for gas
- Sufficient token balance
- Router approved
- Correct network (Somnia)

**Q: Can I use this on mobile?**
A: Yes! Works on mobile browsers with MetaMask mobile app.

**Q: How do I see my transaction on blockchain?**
A: Click the transaction hash in your trade history to view on Somnia block explorer.

---

### Troubleshooting

**Q: "Wallet not connecting"**
- Ensure MetaMask is installed
- Check you're on Somnia Testnet
- Try refreshing the page
- Try incognito mode

**Q: "Smart account not found"**
- Clear browser cache
- Reconnect wallet
- Create new smart account

**Q: "Insufficient gas"**
- Get testnet STT from faucet
- Check wallet balance
- Ensure correct network

**Q: "Trade execution failed"**
- Check token balances
- Verify router is approved
- Ensure adequate collateral
- Check network congestion

**Q: "AI not responding"**
- Check backend is running
- Verify API key is set
- Check browser console for errors
- Try refreshing page

---

## Keyboard Shortcuts

- `Enter`: Send chat message
- `Ctrl/Cmd + K`: Focus chat input
- `Esc`: Clear chat input

---

## Safety Reminders

⚠️ **Important:**
1. This is a testnet demo - tokens have no value
2. Never share your private keys
3. Always verify contract addresses
4. Use separate wallets for test and mainnet
5. Understand risks before real trading
6. Start small when moving to mainnet

---

## Getting Help

**Need assistance?**

1. **Check documentation** in `/docs` folder
2. **Review error messages** carefully
3. **Check browser console** (F12) for errors
4. **Open GitHub issue** with details
5. **Join community** Discord/Telegram

**Providing Feedback:**
We appreciate your feedback! Please report:
- Bugs and issues
- Feature requests
- UI/UX improvements
- Documentation updates

---

## Next Steps

Now that you're familiar with TradeGPT:

1. ✅ Practice with paper trading
2. ✅ Try different assets and strategies
3. ✅ Learn from AI explanations
4. ✅ Monitor your performance
5. ✅ Explore advanced features
6. ✅ Share feedback

**Ready to trade?** Head back to the app and start your AI-powered trading journey!

---

## Additional Resources

- [Setup Guide](./SETUP.md) - Installation and configuration
- [Architecture](./ARCHITECTURE.md) - System design
- [API Documentation](./API.md) - Developer reference
- [Smart Contracts](./SMART_CONTRACTS.md) - Contract details
- [Somnia Docs](https://docs.somnia.network/) - Network info
- [DeFi Education](https://ethereum.org/en/defi/) - Learn more about DeFi

---

**Happy Trading! 🚀**
