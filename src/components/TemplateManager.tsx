/**
 * Template Manager Component
 * Manages field templates for data extraction
 */

import React, { useState } from "react";
import { ConfirmModal, InputModal } from "./Modal";

export interface FieldTemplate {
  id: string;
  label: string;
  placeholder?: string;
  type?: "string" | "number" | "date" | "select";
  options?: string[]; // For select type
  required?: boolean;
  schemaPath?: string; // Path in JSON schema
}

export interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: FieldTemplate[];
  onSaveTemplates: (templates: FieldTemplate[]) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
}) => {
  const [editingTemplates, setEditingTemplates] =
    useState<FieldTemplate[]>(templates);
  const [addFieldModal, setAddFieldModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "remove" | "clear" | null;
    fieldId?: string;
  }>({
    isOpen: false,
    type: null,
  });

  const handleAddField = (label: string) => {
    if (!label) return;

    const id = `field_${Date.now()}`;
    const newField: FieldTemplate = {
      id,
      label,
      placeholder: "",
      type: "string",
      required: false,
    };

    setEditingTemplates((prev) => [...prev, newField]);
  };

  const handleRemoveField = (fieldId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "remove",
      fieldId,
    });
  };

  const confirmRemoveField = () => {
    if (confirmModal.fieldId) {
      setEditingTemplates((prev) =>
        prev.filter((f) => f.id !== confirmModal.fieldId)
      );
    }
    setConfirmModal({ isOpen: false, type: null });
  };

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<FieldTemplate>
  ) => {
    setEditingTemplates((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const handleSave = () => {
    onSaveTemplates(editingTemplates);
    onClose();
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      type: "clear",
    });
  };

  const confirmClearAll = () => {
    setEditingTemplates([]);
    setConfirmModal({ isOpen: false, type: null });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold">Template Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleClearAll}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium"
                title="Clear all fields"
              >
                🗑 Clear All Fields
              </button>
            </div>

            {/* Fields list */}
            <div className="space-y-3">
              {editingTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No fields defined</p>
                  <p className="text-xs mt-1">
                    Click "Add Field" to create one
                  </p>
                </div>
              ) : (
                editingTemplates.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 space-y-2"
                  >
                    {/* Field header */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          handleUpdateField(field.id, { label: e.target.value })
                        }
                        placeholder="Field label"
                        className="flex-1 px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm font-medium"
                      />
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                        title="Remove field"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Field type */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium w-20">Type:</label>
                      <select
                        value={field.type || "string"}
                        onChange={(e) =>
                          handleUpdateField(field.id, {
                            type: e.target.value as any,
                          })
                        }
                        className="flex-1 px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs"
                        aria-label="Select field type"
                      >
                        <option value="string">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={field.required || false}
                          onChange={(e) =>
                            handleUpdateField(field.id, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        Required
                      </label>
                    </div>

                    {/* Placeholder */}
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        handleUpdateField(field.id, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Placeholder text"
                      className="w-full px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs"
                    />

                    {/* Options for select type */}
                    {field.type === "select" && (
                      <input
                        type="text"
                        value={(field.options || []).join(", ")}
                        onChange={(e) =>
                          handleUpdateField(field.id, {
                            options: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Options (comma-separated)"
                        className="w-full px-2 py-1 border dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-xs"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add field button */}
            <button
              onClick={() => setAddFieldModal(true)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium"
            >
              + Add Field
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium"
            >
              Save Templates
            </button>
          </div>
        </div>
      </div>

      {/* Add field modal */}
      <InputModal
        isOpen={addFieldModal}
        onClose={() => setAddFieldModal(false)}
        onConfirm={handleAddField}
        title="Add Field"
        message="Enter a label for the new field"
        placeholder="Enter field label"
      />

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "remove"}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={confirmRemoveField}
        title="Remove Field"
        message="Are you sure you want to remove this field?"
        type="warning"
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === "clear"}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={confirmClearAll}
        title="Clear All Fields"
        message="Clear all fields? This action cannot be undone."
        type="warning"
      />
    </>
  );
};
