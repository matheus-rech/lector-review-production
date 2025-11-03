/**
 * Schema Form Component
 * Generates forms based on JSON schema with source traceability
 */

import React, { useState } from 'react';
import { SchemaField, SchemaSection, SourcedValue, createSourcedValue } from '../utils/schemaParser';

interface SchemaFormProps {
  sections: SchemaSection[];
  data: Record<string, any>;
  onDataChange: (path: string, value: any) => void;
  onLinkHighlight?: (path: string) => void;
  currentSection?: string;
}

export const SchemaForm: React.FC<SchemaFormProps> = ({
  sections,
  data,
  onDataChange,
  onLinkHighlight,
  currentSection,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set([currentSection || sections[0]?.id])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const renderField = (field: SchemaField, parentPath: string = '') => {
    const fullPath = parentPath ? `${parentPath}.${field.id}` : field.id;
    const value = getValueByPath(data, fullPath);

    // Handle sourced fields
    if (field.isSourced) {
      return renderSourcedField(field, fullPath, value);
    }

    // Handle nested objects
    if (field.type === 'object' && field.properties) {
      return (
        <div key={field.id} className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium block">{field.label}</label>
          {field.properties.map((subField) => renderField(subField, fullPath))}
        </div>
      );
    }

    // Handle arrays
    if (field.type === 'array') {
      return renderArrayField(field, fullPath, value);
    }

    // Handle regular fields
    return renderRegularField(field, fullPath, value);
  };

  const renderSourcedField = (field: SchemaField, path: string, value: SourcedValue | any) => {
    const sourcedValue = value && typeof value === 'object' && 'value' in value ? value : { value: value || '' };

    return (
      <div key={field.id} className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" title={field.description}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {onLinkHighlight && (
            <button
              onClick={() => onLinkHighlight(path)}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              title="Link to highlight"
            >
              🔗 Link
            </button>
          )}
        </div>

        {/* Main value input */}
        {field.type === 'enum' && field.enum ? (
          <select
            value={sourcedValue.value || ''}
            onChange={(e) => onDataChange(path, createSourcedValue(e.target.value, sourcedValue.source_text, sourcedValue.source_location))}
            className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Select...</option>
            {field.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
            value={sourcedValue.value || ''}
            onChange={(e) => {
              const val = field.type === 'number' ? parseFloat(e.target.value) : 
                         field.type === 'integer' ? parseInt(e.target.value) : 
                         e.target.value;
              onDataChange(path, createSourcedValue(val, sourcedValue.source_text, sourcedValue.source_location));
            }}
            placeholder={field.description}
            className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          />
        )}

        {/* Source text */}
        <input
          type="text"
          value={sourcedValue.source_text || ''}
          onChange={(e) => onDataChange(path, { ...sourcedValue, source_text: e.target.value })}
          placeholder="Source text (exact quote)"
          className="w-full px-2 py-1 border dark:border-gray-600 rounded text-xs bg-gray-50 dark:bg-gray-700/50"
        />

        {/* Source location */}
        <input
          type="text"
          value={sourcedValue.source_location || ''}
          onChange={(e) => onDataChange(path, { ...sourcedValue, source_location: e.target.value })}
          placeholder="Source location (e.g., Table 1, Page 4)"
          className="w-full px-2 py-1 border dark:border-gray-600 rounded text-xs bg-gray-50 dark:bg-gray-700/50"
        />

        {sourcedValue.highlightId && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ Linked to highlight
          </div>
        )}
      </div>
    );
  };

  const renderRegularField = (field: SchemaField, path: string, value: any) => {
    return (
      <div key={field.id} className="space-y-1">
        <label className="text-sm font-medium" title={field.description}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {field.type === 'enum' && field.enum ? (
          <select
            value={value || ''}
            onChange={(e) => onDataChange(path, e.target.value)}
            className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          >
            <option value="">Select...</option>
            {field.enum.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onDataChange(path, e.target.checked)}
            className="rounded"
          />
        ) : (
          <input
            type={field.type === 'number' || field.type === 'integer' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => {
              const val = field.type === 'number' ? parseFloat(e.target.value) : 
                         field.type === 'integer' ? parseInt(e.target.value) : 
                         e.target.value;
              onDataChange(path, val);
            }}
            placeholder={field.description}
            className="w-full px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800"
          />
        )}
      </div>
    );
  };

  const renderArrayField = (field: SchemaField, path: string, value: any[]) => {
    const items = Array.isArray(value) ? value : [];

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{field.label}</label>
          <button
            onClick={() => onDataChange(path, [...items, field.items?.isSourced ? createSourcedValue('') : ''])}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + Add
          </button>
        </div>

        <div className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                {field.items && renderField({ ...field.items, id: `${field.id}[${index}]` }, `${path}[${index}]`)}
              </div>
              <button
                onClick={() => onDataChange(path, items.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-600 text-xs"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between text-left"
          >
            <div>
              <h3 className="font-semibold text-sm">{section.title}</h3>
              {section.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{section.description}</p>
              )}
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${expandedSections.has(section.id) ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has(section.id) && (
            <div className="p-4 space-y-3">
              {section.fields.map((field) => renderField(field))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Get value by path (e.g., "I_StudyMetadataAndIdentification.studyID")
 */
function getValueByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    // Handle array indices
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key]?.[parseInt(index)];
    } else {
      current = current?.[part];
    }

    if (current === undefined) return undefined;
  }

  return current;
}
