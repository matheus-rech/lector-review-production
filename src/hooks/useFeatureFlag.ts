/**
 * React Hook for Feature Flags
 *
 * Provides a convenient way to check feature flags in React components
 *
 * @module useFeatureFlag
 */

import { useMemo } from "react";
import { isFeatureEnabled, type FeatureFlag } from "../utils/featureFlags";

/**
 * Hook to check if a feature is enabled
 *
 * @param feature - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAIEnabled = useFeatureFlag('AI_EXTRACTION');
 *
 *   return (
 *     <div>
 *       {isAIEnabled && <AIExtractionButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return useMemo(() => isFeatureEnabled(feature), [feature]);
}

/**
 * Hook to check multiple feature flags at once
 *
 * @param features - Array of feature flags to check
 * @returns Object mapping feature names to their enabled status
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { AI_EXTRACTION, CLOUD_SYNC } = useFeatureFlags([
 *     'AI_EXTRACTION',
 *     'CLOUD_SYNC'
 *   ]);
 *
 *   return (
 *     <div>
 *       {AI_EXTRACTION && <AIButton />}
 *       {CLOUD_SYNC && <CloudSyncButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureFlags(
  features: FeatureFlag[]
): Record<FeatureFlag, boolean> {
  return useMemo(() => {
    return features.reduce(
      (acc, feature) => {
        acc[feature] = isFeatureEnabled(feature);
        return acc;
      },
      {} as Record<FeatureFlag, boolean>
    );
  }, [features]);
}
