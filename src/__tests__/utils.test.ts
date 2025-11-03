/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateField,
  sanitizeInput,
  formatNumber,
  parsePercentage,
  commonValidations,
} from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const result = validateField('', [
        { type: 'required', message: 'Field is required' },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field is required');
    });

    it('should validate number fields', () => {
      const result = validateField('abc', [
        { type: 'number', message: 'Must be a number' },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must be a number');
    });

    it('should validate email fields', () => {
      const result = validateField('invalid-email', [
        { type: 'email', message: 'Invalid email' },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email');
    });

    it('should pass valid email', () => {
      const result = validateField('test@example.com', [
        { type: 'email', message: 'Invalid email' },
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = sanitizeInput(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Test "quoted" text';
      const output = sanitizeInput(input);
      expect(output).toContain('&quot;');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle string numbers', () => {
      expect(formatNumber('1234')).toBe('1,234');
    });

    it('should handle invalid input', () => {
      expect(formatNumber('abc')).toBe('abc');
    });
  });

  describe('parsePercentage', () => {
    it('should parse percentage strings', () => {
      expect(parsePercentage('50%')).toBe(50);
      expect(parsePercentage('75.5%')).toBe(75.5);
      expect(parsePercentage('100')).toBe(100);
    });

    it('should return null for invalid input', () => {
      expect(parsePercentage('abc')).toBeNull();
      expect(parsePercentage('50%%')).toBeNull();
    });
  });

  describe('commonValidations', () => {
    it('should validate DOI format', () => {
      const result = validateField('10.1234/test', commonValidations.doi);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid DOI', () => {
      const result = validateField('invalid-doi', commonValidations.doi);
      expect(result.isValid).toBe(false);
    });

    it('should validate year format', () => {
      const result = validateField('2024', commonValidations.year);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid year', () => {
      const result = validateField('1800', commonValidations.year);
      expect(result.isValid).toBe(false);
    });
  });
});
