# @proofgate/eliza-plugin

> Blockchain transaction validation for Eliza AI agents via ProofGate

[![npm version](https://badge.fury.io/js/@proofgate%2Feliza-plugin.svg)](https://www.npmjs.com/package/@proofgate/eliza-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What is this?

This plugin adds **automatic transaction validation** to your Eliza AI agents before they execute any blockchain transactions. It prevents:

- ❌ Wallet drains from prompt injection attacks
- ❌ Infinite approvals to malicious contracts
- ❌ Logic errors that could cost thousands
- ❌ Hallucinated transactions with wrong amounts

## 📦 Installation

```bash
npm install @proofgate/eliza-plugin
```

## 🔧 Quick Start

```typescript
import { createProofGatePlugin } from '@proofgate/eliza-plugin';

// Create plugin instance
const proofgatePlugin = createProofGatePlugin({
  apiKey: 'pg_live_xxx', // Get from www.proofgate.xyz/dashboard/keys
  guardrailId: 'your-guardrail-id', // Optional: specific guardrail
  chainId: 8453, // Base mainnet (default)
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
3. **Validates** against your safety guardrails:
   - Balance checks
   - Contract whitelists
   - Spending limits
   - Slippage tolerance
4. **Returns verdict:** PASS ✅ or FAIL 🚨
5. **Blocks unsafe transactions** (if autoBlock: true)
6. **Records cryptographic proof** on-chain

## 🌐 Supported Chains

Validate transactions on **19 EVM chains**:

| Layer 1 | Layer 2 | Testnets |
|---------|---------|----------|
| Ethereum (1) | Base (8453) | Base Sepolia (84532) |
| BNB Chain (56) | Arbitrum (42161) | Sepolia (11155111) |
| Avalanche (43114) | Optimism (10) | Polygon Amoy (80002) |
| Fantom (250) | Polygon (137) | BSC Testnet (97) |
| Celo (42220) | zkSync Era (324) | |
| Gnosis (100) | Linea, Scroll, Mantle... | |

## 🔑 Get Your API Key

1. Go to [www.proofgate.xyz](https://www.proofgate.xyz)
2. Connect wallet
3. Go to Dashboard → API Keys
4. Create a new key (starts with `pg_live_`)

**Pricing:**
| Tier | Credits/Month | Rate Limit | Price |
|------|---------------|------------|-------|
| Free | 100 | 10/min | $0 |
| Pro | 10,000 | 60/min | $49/mo |
| Enterprise | Unlimited | 600/min | Contact us |

## 📋 Configuration Options

```typescript
interface ProofGateConfig {
  apiKey: string;        // Required: Your API key (starts with pg_live_)
  apiUrl?: string;       // Optional: Custom API URL (default: https://www.proofgate.xyz/api)
  guardrailId?: string;  // Optional: Specific guardrail to validate against
  chainId?: number;      // Optional: Chain ID (default: 8453 for Base)
  autoBlock?: boolean;   // Optional: Auto-block unsafe transactions (default: true)
  debug?: boolean;       // Optional: Enable debug logging (default: false)
}
```

## 🎯 Example Use Cases

### DeFi Trading Bot

```typescript
const tradingBot = new Agent({
  name: 'DeFi Trader',
  plugins: [
    createProofGatePlugin({
      apiKey: process.env.PROOFGATE_API_KEY!,
      guardrailId: 'defi-trading', // Guardrail: Max 1k USDC/trade, only Uniswap
      chainId: 8453, // Base
      autoBlock: true,
    }),
  ],
});

// User: "Swap 5000 USDC to ETH on unknown DEX"
// ProofGate: 🚨 BLOCKED - Contract not whitelisted
```

### Treasury Manager

```typescript
const treasuryBot = new Agent({
  name: 'DAO Treasury',
  plugins: [
    createProofGatePlugin({
      apiKey: process.env.PROOFGATE_API_KEY!,
      guardrailId: 'treasury-ops', // Guardrail: Aave/Morpho only
      chainId: 8453,
    }),
  ],
});

// User: "Deposit 100k USDC to Aave"
// ProofGate: ✅ SAFE - Contract verified, within daily limit
```

## 🛡️ Safety Guardrails

Define custom rules for your agent at [proofgate.xyz/create](https://www.proofgate.xyz/create):

- **Balance Requirements:** "Require 5 USDC balance before any swap"
- **Contract Whitelist:** "Only interact with Uniswap V3, Aave V3"
- **Max Approval:** "Never approve more than 1000 USDC"
- **Slippage Limits:** "Block swaps with >1% slippage"
- **Daily Limits:** "$10k max spending per day"

## 📊 On-Chain Proofs

Every validation is recorded on Base mainnet:
- Immutable audit trail
- Cryptographic evidence
- Query anytime via `getEvidence(validationId)`

## 🔌 Related Plugins

- **[@proofgate/goat-plugin](https://www.npmjs.com/package/@proofgate/goat-plugin)** - Transaction guardrails for GOAT SDK (50+ DeFi plugins)
- **[@proofgate/sdk](https://www.npmjs.com/package/@proofgate/sdk)** - Core TypeScript SDK for custom integrations

## 🔗 Links

- **ProofGate:** [proofgate.xyz](https://www.proofgate.xyz)
- **Documentation:** [proofgate.xyz/docs](https://www.proofgate.xyz/docs)
- **GitHub:** [github.com/ProofGate](https://github.com/ProofGate)
- **Eliza Framework:** [github.com/ai16z/eliza](https://github.com/ai16z/eliza)

## 💬 Support

- **Twitter:** [@ProofGate](https://twitter.com/ProofGate)

## 📄 License

MIT

---

Built with ❤️ by [0xCR6](https://twitter.com/0xCR6)
