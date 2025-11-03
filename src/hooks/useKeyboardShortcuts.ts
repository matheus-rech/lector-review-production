import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description: string;
}

/**
 * Custom hook for keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcuts to register
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+Z, Ctrl+Y, Ctrl+S in input fields
        if (
          !(
            (event.ctrlKey || event.metaKey) &&
            (event.key === 'z' || event.key === 'y' || event.key === 's')
          )
        ) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Get a formatted string for displaying a keyboard shortcut
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('Cmd');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
}

/**
 * Common keyboard shortcuts for the application
 */
export const commonShortcuts = {
  save: { key: 's', ctrl: true, description: 'Save current work' },
  undo: { key: 'z', ctrl: true, description: 'Undo last action' },
  redo: { key: 'y', ctrl: true, description: 'Redo last action' },
  search: { key: 'f', ctrl: true, description: 'Focus search' },
  nextPage: { key: 'ArrowRight', description: 'Next page' },
  prevPage: { key: 'ArrowLeft', description: 'Previous page' },
  exportJSON: { key: 'e', ctrl: true, shift: true, description: 'Export JSON' },
  exportCSV: { key: 'e', ctrl: true, description: 'Export CSV' },
  newProject: { key: 'n', ctrl: true, description: 'New project' },
  help: { key: '?', shift: true, description: 'Show help' },
};
