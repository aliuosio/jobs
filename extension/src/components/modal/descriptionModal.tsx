import { useState, useEffect, useRef } from 'react';
import Button from '../ui/button';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  initialDescription?: string;
  jobTitle?: string;
}

export function DescriptionModal({ isOpen, onClose, onSave, initialDescription = '', jobTitle }: DescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDescription(initialDescription);
  }, [initialDescription, isOpen]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (description.trim()) {
      onSave(description.trim());
      setDescription('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Save Job Description
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          {jobTitle && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Job:</span> {jobTitle}
            </p>
          )}
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Press Cmd+Enter to save
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!description.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DescriptionModal;