/**
 * FeatureGate Component
 *
 * A component that conditionally renders its children based on feature flags
 *
 * @module FeatureGate
 */

import { type ReactNode } from "react";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { type FeatureFlag } from "../utils/featureFlags";

interface FeatureGateProps {
  /**
   * The feature flag to check
   */
  feature: FeatureFlag;

  /**
   * Content to render when the feature is enabled
   */
  children: ReactNode;

  /**
   * Optional fallback content to render when the feature is disabled
   */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on a feature flag
 *
 * @example
 * ```tsx
 * <FeatureGate feature="AI_EXTRACTION">
 *   <AIExtractionButton />
 * </FeatureGate>
 * ```
 *
 * @example With fallback
 * ```tsx
 * <FeatureGate
 *   feature="CLOUD_SYNC"
 *   fallback={<LocalStorageOnly />}
 * >
 *   <CloudSyncButton />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature);

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
