# proofgate-eliza-plugin

> Blockchain transaction validation for Eliza AI agents via ProofGate

## 🚀 What is this?

This plugin adds **automatic transaction validation** to your Eliza AI agents before they execute any blockchain transactions. It prevents:

- ❌ Wallet drains from prompt injection attacks
- ❌ Infinite approvals to malicious contracts
- ❌ Logic errors that could cost thousands
- ❌ Hallucinated transactions with wrong amounts

## 📦 Installation

```bash
npm install proofgate-eliza-plugin
```

## 🔧 Quick Start

```typescript
import { createProofGatePlugin } from 'proofgate-eliza-plugin';

// Create plugin instance
const proofgatePlugin = createProofGatePlugin({
  apiKey: 'pg_your_api_key_here', // Get from https://www.proofgate.xyz
  guardrailId: 'your-guardrail-id', // Optional: specific guardrail
  chainId: 8453, // Base mainnet (or 56 for BSC)
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

## 🔑 Get Your API Key

1. Go to [proofgate.xyz](https://www.proofgate.xyz)
2. Connect wallet
3. Create a guardrail (e.g., "Max $500/transaction, only Uniswap")
4. Copy your API key & guardrail ID

**Free tier:** 100 validations/month, no credit card required.

## 📋 Configuration Options

```typescript
interface ProofGateConfig {
  apiKey: string;        // Required: Your ProofGate API key (starts with pg_)
  apiUrl?: string;       // Optional: Custom API URL (default: https://www.proofgate.xyz/api)
  guardrailId?: string;  // Optional: Specific guardrail to validate against
  chainId?: number;      // Optional: Chain ID (default: 56 for BSC)
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
