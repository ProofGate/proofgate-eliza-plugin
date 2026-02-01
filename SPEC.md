# ProofGate Eliza Plugin - Technical Specification

## Overview

The ProofGate plugin for Eliza provides **automatic blockchain transaction validation** before execution, preventing wallet drains, infinite approvals, and logic errors that could cost thousands.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Eliza Agent                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         User Input (Natural Language)                 │  │
│  │  "Send 100 USDC to 0x123... on Uniswap"             │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      ProofGate Plugin (Action: VALIDATE_TX)          │  │
│  │  1. Parse transaction intent                          │  │
│  │  2. Extract: from, to, data, value                    │  │
│  │  3. Call ProofGate API                                │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  ProofGate API                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  POST /api/validate                                   │  │
│  │  {                                                    │  │
│  │    from: "0xuser",                                    │  │
│  │    to: "0xcontract",                                  │  │
│  │    data: "0x...",                                     │  │
│  │    value: "0",                                        │  │
│  │    policyId: "0xabc123..."                            │  │
│  │  }                                                    │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Policy Engine                                        │  │
│  │  - Check balance requirements                         │  │
│  │  - Validate contract whitelist                        │  │
│  │  - Check spending limits                              │  │
│  │  - Verify slippage tolerance                          │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Response                                             │  │
│  │  {                                                    │  │
│  │    result: "PASS" | "FAIL",                           │  │
│  │    reason: "Balance sufficient, contract approved",   │  │
│  │    evidenceURI: "ipfs://Qm...",                       │  │
│  │    safe: true                                         │  │
│  │  }                                                    │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Smart Contract (BSC)                          │
│  recordValidation(                                          │
│    validationId,                                            │
│    result,                                                  │
│    evidenceURI                                              │
│  ) → On-chain proof                                         │
└─────────────────────────────────────────────────────────────┘
```

## Integration Flow

### 1. Plugin Initialization

```typescript
import { createProofGatePlugin } from '@eliza/plugin-proofgate';

const proofgate = createProofGatePlugin({
  apiKey: 'pk_live_...',
  policyId: '0xabc123...',
  autoBlock: true,
});

const agent = new Agent({
  plugins: [proofgate],
  // ... other config
});
```

### 2. Transaction Interception

When user sends a message containing transaction intent:

1. **Eliza** parses natural language
2. **ProofGate action** triggers if message contains:
   - "send", "transfer", "swap", "approve", etc.
3. **Plugin extracts** transaction details:
   - `from`: User wallet address
   - `to`: Target contract address
   - `data`: Encoded function call
   - `value`: ETH/BNB amount (if any)

### 3. Validation Request

```typescript
POST https://api.proofgate.xyz/api/validate
Authorization: Bearer pk_live_...

{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "to": "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap
  "data": "0x38ed1739...", // swapExactTokensForTokens()
  "value": "0",
  "policyId": "0xabc123..." // User's custom policy
}
```

### 4. Policy Validation

ProofGate checks:

✅ **Balance Check:**
- User has sufficient balance for transaction
- Example: "Require 5 USDC balance before swap"

✅ **Contract Whitelist:**
- Target contract is in approved list
- Example: "Only Uniswap V3, PancakeSwap V2"

✅ **Approval Limits:**
- Token approval amount is within limits
- Example: "Max 1000 USDC approval"

✅ **Slippage Tolerance:**
- Swap slippage is acceptable
- Example: "Block if slippage > 1%"

✅ **Daily Limits:**
- Transaction doesn't exceed daily spending cap
- Example: "$10k max per day"

### 5. Response Handling

#### ✅ PASS - Safe to Execute

```json
{
  "result": "PASS",
  "reason": "Balance sufficient (1500 USDC), PancakeSwap whitelisted, slippage 0.5% (within 1% limit)",
  "evidenceURI": "db://0xvalidationid",
  "safe": true
}
```

**Eliza response:**
```
✅ Transaction validated and safe to execute.
Reason: Balance sufficient, contract whitelisted.
Proof: db://0xvalidationid

Executing swap: 100 USDC → ETH via PancakeSwap...
```

#### 🚨 FAIL - Blocked

```json
{
  "result": "FAIL",
  "reason": "Contract 0x123... not in whitelist. Allowed: [Uniswap, PancakeSwap]",
  "evidenceURI": "db://0xvalidationid",
  "safe": false
}
```

**Eliza response:**
```
🚨 Transaction blocked by ProofGate.
Reason: Contract not whitelisted.
Proof: db://0xvalidationid

This transaction was NOT executed for your safety.
```

### 6. On-Chain Proof Recording

All validations (pass or fail) are recorded on BSC:

```solidity
event ValidationRecorded(
    bytes32 indexed validationId,
    address indexed user,
    address indexed validator,
    ValidationResult result, // PASS or FAIL
    string evidenceURI,
    address token,
    uint256 feeAmount
);
```

**Benefit:** Full audit trail, cryptographic proof of all decisions.

## Policy Configuration

Users create policies at `proofgate.xyz/policies/create`:

```json
{
  "name": "Conservative DeFi Trading",
  "rules": {
    "allowedContracts": [
      "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap Router
      "0xE592427A0AEce92De3Edee1F18E0157C05861564"  // Uniswap V3 Router
    ],
    "maxApproval": "1000000000", // 1000 USDC (6 decimals)
    "slippageBps": 100,          // 1% max slippage
    "dailyLimitWei": "10000000000" // $10k/day
  }
}
```

Policy stored in Supabase, URI stored on-chain:
- `db://0xpolicyid` (backend database)
- Or `ipfs://Qm...` (future IPFS support)

## Error Handling

### Network Errors

```typescript
try {
  const result = await proofgate.validateTransaction(from, to, data, value);
} catch (error) {
  if (error.message.includes('Network')) {
    // Retry with exponential backoff
  } else {
    // Log and alert user
  }
}
```

### API Quota Exceeded

Free tier: 100 validations/month

```json
{
  "error": "Quota exceeded. Upgrade to Pro: https://proofgate.xyz/pricing"
}
```

**Eliza response:**
```
⚠️ ProofGate quota exceeded (100/100 validations this month).
Upgrade to Pro for unlimited validations: https://proofgate.xyz/pricing
```

## Security Considerations

1. **API Key Storage:**
   - Store in `.env` file
   - Never commit to git
   - Use separate keys for dev/prod

2. **autoBlock Default:**
   - Default: `true` (safe by default)
   - If `false`, agent can override and execute anyway
   - Only disable for testing

3. **Policy Tampering:**
   - Policies stored on-chain via whitelist
   - Cannot be modified after creation (immutable)
   - Only owner can create/remove policies

## Performance

- **Latency:** <500ms for validation
- **Throughput:** 1000 req/s (Pro tier)
- **Uptime:** 99.9% SLA (Enterprise tier)

## Future Enhancements

1. **Advanced NLP Parsing:**
   - Better transaction intent extraction
   - Support for complex DeFi operations (flash loans, LP, etc.)

2. **Multi-Chain Support:**
   - Ethereum, Polygon, Arbitrum
   - Cross-chain validation

3. **ML-Based Risk Scoring:**
   - Learn from past validations
   - Adaptive slippage limits

4. **Gas Optimization:**
   - Batch validations
   - L2 proof recording

## Development Status

- ✅ Core plugin architecture
- ✅ API integration
- ✅ Basic transaction parsing
- ⏳ NLP transaction extraction (needs improvement)
- ⏳ Multi-chain support
- ⏳ Advanced policy rules

## Testing Plan

1. **Unit Tests:**
   - validateTransaction()
   - extractTransactionDetails()
   - Policy enforcement

2. **Integration Tests:**
   - Eliza agent with ProofGate
   - End-to-end validation flow
   - Error scenarios

3. **Testnet Deployment:**
   - BSC Testnet
   - Real Eliza agent
   - 100+ test transactions

## Deployment Checklist

- [ ] Publish to npm: `@eliza/plugin-proofgate`
- [ ] Create GitHub repo: `bytes0xcr6/eliza-plugin-proofgate`
- [ ] Submit PR to Eliza core: `ai16z/eliza`
- [ ] Create demo video (YouTube)
- [ ] Write blog post
- [ ] Tweet announcement (@proofgate, @ai16zdao)
- [ ] Discord announcement (ai16z Discord)

## Resources

- **Eliza Docs:** https://github.com/ai16z/eliza/tree/main/docs
- **ProofGate API:** https://docs.proofgate.xyz/api
- **Smart Contracts:** https://github.com/bytes0xcr6/ProofGate-validation-contracts

---

**Author:** 0xCR6  
**Created:** 2026-02-01  
**Status:** Draft (v0.1.0)
