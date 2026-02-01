/**
 * Example: Using ProofGate with an Eliza AI Agent
 * 
 * This example shows how to add transaction validation to your Eliza agent
 */

import { Agent } from '@ai16z/eliza';
import { createProofGatePlugin } from '@eliza/plugin-proofgate';

// 1. Create ProofGate plugin
const proofgatePlugin = createProofGatePlugin({
  apiKey: process.env.PROOFGATE_API_KEY!, // Get from https://www.proofgate.xyz
  policyId: process.env.PROOFGATE_POLICY_ID, // Optional: your policy ID
  autoBlock: true, // Block unsafe transactions automatically
});

// 2. Create Eliza agent with ProofGate
const agent = new Agent({
  name: 'DeFi Trading Bot',
  description: 'An AI agent that trades DeFi tokens safely',
  
  // Add ProofGate to plugins
  plugins: [
    proofgatePlugin,
    // ... other plugins
  ],

  // Agent configuration
  knowledge: [
    'I am a DeFi trading bot that can swap tokens, provide liquidity, and manage portfolios.',
    'I always validate transactions through ProofGate before executing.',
    'I only interact with whitelisted contracts (Uniswap, PancakeSwap).',
  ],

  // ... rest of agent config
});

// 3. Start the agent
async function main() {
  console.log('🤖 Starting DeFi Trading Bot with ProofGate protection...');
  
  await agent.start();

  console.log('✅ Agent is now running and protected by ProofGate');
  console.log('   All blockchain transactions will be validated before execution');
}

main().catch(console.error);

/**
 * Example interactions:
 * 
 * User: "Swap 100 USDC to ETH on PancakeSwap"
 * Agent: ✅ Transaction validated and safe to execute.
 *        Reason: Balance sufficient (500 USDC), PancakeSwap whitelisted, slippage 0.8% (within 1% limit)
 *        Executing swap...
 * 
 * User: "Approve infinite USDC to 0x1234... (unknown contract)"
 * Agent: 🚨 Transaction blocked by ProofGate.
 *        Reason: Contract 0x1234... not in whitelist. Only Uniswap and PancakeSwap allowed.
 *        This transaction was NOT executed for your safety.
 * 
 * User: "Send 10000 USDC to my wallet"
 * Agent: 🚨 Transaction blocked by ProofGate.
 *        Reason: Exceeds daily limit ($10,000 > $5,000 limit)
 *        This transaction was NOT executed for your safety.
 */
