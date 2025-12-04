# TradeGPT Documentation

Welcome to the TradeGPT documentation! This folder contains comprehensive guides and references for using, developing, and understanding the TradeGPT platform.

## Documentation Overview

### For Users

If you're new to TradeGPT and want to start trading:

**📚 [User Guide](./USER_GUIDE.md)** - **START HERE!**
- Getting started tutorial
- Step-by-step walkthrough
- Interface explanation
- Trading tips and best practices
- FAQ and troubleshooting

### For Developers

If you're setting up TradeGPT for development or deployment:

**🔧 [Setup Guide](./SETUP.md)**
- Installation instructions
- Environment configuration
- Development workflow
- Deployment procedures
- Troubleshooting

**🏗️ [Architecture Overview](./ARCHITECTURE.md)**
- System design
- Component interactions
- Data flow diagrams
- Technology stack
- Scalability considerations

**📜 [Smart Contracts Documentation](./SMART_CONTRACTS.md)**
- Contract specifications
- Function references
- Deployment guide
- Security considerations
- Testing procedures

**🔌 [API Documentation](./API.md)**
- REST API endpoints
- WebSocket events
- Request/response formats
- Error handling
- Code examples

## Quick Links

### Getting Started
1. [Install and Setup](./SETUP.md#development-setup)
2. [Connect Wallet](./USER_GUIDE.md#step-1-connect-your-wallet)
3. [Create Smart Account](./USER_GUIDE.md#step-2-create-your-smart-account)
4. [Your First Trade](./USER_GUIDE.md#your-first-trade)

### Key Concepts
- [Smart Accounts](./SMART_CONTRACTS.md#2-somniatradeaccount)
- [AI Trading Assistant](./ARCHITECTURE.md#ai-service)
- [Trade Execution Flow](./ARCHITECTURE.md#trade-execution-flow)
- [Security Model](./ARCHITECTURE.md#security-model)

### Common Tasks
- [Deploy Contracts](./SETUP.md#smart-contracts-setup)
- [Configure Environment](./SETUP.md#configure-environment-variables)
- [Use Token Faucet](./USER_GUIDE.md#step-3-get-test-tokens)
- [Execute a Trade](./USER_GUIDE.md#your-first-trade)
- [Withdraw Funds](./USER_GUIDE.md#withdrawing-profits)

## Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── USER_GUIDE.md         # End-user guide for traders
├── SETUP.md              # Setup and installation guide
├── ARCHITECTURE.md       # System architecture and design
├── SMART_CONTRACTS.md    # Smart contract reference
└── API.md                # Backend API reference
```

## What to Read First

### I want to trade
👉 Start with [User Guide](./USER_GUIDE.md)

### I want to develop
👉 Start with [Setup Guide](./SETUP.md) then [Architecture](./ARCHITECTURE.md)

### I want to understand the contracts
👉 Read [Smart Contracts Documentation](./SMART_CONTRACTS.md)

### I want to integrate the API
👉 Check out [API Documentation](./API.md)

### I want to deploy to production
👉 Follow [Setup Guide - Production Deployment](./SETUP.md#production-deployment)

## Key Features Documented

### Smart Account System
- **What**: User-controlled trading accounts
- **Docs**: [Smart Contracts](./SMART_CONTRACTS.md#2-somniatradeaccount)
- **Guide**: [User Guide - Smart Accounts](./USER_GUIDE.md#step-2-create-your-smart-account)

### AI Trading Assistant
- **What**: Gemini-powered trade analysis and suggestions
- **Docs**: [Architecture - AI Service](./ARCHITECTURE.md#ai-service)
- **Guide**: [User Guide - Using AI](./USER_GUIDE.md#using-the-ai-assistant-effectively)

### DEX Integration
- **What**: Decentralized exchange for token swaps
- **Docs**: [Smart Contracts - DEX Router](./SMART_CONTRACTS.md#3-somniadexrouter)
- **Guide**: [User Guide - Trading](./USER_GUIDE.md#your-first-trade)

### Fund Management
- **What**: Deposit, withdraw, and manage tokens
- **Docs**: [API - Fund Endpoints](./API.md) (coming soon)
- **Guide**: [User Guide - Fund Management](./USER_GUIDE.md#step-4-deposit-funds-to-smart-account)

### Real-time Updates
- **What**: WebSocket live trade updates
- **Docs**: [API - WebSocket](./API.md#websocket-api)
- **Implementation**: [Architecture - WebSocket](./ARCHITECTURE.md#websocket)

## Technology Stack

### Frontend
- React 18 + Vite + TypeScript
- wagmi + viem (Web3)
- Material-UI (Components)
- [More details →](./ARCHITECTURE.md#1-frontend-layer)

### Backend
- Node.js + Express + TypeScript
- Google Gemini AI
- SQLite / PostgreSQL
- [More details →](./ARCHITECTURE.md#2-backend-layer)

### Smart Contracts
- Solidity 0.8.20
- Hardhat
- OpenZeppelin
- [More details →](./ARCHITECTURE.md#3-smart-contract-layer)

## Support and Resources

### Documentation
- 📖 Main README: [../README.md](../README.md)
- 🏗️ Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 📱 User Guide: [USER_GUIDE.md](./USER_GUIDE.md)
- ⚙️ Setup: [SETUP.md](./SETUP.md)

### External Resources
- [Somnia Network](https://somnia.network/)
- [Somnia Docs](https://docs.somnia.network/)
- [Google Gemini](https://ai.google.dev/)
- [wagmi Documentation](https://wagmi.sh/)
- [Hardhat Docs](https://hardhat.org/)

### Getting Help
- 🐛 Report issues on GitHub
- 💬 Join Discord community
- 📧 Contact the team
- 📝 Check [FAQ](./USER_GUIDE.md#faq)

## Contributing to Documentation

Found an error or want to improve the docs?

1. Fork the repository
2. Edit the relevant `.md` file
3. Submit a pull request
4. Describe your changes

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep formatting consistent
- Test all code samples

## Version History

### v1.0.0 (Current)
- Initial documentation release
- Complete user guide
- Full setup instructions
- API reference
- Smart contract docs
- Architecture overview

## License

This documentation is part of the TradeGPT project and is licensed under MIT License.

---

**Need help?** Start with the [User Guide](./USER_GUIDE.md) or check the [FAQ](./USER_GUIDE.md#faq)!

**Want to contribute?** See [Contributing](#contributing-to-documentation)

**Found a bug?** Please report it on GitHub Issues

---

*Last updated: 2024*
