/**
 * Validation utilities for form fields
 */

export interface ValidationRule {
  type: 'required' | 'number' | 'email' | 'url' | 'pattern' | 'minLength' | 'maxLength';
  value?: any;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a single field value against rules
 */
export function validateField(value: string, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim().length === 0) {
          errors.push(rule.message);
        }
        break;

      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push(rule.message);
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'url':
        try {
          if (value) new URL(value);
        } catch {
          errors.push(rule.message);
        }
        break;

      case 'pattern':
        if (value && rule.value && !new RegExp(rule.value).test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'minLength':
        if (value && value.length < rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'maxLength':
        if (value && value.length > rule.value) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation rules for systematic review fields
 */
export const commonValidations = {
  doi: [
    {
      type: 'pattern' as const,
      value: '^10\\.\\d{4,}(\\.\\d+)*\\/[\\S]+$',
      message: 'Invalid DOI format (should start with 10.)',
    },
  ],
  pmid: [
    {
      type: 'pattern' as const,
      value: '^\\d{8}$',
      message: 'PMID should be 8 digits',
    },
  ],
  year: [
    {
      type: 'pattern' as const,
      value: '^(19|20)\\d{2}$',
      message: 'Year should be in format YYYY (1900-2099)',
    },
  ],
  percentage: [
    {
      type: 'pattern' as const,
      value: '^\\d+(\\.\\d+)?%?$',
      message: 'Should be a valid percentage (e.g., 64.3 or 64.3%)',
    },
  ],
  pValue: [
    {
      type: 'pattern' as const,
      value: '^(0|1|0\\.\\d+|<\\s*0\\.\\d+)$',
      message: 'P-value should be between 0 and 1 (e.g., 0.009 or <0.001)',
    },
  ],
};

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return String(num);
  return n.toLocaleString();
}

/**
 * Parse a percentage string to number
 */
export function parsePercentage(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)%?$/);
  if (!match) return null;
  return parseFloat(match[1]);
}
