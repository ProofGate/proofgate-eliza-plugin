import { Plugin, IAgentRuntime, Action, Memory, State, HandlerCallback } from '@ai16z/eliza';
import { parseUnits, encodeFunctionData, type Address } from 'viem';
import axios from 'axios';

export interface ProofGateConfig {
  apiKey: string;
  apiUrl?: string;
  policyId?: string;
  autoBlock?: boolean; // If true, blocks transactions that fail validation
}

export interface ValidationResult {
  result: 'PASS' | 'FAIL';
  reason: string;
  evidenceURI: string;
  safe: boolean;
}

/**
 * ProofGate Plugin for Eliza
 * Validates blockchain transactions before execution
 */
export class ProofGatePlugin implements Plugin {
  name = 'proofgate';
  description = 'Validates blockchain transactions for safety before execution';
  private config: ProofGateConfig;
  private runtime?: IAgentRuntime;

  constructor(config: ProofGateConfig) {
    this.config = {
      apiUrl: 'https://api.proofgate.xyz/api',
      autoBlock: true,
      ...config,
    };
  }

  async init(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    console.log('[ProofGate] Plugin initialized');
  }

  /**
   * Validate a blockchain transaction before sending
   */
  async validateTransaction(
    from: Address,
    to: Address,
    data: `0x${string}`,
    value: string = '0'
  ): Promise<ValidationResult> {
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/validate`,
        {
          from,
          to,
          data,
          value,
          policyId: this.config.policyId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result: ValidationResult = {
        result: response.data.result,
        reason: response.data.reason,
        evidenceURI: response.data.evidenceURI,
        safe: response.data.result === 'PASS',
      };

      if (this.config.autoBlock && !result.safe) {
        throw new Error(`[ProofGate] Transaction blocked: ${result.reason}`);
      }

      return result;
    } catch (error: any) {
      console.error('[ProofGate] Validation error:', error.message);
      throw error;
    }
  }

  /**
   * Action: Validate Before Send
   * Intercepts blockchain transactions and validates them
   */
  get actions(): Action[] {
    return [
      {
        name: 'VALIDATE_TRANSACTION',
        description: 'Validate a blockchain transaction before execution',
        validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
          // Check if message contains transaction intent
          const text = message.content.text.toLowerCase();
          return (
            text.includes('send') ||
            text.includes('transfer') ||
            text.includes('swap') ||
            text.includes('approve')
          );
        },
        handler: async (
          runtime: IAgentRuntime,
          message: Memory,
          state?: State,
          options?: any,
          callback?: HandlerCallback
        ): Promise<boolean> => {
          try {
            // Extract transaction details from message
            // This is a simplified example - real implementation would parse tx details
            const { from, to, data, value } = this.extractTransactionDetails(message);

            // Validate with ProofGate
            const result = await this.validateTransaction(from, to, data, value);

            if (callback) {
              if (result.safe) {
                callback({
                  text: `✅ Transaction validated and safe to execute.\nReason: ${result.reason}\nProof: ${result.evidenceURI}`,
                });
              } else {
                callback({
                  text: `🚨 Transaction blocked by ProofGate.\nReason: ${result.reason}\nProof: ${result.evidenceURI}`,
                });
              }
            }

            return result.safe;
          } catch (error: any) {
            if (callback) {
              callback({
                text: `❌ ProofGate validation error: ${error.message}`,
              });
            }
            return false;
          }
        },
        examples: [
          [
            {
              user: '{{user1}}',
              content: {
                text: 'Send 100 USDC to 0x1234567890abcdef1234567890abcdef12345678',
              },
            },
            {
              user: '{{agent}}',
              content: {
                text: '✅ Transaction validated and safe to execute.\nReason: Balance sufficient, contract whitelisted.\nProof: ipfs://Qm...',
                action: 'VALIDATE_TRANSACTION',
              },
            },
          ],
        ],
      },
    ];
  }

  /**
   * Extract transaction details from Eliza message
   * TODO: Implement proper NLP parsing
   */
  private extractTransactionDetails(message: Memory): {
    from: Address;
    to: Address;
    data: `0x${string}`;
    value: string;
  } {
    // Placeholder - real implementation would parse natural language
    return {
      from: '0x0000000000000000000000000000000000000000' as Address,
      to: '0x0000000000000000000000000000000000000000' as Address,
      data: '0x' as `0x${string}`,
      value: '0',
    };
  }
}

/**
 * Factory function to create ProofGate plugin
 */
export function createProofGatePlugin(config: ProofGateConfig): ProofGatePlugin {
  return new ProofGatePlugin(config);
}

export default createProofGatePlugin;
