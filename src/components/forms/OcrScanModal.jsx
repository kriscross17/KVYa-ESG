import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '../common/Button.jsx';
import { useOcrExtraction } from '../../hooks/useOcrExtraction.js';
import { backendEnabled, uploadEvidence } from '../../utils/api.js';

export default function OcrScanModal({ open, onClose, fieldPatterns, onApply, onScanComplete, submissionId, evidenceCategory = 'document' }) {
  const fileInputRef = useRef(null);
  const [showRawText, setShowRawText] = useState(false);
  const [preview, setPreview] = useState(null);
  const { isProcessing, progress, rawText, filledFields, error, confidence, processImage, reset } =
    useOcrExtraction(fieldPatterns);


  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const handleFile = async (file) => {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    try {
      const result = await processImage(file);
      onApply(result.filled, result.filledFields);
      let evidence = null;
      if (backendEnabled && submissionId && typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          evidence = await uploadEvidence({
            submissionId,
            file,
            category: evidenceCategory,
            ocrText: result.rawText,
            ocrConfidence: result.confidence,
          });
        } catch {
          // OCR remains usable even if evidence upload is temporarily unavailable.
        }
      }
      onScanComplete?.({
        confidence: result.confidence,
        fields: result.filledFields,
        fileName: file.name,
        scannedAt: new Date().toISOString(),
        evidence,
      });
    } catch {
      // error state handled in hook
    }
  };

  const handleClose = () => {
    reset();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setShowRawText(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 sm:p-8 my-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Scan Document / Photo</h2>
            <p className="text-slate-600 mt-1">
              Upload a bill or photo, or use your camera to auto-fill form fields.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isProcessing && !rawText && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              variant="primary"
              size="lg"
              icon={Upload}
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image from Device
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={Camera}
              className="w-full"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute('capture', 'environment');
                  fileInputRef.current.click();
                }
              }}
            >
              Use Camera to Take Photo
            </Button>
          </div>
        )}

        {preview && (
          <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
            <img src={preview} alt="Uploaded document" className="w-full max-h-48 object-contain bg-slate-100" />
          </div>
        )}

        {isProcessing && (
          <div className="mt-6 text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-700 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-800">Reading document...</p>
            <p className="text-slate-600 mt-1">This may take a few seconds</p>
            <div className="mt-4 w-full bg-slate-200 rounded-full h-3">
              <div
                className="bg-blue-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{progress}% complete</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {rawText && !isProcessing && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-amber-900 text-sm">
                Please verify the auto-filled values before saving — OCR may not always be 100% accurate.
              </p>
            </div>

            {confidence !== null && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">OCR confidence</span>
                  <span className={`font-bold ${confidence >= 80 ? 'text-green-700' : confidence >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                    {confidence}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${confidence}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">Lower confidence means the operator should verify more carefully.</p>
              </div>
            )}

            {filledFields.length > 0 ? (
              <p className="text-green-800 font-medium">
                Auto-filled {filledFields.length} field(s). Check highlighted fields on the form.
              </p>
            ) : (
              <p className="text-slate-600">
                No matching values were found. Please enter data manually.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-2 text-blue-700 font-medium hover:underline"
            >
              {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showRawText ? 'Hide' : 'Show'} raw extracted text
            </button>
            {showRawText && (
              <pre className="p-4 bg-slate-100 rounded-xl text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {rawText}
              </pre>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { if (preview) URL.revokeObjectURL(preview); reset(); setPreview(null); }}>
                Scan Another
              </Button>
              <Button variant="primary" onClick={handleClose}>
                Done — Review Form
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
