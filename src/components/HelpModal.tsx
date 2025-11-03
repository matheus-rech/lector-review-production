import React from 'react';
import { Modal } from './Modal';
import { KeyboardShortcut, formatShortcut } from '../hooks/useKeyboardShortcuts';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, shortcuts }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Keyboard Shortcuts">
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Getting Started
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Load a PDF by entering its path in the "PDF Source" field</li>
            <li>Navigate pages using the arrow buttons or keyboard shortcuts</li>
            <li>Select text in the PDF to create highlights</li>
            <li>Fill in the extraction fields for each page</li>
            <li>Export your data as JSON or CSV when complete</li>
          </ul>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Features
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
            <li><strong>Multi-Project Support:</strong> Create and manage multiple review projects</li>
            <li><strong>Text Highlighting:</strong> Select and label important passages</li>
            <li><strong>Search:</strong> Find text across the entire PDF</li>
            <li><strong>Per-Page Templates:</strong> Different extraction fields for each page</li>
            <li><strong>Custom Fields:</strong> Add your own extraction fields</li>
            <li><strong>Data Export:</strong> Export to JSON or CSV formats</li>
            <li><strong>Auto-Save:</strong> All data automatically saved to browser storage</li>
          </ul>
        </section>

        <section>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
            Keyboard Shortcuts
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280', fontWeight: '600' }}>
                  Shortcut
                </th>
                <th style={{ textAlign: 'left', padding: '8px', color: '#6b7280', fontWeight: '600' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <td style={{ padding: '8px' }}>
                    <code
                      style={{
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      {formatShortcut(shortcut)}
                    </code>
                  </td>
                  <td style={{ padding: '8px', color: '#4b5563' }}>{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ marginTop: '24px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#92400e' }}>
            <strong>💡 Tip:</strong> All your data is saved automatically in your browser's local storage. 
            Make sure to export your data regularly to avoid data loss.
          </p>
        </section>
      </div>
    </Modal>
  );
};
