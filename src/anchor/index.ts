/**
 * Unified Anchor API
 *
 * Provides a unified interface for anchoring across different providers:
 * - OpenTimestamps (Bitcoin)
 * - Base (WITNESS token)
 */

// Re-export provider types and utilities
export type {
  AnchorProviderType,
  AnchorProviderStatus,
  ProviderSubmitResult,
  ProviderVerifyResult,
  ProviderAnchorRecord,
  ProviderCostEstimate,
  ProviderSubmitOptions,
  ProviderVerifyOptions,
  AnchorProvider,
} from './provider.js';

export {
  registerProvider,
  getProvider,
  getAllProviders,
  hasProvider,
} from './provider.js';

// Re-export OpenTimestamps functions
export {
  submitAnchor,
  submitAnchorsForEntries,
  upgradePendingAnchors,
  verifyAnchor,
  getAnchorStatus,
  hasAnchor,
  getUnanchoredEntries,
} from './opentimestamps.js';

// Re-export OpenTimestamps types
export type {
  AnchorStatus,
  AnchorRecord,
  PendingAnchorsFile,
  AnchorSubmitResult,
  AnchorVerifyResult,
  AnchorStatusResult,
  AnchorOptions,
  VerificationWithAnchorsResult,
} from './types.js';

// Re-export Base functions and types
export {
  anchorToBase,
  verifyAgainstBase,
  getBaseAnchorHistory,
  getWitnessBalance,
  getAnchorFee,
  BaseAnchorProvider,
} from './base.js';

export type {
  BaseAnchorConfig,
  BaseAnchorReceipt,
  OnChainAnchor,
  BaseVerificationResult,
} from './base.js';
