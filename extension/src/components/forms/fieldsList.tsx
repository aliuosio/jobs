import type { FormField } from '../../types';
import { Skeleton } from '../ui/loading';

interface FieldsListProps {
  fields: FormField[];
  loading?: boolean;
  onFieldClick?: (field: FormField) => void;
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  text: 'Aa',
  email: '@',
  tel: '☎',
  textarea: '¶',
  select: '▼',
  checkbox: '☑',
};

function getFieldTypeColor(type: string): string {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-700';
    case 'email':
      return 'bg-green-100 text-green-700';
    case 'tel':
      return 'bg-purple-100 text-purple-700';
    case 'textarea':
      return 'bg-orange-100 text-orange-700';
    case 'select':
      return 'bg-gray-100 text-gray-700';
    case 'checkbox':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function FieldsList({ fields, loading, onFieldClick }: FieldsListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
            <Skeleton className="w-8 h-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No form fields detected</p>
        <p className="text-sm mt-1">Click "Scan Page" to find form fields</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <button
          key={field.id}
          onClick={() => onFieldClick?.(field)}
          className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
        >
          <span
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded font-mono text-sm font-medium ${getFieldTypeColor(field.type)}`}
          >
            {FIELD_TYPE_ICONS[field.type] || '?'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{field.label}</p>
            <p className="text-sm text-gray-500 truncate">{field.type}</p>
          </div>
          <span
            className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
              field.filled
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {field.filled ? 'Filled' : 'Empty'}
          </span>
        </button>
      ))}
    </div>
  );
}

export default FieldsList;