import type { Address } from 'viem';
import { validateTransactionAction } from './actions';
import { getProofGateConfig, isProofGateConfigured } from './environment';
import type { ValidationRequest, ValidationResult, AgentInfo } from './types';

// Re-export types
export * from './types';
export * from './environment';
export { validateTransactionAction } from './actions';

// Use any for elizaOS types to avoid version conflicts
type Plugin = any;
type IAgentRuntime = any;

/**
 * ProofGate Plugin for elizaOS
 * 
 * Validates blockchain transactions before execution to prevent:
 * - Wallet drains from prompt injection attacks
 * - Infinite approvals to malicious contracts
 * - Transactions exceeding spending limits
 * - Interactions with unauthorized contracts
 * 
 * @example
 * ```typescript
 * import { proofGatePlugin } from '@proofgate/eliza-plugin';
 * 
 * const agent = new Agent({
 *   plugins: [proofGatePlugin],
 *   settings: {
 *     PROOFGATE_API_KEY: 'pg_your_api_key',
 *     PROOFGATE_GUARDRAIL_ID: 'your-guardrail-id',
 *   }
 * });
 * ```
 */
export const proofGatePlugin: Plugin = {
  name: '@proofgate/eliza-plugin',
  description: 'Blockchain transaction validation guardrails for AI agents. Validates transactions against security policies before execution.',
  
  actions: [validateTransactionAction],
  providers: [],
  evaluators: [],
  
  async init(_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> {
    if (!isProofGateConfigured(runtime)) {
      console.warn('[ProofGate] Plugin not configured. Set PROOFGATE_API_KEY to enable transaction validation.');
      return;
    }

    const proofGateConfig = getProofGateConfig(runtime);
    
    if (proofGateConfig.PROOFGATE_DEBUG) {
      console.log('[ProofGate] Plugin initialized', {
        apiUrl: proofGateConfig.PROOFGATE_API_URL,
        chainId: proofGateConfig.PROOFGATE_CHAIN_ID,
        guardrailId: proofGateConfig.PROOFGATE_GUARDRAIL_ID || 'default',
        autoBlock: proofGateConfig.PROOFGATE_AUTO_BLOCK,
      });
    }
  },
};

/**
 * Standalone validation function for direct API usage
 * 
 * @param apiKey - ProofGate API key
 * @param request - Transaction validation request
 * @param options - Additional options
 * @returns Validation result
 */
export async function validateTransaction(
  apiKey: string,
  request: ValidationRequest,
  options: {
    apiUrl?: string;
    debug?: boolean;
  } = {}
): Promise<ValidationResult> {
  const apiUrl = options.apiUrl || 'https://proofgate.xyz/api';

  const response = await fetch(`${apiUrl}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      from: request.from,
      to: request.to,
      data: request.data,
      value: request.value || '0',
      guardrailId: request.guardrailId,
      chainId: request.chainId || 8453,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string; message?: string };
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json() as ValidationResult;

  if (options.debug) {
    console.log('[ProofGate] Validation result:', {
      id: result.validationId,
      result: result.result,
      reason: result.reason,
      safe: result.safe,
    });
  }

  return result;
}

/**
 * Check agent status and trust score
 */
export async function checkAgent(
  wallet: Address,
  options: { apiUrl?: string } = {}
): Promise<AgentInfo> {
  const apiUrl = options.apiUrl || 'https://proofgate.xyz/api';
  
  const response = await fetch(`${apiUrl}/agents/${wallet}`);
  
  if (!response.ok) {
    throw new Error(`Failed to check agent: HTTP ${response.status}`);
  }
  
  return response.json() as Promise<AgentInfo>;
}

/**
 * Get evidence for a past validation
 */
export async function getEvidence(
  validationId: string,
  options: { apiUrl?: string } = {}
): Promise<any> {
  const apiUrl = options.apiUrl || 'https://proofgate.xyz/api';
  
  const response = await fetch(`${apiUrl}/evidence/${validationId}`);
  return response.json();
}

// Default export for convenience
export default proofGatePlugin;
