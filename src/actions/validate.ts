import type { Address } from 'viem';
import { getProofGateConfig } from '../environment';
import type { ValidationResult } from '../types';

// Use any for elizaOS types to avoid version conflicts
type IAgentRuntime = any;
type Memory = any;
type State = any;
type HandlerCallback = (response: { text: string }) => void;
type Action = any;

/**
 * Validate a blockchain transaction using ProofGate
 */
export const validateTransactionAction: Action = {
  name: 'PROOFGATE_VALIDATE',
  similes: ['VALIDATE_TRANSACTION', 'CHECK_TRANSACTION', 'PROOFGATE_CHECK', 'VALIDATE_TX'],
  description: 'Validate a blockchain transaction before execution using ProofGate security guardrails. Checks for dangerous patterns like infinite approvals, unauthorized contracts, and spending limits.',
  
  validate: async (runtime: IAgentRuntime, message: Memory, _state?: State): Promise<boolean> => {
    // Check if ProofGate is configured
    try {
      getProofGateConfig(runtime);
    } catch {
      return false;
    }

    const text = message.content?.text?.toLowerCase() || '';
    return (
      text.includes('send') ||
      text.includes('transfer') ||
      text.includes('swap') ||
      text.includes('approve') ||
      text.includes('validate') ||
      text.includes('check transaction')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    options?: Record<string, any>,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      const config = getProofGateConfig(runtime);

      // Extract transaction details from options or message
      const from = options?.from as Address | undefined;
      const to = options?.to as Address | undefined;
      const data = options?.data as `0x${string}` | undefined;
      const value = options?.value as string | undefined;
      const chainId = options?.chainId as number | undefined;
      const guardrailId = options?.guardrailId as string | undefined;

      if (!from || !to || !data) {
        if (callback) {
          callback({
            text: '⚠️ Transaction details required (from, to, data) for ProofGate validation.',
          });
        }
        return false;
      }

      const response = await fetch(`${config.PROOFGATE_API_URL}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.PROOFGATE_API_KEY,
        },
        body: JSON.stringify({
          from,
          to,
          data,
          value: value || '0',
          guardrailId: guardrailId || config.PROOFGATE_GUARDRAIL_ID || undefined,
          chainId: chainId || config.PROOFGATE_CHAIN_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string; message?: string };
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json() as ValidationResult;

      if (config.PROOFGATE_DEBUG) {
        console.log('[ProofGate] Validation result:', {
          id: result.validationId,
          result: result.result,
          reason: result.reason,
          safe: result.safe,
        });
      }

      if (callback) {
        if (result.safe) {
          callback({
            text: `✅ **Transaction Approved**\n\n` +
              `**Reason:** ${result.reason}\n` +
              `**Validation ID:** \`${result.validationId}\`\n` +
              `**Evidence:** [View](https://proofgate.xyz/evidence/${result.validationId})`,
          });
        } else {
          callback({
            text: `🚨 **Transaction Blocked**\n\n` +
              `**Reason:** ${result.reason}\n` +
              `**Validation ID:** \`${result.validationId}\`\n` +
              `**Evidence:** [View](https://proofgate.xyz/evidence/${result.validationId})`,
          });
        }
      }

      // Auto-block if configured
      if (config.PROOFGATE_AUTO_BLOCK && !result.safe) {
        return false;
      }

      return result.safe;

    } catch (error: any) {
      if (callback) {
        callback({
          text: `❌ **ProofGate Error:** ${error.message}`,
        });
      }
      return false;
    }
  },

  examples: [
    [
      {
        name: 'user',
        content: { text: 'Send 100 USDC to 0x1234...' },
      },
      {
        name: 'assistant',
        content: {
          text: '✅ **Transaction Approved**\n\nReason: Amount within daily limit\nValidation ID: `val_abc123`',
          action: 'PROOFGATE_VALIDATE',
        },
      },
    ],
    [
      {
        name: 'user',
        content: { text: 'Approve unlimited USDC to 0xSuspicious...' },
      },
      {
        name: 'assistant',
        content: {
          text: '🚨 **Transaction Blocked**\n\nReason: Infinite approval detected - dangerous!\nValidation ID: `val_def456`',
          action: 'PROOFGATE_VALIDATE',
        },
      },
    ],
  ],
};
