import { useState, useCallback } from 'react';
import type { FormField } from '../../types';
import Button from '../ui/button';
import FieldsList from '../forms/fieldsList';
import { LoadingSpinner } from '../ui/loading';

const STORAGE_KEY = 'form-fields';

function loadFields(): FormField[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFields(fields: FormField[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

export function FormsHelperTab() {
  const [fields, setFields] = useState<FormField[]>(() => loadFields());
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const mockFields: FormField[] = [
        {
          id: '1',
          label: 'Full Name',
          type: 'text',
          filled: false,
          detectedAt: new Date().toISOString(),
        },
        {
          id: '2',
          label: 'Email',
          type: 'email',
          filled: false,
          detectedAt: new Date().toISOString(),
        },
        {
          id: '3',
          label: 'Phone Number',
          type: 'tel',
          filled: false,
          detectedAt: new Date().toISOString(),
        },
        {
          id: '4',
          label: 'Current Company',
          type: 'text',
          filled: false,
          detectedAt: new Date().toISOString(),
        },
        {
          id: '5',
          label: 'Years of Experience',
          type: 'select',
          filled: false,
          detectedAt: new Date().toISOString(),
        },
      ];
      saveFields(mockFields);
      setFields(mockFields);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to scan page');
    } finally {
      setScanning(false);
    }
  }, []);

  const handleFillAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filled = fields.map((f) => ({ ...f, filled: true }));
      saveFields(filled);
      setFields(filled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fill fields');
    } finally {
      setLoading(false);
    }
  }, [fields]);

  const handleClear = useCallback(() => {
    const cleared = fields.map((f) => ({ ...f, filled: false, value: undefined }));
    saveFields(cleared);
    setFields(cleared);
  }, [fields]);

  const filledCount = fields.filter((f) => f.filled).length;
  const totalCount = fields.length;
  const progressPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" id="forms-toolbar">
        <Button
          size="sm"
          onClick={handleScan}
          loading={scanning}
          id="scan-page-btn"
        >
          {scanning ? 'Scanning...' : 'Scan Page'}
        </Button>
        <Button
          size="sm"
          onClick={handleFillAll}
          loading={loading}
          disabled={fields.length === 0}
          id="fill-all-btn"
        >
          Fill All Fields
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleClear}
          disabled={fields.length === 0}
          id="clear-indicators-btn"
        >
          Clear Indicators
        </Button>
      </div>

      {totalCount > 0 && (
        <div className="space-y-2" id="progress-section">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="text-gray-600">
              {filledCount} / {totalCount} fields ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {scanning ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <FieldsList
          fields={fields}
          loading={loading}
        />
      )}

      {fields.length > 0 && !scanning && !loading && (
        <div className="text-center text-xs text-gray-500 pt-2">
          {filledCount === totalCount
            ? 'All fields filled!'
            : `${totalCount - filledCount} field(s) remain empty`}
        </div>
      )}
    </div>
  );
}

export default FormsHelperTab;