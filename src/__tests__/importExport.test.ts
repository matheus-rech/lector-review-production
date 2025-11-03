/**
 * Integration tests for import/export functionality
 */

import { describe, it, expect } from 'vitest';
import {
  generateSummaryReport,
  type ProjectData,
} from '../utils/importExport';

describe('Import/Export Utils', () => {
  const mockProjectData: ProjectData = {
    project: 'test-project',
    source: '/test.pdf',
    highlights: [
      {
        id: 'h1',
        label: 'Test Highlight',
        kind: 'user',
        pageNumber: 1,
        x: 100,
        y: 100,
        width: 200,
        height: 20,
      },
    ],
    templates: {
      1: [
        { id: 'field1', label: 'Test Field', placeholder: 'Enter value' },
      ],
    },
    pageForm: {
      '1:field1': 'Test Value',
    },
    exportedAt: new Date().toISOString(),
  };

  describe('generateSummaryReport', () => {
    it('should generate a markdown summary', () => {
      const report = generateSummaryReport(mockProjectData);
      
      expect(report).toContain('# Extraction Summary: test-project');
      expect(report).toContain('## Highlights');
      expect(report).toContain('Test Highlight');
      expect(report).toContain('## Extracted Data');
      expect(report).toContain('### Page 1');
      expect(report).toContain('field1');
      expect(report).toContain('Test Value');
    });

    it('should handle empty data', () => {
      const emptyData: ProjectData = {
        ...mockProjectData,
        highlights: [],
        pageForm: {},
      };
      
      const report = generateSummaryReport(emptyData);
      expect(report).toContain('Total: 0');
    });

    it('should sort pages correctly', () => {
      const multiPageData: ProjectData = {
        ...mockProjectData,
        pageForm: {
          '3:field1': 'Page 3',
          '1:field1': 'Page 1',
          '2:field1': 'Page 2',
        },
      };
      
      const report = generateSummaryReport(multiPageData);
      const page1Index = report.indexOf('### Page 1');
      const page2Index = report.indexOf('### Page 2');
      const page3Index = report.indexOf('### Page 3');
      
      expect(page1Index).toBeLessThan(page2Index);
      expect(page2Index).toBeLessThan(page3Index);
    });
  });
});
