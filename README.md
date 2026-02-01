# @eliza/plugin-proofgate

> Blockchain transaction validation for Eliza AI agents via ProofGate

## 🚀 What is this?

This plugin adds **automatic transaction validation** to your Eliza AI agents before they execute any blockchain transactions. It prevents:

- ❌ Wallet drains from prompt injection attacks
- ❌ Infinite approvals to malicious contracts
- ❌ Logic errors that could cost thousands
- ❌ Hallucinated transactions with wrong amounts

## 📦 Installation

```bash
npm install @eliza/plugin-proofgate
```

## 🔧 Quick Start

```typescript
import { createProofGatePlugin } from '@eliza/plugin-proofgate';

// Create plugin instance
const proofgatePlugin = createProofGatePlugin({
  apiKey: 'your_api_key_here', // Get from https://www.proofgate.xyz
  policyId: '0xabc123...', // Optional: specific policy ID
  autoBlock: true, // Block unsafe transactions (default: true)
});

// Add to your Eliza agent
const agent = new Agent({
  // ... your agent config
  plugins: [proofgatePlugin],
});
```

## 💡 How It Works

1. **User asks agent** to send a transaction (e.g., "Send 100 USDC to 0x123...")
2. **ProofGate intercepts** before execution
3. **Validates** against your safety policies:
   - Balance checks
   - Contract whitelists
   - Spending limits
   - Slippage tolerance
4. **Returns verdict:** PASS ✅ or FAIL 🚨
5. **Blocks unsafe transactions** (if autoBlock: true)
6. **Records cryptographic proof** on-chain

## 🔑 Get Your API Key

1. Go to [proofgate.xyz](https://www.proofgate.xyz)
2. Connect wallet
3. Create a policy (e.g., "Max $500/transaction, only Uniswap")
4. Copy your API key & policy ID

**Free tier:** 100 validations/month, no credit card required.

## 📋 Configuration Options

```typescript
interface ProofGateConfig {
  apiKey: string; // Required: Your ProofGate API key
  apiUrl?: string; // Optional: Custom API URL (default: https://api.proofgate.xyz/api)
  policyId?: string; // Optional: Specific policy to validate against
  autoBlock?: boolean; // Optional: Auto-block unsafe transactions (default: true)
}
```

## 🎯 Example Use Cases

### DeFi Trading Bot

```typescript
const tradingBot = new Agent({
  name: 'DeFi Trader',
  plugins: [
    createProofGatePlugin({
      apiKey: process.env.PROOFGATE_API_KEY,
      policyId: '0xabc123...', // Policy: Max 1k USDC/trade, only Uniswap/PancakeSwap
      autoBlock: true,
    }),
  ],
});

// User: "Swap 5000 USDC to ETH on SushiSwap"
// ProofGate: 🚨 BLOCKED - SushiSwap not whitelisted
```

### NFT Purchase Agent

```typescript
const nftBot = new Agent({
  name: 'NFT Collector',
  plugins: [
    createProofGatePlugin({
      apiKey: process.env.PROOFGATE_API_KEY,
      policyId: '0xdef456...', // Policy: Max 5 ETH/purchase, only OpenSea/Blur
    }),
  ],
});

// User: "Buy the floor NFT from collection X"
// ProofGate: ✅ SAFE - Price 2 ETH, OpenSea verified
```

### Treasury Manager

```typescript
const treasuryBot = new Agent({
  name: 'DAO Treasury',
  plugins: [
    createProofGatePlugin({
      apiKey: process.env.PROOFGATE_API_KEY,
      policyId: '0x789...', // Policy: Multi-sig only, Aave/Compound whitelisted
      autoBlock: true,
    }),
  ],
});

// User: "Deposit 100k USDC to Aave"
// ProofGate: ✅ SAFE - Contract verified, within daily limit
```

## 🛡️ Safety Policies

Define custom rules for your agent:

- **Balance Requirements:** "Require 5 USDC balance before any swap"
- **Contract Whitelist:** "Only interact with Uniswap V3"
- **Max Approval:** "Never approve more than 1000 USDC"
- **Slippage Limits:** "Block swaps with >1% slippage"
- **Daily Limits:** "$10k max spending per day"

Create policies at [proofgate.xyz/policies](https://www.proofgate.xyz/policies)

## 📊 Analytics

Track your agent's safety metrics:

- Total validations
- Pass/fail rate
- Blocked transactions (saved you money!)
- On-chain proof history

View dashboard: [proofgate.xyz/policies/:id](https://www.proofgate.xyz/policies)

## 🤝 Contributing

This is an open-source plugin. PRs welcome!

1. Fork the repo
2. Create a feature branch
3. Submit a PR to [bytes0xcr6/eliza-plugin-proofgate](https://github.com/bytes0xcr6/eliza-plugin-proofgate)

## 📄 License

MIT

## 🔗 Links

- **ProofGate:** [proofgate.xyz](https://www.proofgate.xyz)
- **Docs:** [docs.proofgate.xyz](https://docs.proofgate.xyz)
- **GitHub:** [github.com/bytes0xcr6/ProofGate-FE](https://github.com/bytes0xcr6/ProofGate-FE)
- **Eliza:** [github.com/ai16z/eliza](https://github.com/ai16z/eliza)

## 💬 Support

- **Discord:** [discord.gg/proofgate](https://discord.gg/proofgate)
- **Email:** cristian@proofgate.xyz
- **Twitter:** [@proofgate](https://twitter.com/proofgate)

---

Built with ❤️ by [0xCR6](https://twitter.com/0xCR6)
