import { type Address } from 'viem';

export interface ProofGateConfig {
  /** API key from ProofGate dashboard (starts with pg_) */
  apiKey: string;
  /** API URL (default: https://proofgate.xyz/api) */
  apiUrl?: string;
  /** Guardrail ID to validate against */
  guardrailId?: string;
  /** Chain ID (default: 8453 for Base Mainnet) */
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
  onchainStatus?: 'pending' | 'queued' | 'publishing' | 'confirmed' | 'failed';
  onChainRecorded?: boolean;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AgentInfo {
  isRegistered: boolean;
  verificationStatus: string;
  trustScore: number;
  tier: string;
  totalValidations: number;
  passedValidations: number;
}
