import { AlertTriangle, X } from 'lucide-react';
import Button from './Button.jsx';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-full shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h2 id="confirm-title" className="text-xl font-bold text-slate-900">
                {title}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-base text-slate-600 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
