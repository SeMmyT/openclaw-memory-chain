/**
 * Anchor Provider Abstraction
 *
 * Unified interface for different anchoring backends:
 * - OpenTimestamps (Bitcoin)
 * - Base blockchain (WITNESS token)
 */

import type { ChainEntry } from '../types.js';

// ============================================================================
// Provider Types
// ============================================================================

/** Supported anchor provider types */
export type AnchorProviderType = 'opentimestamps' | 'base';

/** Status of an anchor across all providers */
export type AnchorProviderStatus = 'pending' | 'confirmed' | 'failed';

/** Result of submitting an anchor */
export interface ProviderSubmitResult {
  success: boolean;
  provider: AnchorProviderType;
  /** Sequence number or identifier */
  seq?: number;
  /** Transaction hash (for blockchain providers) */
  txHash?: string;
  /** Path to proof file (for OTS) */
  proofPath?: string;
  /** Error message if failed */
  error?: string;
}

/** Result of verifying an anchor */
export interface ProviderVerifyResult {
  valid: boolean;
  provider: AnchorProviderType;
  status: AnchorProviderStatus;
  /** Block number (blockchain) or height (Bitcoin) */
  blockNumber?: number | bigint;
  /** Timestamp when confirmed */
  timestamp?: string;
  /** Error message if failed */
  error?: string;
}

/** Anchor record from a provider */
export interface ProviderAnchorRecord {
  provider: AnchorProviderType;
  status: AnchorProviderStatus;
  /** Chain root hash at anchor time */
  chainRoot?: string;
  /** Entry count at anchor time */
  entryCount?: number;
  /** Submission timestamp */
  submittedAt: string;
  /** Confirmation timestamp */
  confirmedAt?: string;
  /** Block information */
  blockNumber?: number | bigint;
  blockTimestamp?: string;
  /** Transaction hash */
  txHash?: string;
  /** Error if any */
  error?: string;
}

/** Cost estimate for anchoring */
export interface ProviderCostEstimate {
  provider: AnchorProviderType;
  /** Fee in native units (WITNESS tokens, satoshis, etc.) */
  fee: bigint;
  /** Fee in human readable format */
  feeFormatted: string;
  /** Estimated gas (for EVM chains) */
  estimatedGas?: bigint;
  /** Whether the provider is available */
  available: boolean;
}

/** Options for anchor submission */
export interface ProviderSubmitOptions {
  /** For Base: wallet private key for transaction signing */
  walletPrivateKey?: `0x${string}`;
  /** For OTS: calendar server URLs */
  calendars?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
}

/** Options for anchor verification */
export interface ProviderVerifyOptions {
  /** For OTS: Bitcoin RPC URL */
  bitcoinRpcUrl?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

// ============================================================================
// Provider Interface
// ============================================================================

/**
 * Abstract interface for anchor providers
 *
 * Implementations:
 * - OpenTimestamps: Bitcoin timestamping
 * - Base: WITNESS token anchoring
 */
export interface AnchorProvider {
  /** Provider type identifier */
  readonly type: AnchorProviderType;

  /**
   * Submit an entry or chain state for anchoring
   * @param dataDir - Chain data directory
   * @param entry - Entry to anchor (or null for chain-level anchor)
   * @param options - Provider-specific options
   */
  submit(
    dataDir: string,
    entry: ChainEntry | null,
    options?: ProviderSubmitOptions
  ): Promise<ProviderSubmitResult>;

  /**
   * Verify an anchor
   * @param dataDir - Chain data directory
   * @param seq - Sequence number to verify (or null for latest)
   * @param options - Provider-specific options
   */
  verify(
    dataDir: string,
    seq: number | null,
    options?: ProviderVerifyOptions
  ): Promise<ProviderVerifyResult>;

  /**
   * Get status of anchors
   * @param dataDir - Chain data directory
   * @param seq - Specific sequence number (or null for all)
   */
  getStatus(dataDir: string, seq?: number | null): Promise<ProviderAnchorRecord[]>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Estimate cost to anchor
   * @param count - Number of entries to anchor (for batch estimation)
   */
  estimateCost(count?: number): Promise<ProviderCostEstimate>;
}

// ============================================================================
// Provider Registry
// ============================================================================

/** Registry of available providers */
const providers = new Map<AnchorProviderType, AnchorProvider>();

/**
 * Register an anchor provider
 */
export function registerProvider(provider: AnchorProvider): void {
  providers.set(provider.type, provider);
}

/**
 * Get a registered provider by type
 */
export function getProvider(type: AnchorProviderType): AnchorProvider | undefined {
  return providers.get(type);
}

/**
 * Get all registered providers
 */
export function getAllProviders(): AnchorProvider[] {
  return Array.from(providers.values());
}

/**
 * Check if a provider is registered
 */
export function hasProvider(type: AnchorProviderType): boolean {
  return providers.has(type);
}
