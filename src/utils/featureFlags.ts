/**
 * Feature Flags System
 *
 * This module provides a centralized feature flag system for safe rollout
 * of new features. Features can be enabled/disabled via environment variables.
 *
 * @module featureFlags
 */

/**
 * Feature flag configuration
 * Features are disabled by default and must be explicitly enabled via environment variables
 */
export const FEATURES = {
  /**
   * AI-powered data extraction from PDFs
   * Enables LLM integration for automated field filling
   */
  AI_EXTRACTION: import.meta.env.VITE_ENABLE_AI === "true",

  /**
   * Cloud synchronization
   * Enables cloud storage and multi-device sync
   */
  CLOUD_SYNC: import.meta.env.VITE_ENABLE_CLOUD === "true",

  /**
   * Real-time collaboration features
   * Enables multi-user editing and shared annotations
   */
  COLLABORATION: import.meta.env.VITE_ENABLE_COLLAB === "true",

  /**
   * Advanced analytics dashboard
   * Enables cross-document analysis and visualization
   */
  ADVANCED_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === "true",

  /**
   * Plugin system
   * Enables third-party plugin loading
   */
  PLUGIN_SYSTEM: import.meta.env.VITE_ENABLE_PLUGINS === "true",

  /**
   * Experimental features (for development/testing)
   * Enables features that are still in development
   */
  EXPERIMENTAL: import.meta.env.VITE_ENABLE_EXPERIMENTAL === "true",
} as const;

/**
 * Type-safe feature flag keys
 */
export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 * @param feature - The feature flag to check
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}

/**
 * Get all enabled features
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return (Object.keys(FEATURES) as FeatureFlag[]).filter(
    (key) => FEATURES[key]
  );
}

/**
 * Get feature flag status for debugging
 * @returns Object with all feature flags and their status
 */
export function getFeatureFlagStatus(): Record<FeatureFlag, boolean> {
  return { ...FEATURES };
}

/**
 * Log feature flag status to console (development only)
 */
export function logFeatureFlags(): void {
  if (import.meta.env.DEV) {
    console.group("🚩 Feature Flags");
    Object.entries(FEATURES).forEach(([key, value]) => {
      console.log(`${value ? "✅" : "❌"} ${key}: ${value}`);
    });
    console.groupEnd();
  }
}
