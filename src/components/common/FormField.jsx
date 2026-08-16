import { AlertCircle } from 'lucide-react';

export default function FormField({
  label,
  help,
  error,
  required,
  children,
  highlighted,
}) {
  return (
    <div className={`mb-6 ${highlighted ? 'ring-2 ring-green-400 ring-offset-2 rounded-xl p-3 bg-green-50' : ''}`}>
      <label className="block text-base font-semibold text-slate-800 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
        {highlighted && (
          <span className="ml-2 text-sm font-medium text-green-700">(Auto-filled by OCR)</span>
        )}
      </label>
      {help && <p className="text-sm text-slate-500 mb-2">{help}</p>}
      {children}
      {error && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
