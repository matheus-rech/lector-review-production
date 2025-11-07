/**
 * Custom Hooks Barrel Exports
 *
 * This file provides a single import point for all custom hooks.
 * Usage: import { useDarkMode, useDebounce } from '@/hooks'
 */

// Theme Hook
export { useDarkMode } from "./useDarkMode";

// Performance Hooks
export { useDebounce } from "./useDebounce";

// Interaction Hooks
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// State Management Hooks
export { useUndoRedo } from "./useUndoRedo";

// PDF Management Hook
export { usePDFManager } from "./usePDFManager";
