import { z } from 'zod';

// Use any for IAgentRuntime to avoid version conflicts with elizaOS
type IAgentRuntime = any;

/**
 * Environment configuration schema for ProofGate plugin
 */
export const proofGateEnvSchema = z.object({
  PROOFGATE_API_KEY: z
    .string()
    .min(1, 'ProofGate API key is required')
    .refine((key) => key.startsWith('pg_'), {
      message: 'ProofGate API key must start with "pg_"',
    }),
  PROOFGATE_API_URL: z
    .string()
    .url()
    .optional()
    .default('https://www.proofgate.xyz/api'),
  PROOFGATE_GUARDRAIL_ID: z.string().optional(),
  PROOFGATE_CHAIN_ID: z.coerce.number().int().positive().optional().default(8453),
  PROOFGATE_AUTO_BLOCK: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  PROOFGATE_DEBUG: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

export type ProofGateEnv = z.infer<typeof proofGateEnvSchema>;

/**
 * Validate and get ProofGate environment configuration from runtime
 * 
 * @param runtime - Eliza agent runtime
 * @returns Validated ProofGate environment configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function getProofGateConfig(runtime: IAgentRuntime): ProofGateEnv {
  const rawConfig = {
    PROOFGATE_API_KEY: runtime.getSetting('PROOFGATE_API_KEY'),
    PROOFGATE_API_URL: runtime.getSetting('PROOFGATE_API_URL'),
    PROOFGATE_GUARDRAIL_ID: runtime.getSetting('PROOFGATE_GUARDRAIL_ID'),
    PROOFGATE_CHAIN_ID: runtime.getSetting('PROOFGATE_CHAIN_ID'),
    PROOFGATE_AUTO_BLOCK: runtime.getSetting('PROOFGATE_AUTO_BLOCK'),
    PROOFGATE_DEBUG: runtime.getSetting('PROOFGATE_DEBUG'),
  };

  const result = proofGateEnvSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`[ProofGate] Invalid configuration: ${errors}`);
  }

  return result.data;
}

/**
 * Check if ProofGate is configured (API key present)
 */
export function isProofGateConfigured(runtime: IAgentRuntime): boolean {
  const apiKey = runtime.getSetting('PROOFGATE_API_KEY');
  return Boolean(apiKey && typeof apiKey === 'string' && apiKey.startsWith('pg_'));
}
