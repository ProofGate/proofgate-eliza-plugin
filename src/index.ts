import { Plugin, IAgentRuntime, Action, Memory, State, HandlerCallback } from '@ai16z/eliza';
import { type Address } from 'viem';

export interface ProofGateConfig {
  /** API key from ProofGate dashboard (starts with pg_) */
  apiKey: string;
  /** API URL (default: https://www.proofgate.xyz/api) */
  apiUrl?: string;
  /** Guardrail ID to validate against */
  guardrailId?: string;
  /** Chain ID (default: 56 for BSC, 97 for testnet) */
  chainId?: number;
  /** If true, throws error on failed validation (default: true) */
  autoBlock?: boolean;
  /** Log validation results (default: false) */
  debug?: boolean;
}

export interface ValidationRequest {
  from: Address;
  to: Address;
  data: `0x${string}`;
  value?: string;
  guardrailId?: string;
  chainId?: number;
}

export interface ValidationResult {
  validationId: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  reason: string;
  evidenceUri: string;
  safe: boolean;
  checks?: ValidationCheck[];
  authenticated: boolean;
  tier: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * ProofGate Plugin for Eliza AI Agents
 * 
 * Validates blockchain transactions before execution to prevent:
 * - Wallet drains from prompt injection
 * - Infinite approvals to malicious contracts
 * - Transactions exceeding daily limits
 * - High slippage swaps
 * 
 * @example
 * ```typescript
 * import { createProofGatePlugin } from '@eliza/plugin-proofgate';
 * 
 * const agent = new Agent({
 *   plugins: [
 *     createProofGatePlugin({
 *       apiKey: 'pg_your_api_key',
 *       guardrailId: 'your-guardrail-id',
 *     })
 *   ]
 * });
 * ```
 */
export class ProofGatePlugin implements Plugin {
  name = 'proofgate';
  description = 'Validates blockchain transactions for safety before execution';
  
  private config: Required<ProofGateConfig>;
  private runtime?: IAgentRuntime;

  constructor(config: ProofGateConfig) {
    if (!config.apiKey) {
      throw new Error('[ProofGate] API key is required. Get one at https://www.proofgate.xyz/dashboard');
    }
    if (!config.apiKey.startsWith('pg_')) {
      throw new Error('[ProofGate] Invalid API key format. Keys start with "pg_"');
    }

    this.config = {
      apiUrl: 'https://www.proofgate.xyz/api',
      guardrailId: '',
      chainId: 56, // BSC Mainnet
      autoBlock: true,
      debug: false,
      ...config,
    };
  }

  async init(runtime: IAgentRuntime): Promise<void> {
    this.runtime = runtime;
    if (this.config.debug) {
      console.log('[ProofGate] Plugin initialized', {
        apiUrl: this.config.apiUrl,
        chainId: this.config.chainId,
        guardrailId: this.config.guardrailId || 'default',
      });
    }
  }

  /**
   * Validate a blockchain transaction before sending
   * 
   * @param request - Transaction details to validate
   * @returns Validation result with pass/fail and evidence
   * @throws Error if validation fails and autoBlock is true
   * 
   * @example
   * ```typescript
   * const result = await plugin.validateTransaction({
   *   from: '0xYourAgent...',
   *   to: '0xContract...',
   *   data: '0xa9059cbb...', // ERC20 transfer calldata
   *   value: '0',
   * });
   * 
   * if (result.safe) {
   *   // Execute transaction
   * }
   * ```
   */
  async validateTransaction(request: ValidationRequest): Promise<ValidationResult> {
    const { from, to, data, value = '0' } = request;

    try {
      const response = await fetch(`${this.config.apiUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          from,
          to,
          data,
          value,
          guardrailId: request.guardrailId || this.config.guardrailId || undefined,
          chainId: request.chainId || this.config.chainId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      const result = await response.json() as ValidationResult;

      if (this.config.debug) {
        console.log('[ProofGate] Validation result:', {
          id: result.validationId,
          result: result.result,
          reason: result.reason,
          safe: result.safe,
        });
      }

      // Auto-block unsafe transactions
      if (this.config.autoBlock && !result.safe) {
        const error = new Error(`[ProofGate] Transaction blocked: ${result.reason}`);
        (error as any).validationResult = result;
        throw error;
      }

      return result;

    } catch (error: any) {
      if (this.config.debug) {
        console.error('[ProofGate] Validation error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Check if a wallet is a verified ProofGate agent
   */
  async checkAgent(wallet: Address): Promise<{
    isRegistered: boolean;
    verificationStatus: string;
    trustScore: number;
    tier: string;
  }> {
    const response = await fetch(
      `${this.config.apiUrl}/agents/check?wallet=${wallet}`
    );
    return response.json();
  }

  /**
   * Get evidence for a past validation
   */
  async getEvidence(validationId: string): Promise<any> {
    const response = await fetch(
      `${this.config.apiUrl}/evidence/${validationId}`
    );
    return response.json();
  }

  /**
   * Eliza actions for transaction validation
   */
  get actions(): Action[] {
    return [
      {
        name: 'PROOFGATE_VALIDATE',
        description: 'Validate a blockchain transaction before execution using ProofGate guardrails',
        validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
          const text = message.content.text.toLowerCase();
          return (
            text.includes('send') ||
            text.includes('transfer') ||
            text.includes('swap') ||
            text.includes('approve') ||
            text.includes('validate')
          );
        },
        handler: async (
          runtime: IAgentRuntime,
          message: Memory,
          state?: State,
          options?: { from?: Address; to?: Address; data?: `0x${string}`; value?: string },
          callback?: HandlerCallback
        ): Promise<boolean> => {
          try {
            if (!options?.from || !options?.to || !options?.data) {
              if (callback) {
                callback({
                  text: '⚠️ Transaction details required (from, to, data) for ProofGate validation.',
                });
              }
              return false;
            }

            const result = await this.validateTransaction({
              from: options.from,
              to: options.to,
              data: options.data,
              value: options.value || '0',
            });

            if (callback) {
              if (result.safe) {
                callback({
                  text: `✅ **Transaction Approved**\n\n` +
                    `**Reason:** ${result.reason}\n` +
                    `**Validation ID:** \`${result.validationId}\`\n` +
                    `**Evidence:** [View](https://www.proofgate.xyz/evidence/${result.validationId})`,
                });
              } else {
                callback({
                  text: `🚨 **Transaction Blocked**\n\n` +
                    `**Reason:** ${result.reason}\n` +
                    `**Validation ID:** \`${result.validationId}\`\n` +
                    `**Evidence:** [View](https://www.proofgate.xyz/evidence/${result.validationId})`,
                });
              }
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
              user: '{{user1}}',
              content: { text: 'Send 100 USDC to 0x1234...' },
            },
            {
              user: '{{agent}}',
              content: {
                text: '✅ **Transaction Approved**\n\nReason: Amount within daily limit\nValidation ID: `val_abc123`',
                action: 'PROOFGATE_VALIDATE',
              },
            },
          ],
          [
            {
              user: '{{user1}}',
              content: { text: 'Approve unlimited USDC to 0xSuspicious...' },
            },
            {
              user: '{{agent}}',
              content: {
                text: '🚨 **Transaction Blocked**\n\nReason: Infinite approval detected - dangerous!\nValidation ID: `val_def456`',
                action: 'PROOFGATE_VALIDATE',
              },
            },
          ],
        ],
      },
    ];
  }
}

/**
 * Create a ProofGate plugin instance
 * 
 * @param config - Plugin configuration
 * @returns ProofGatePlugin instance
 * 
 * @example
 * ```typescript
 * import { createProofGatePlugin } from '@eliza/plugin-proofgate';
 * 
 * const proofgate = createProofGatePlugin({
 *   apiKey: process.env.PROOFGATE_API_KEY!,
 *   guardrailId: 'your-guardrail-id',
 *   chainId: 56, // BSC Mainnet
 * });
 * ```
 */
export function createProofGatePlugin(config: ProofGateConfig): ProofGatePlugin {
  return new ProofGatePlugin(config);
}

export default createProofGatePlugin;
