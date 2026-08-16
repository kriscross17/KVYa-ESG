import { useState } from 'react';
import { Camera } from 'lucide-react';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';
import OcrScanModal from './OcrScanModal.jsx';
import {
  OPERATIONAL_FIELD_LABELS,
  OPERATIONAL_FIELD_HELP,
} from '../../data/constants.js';
import { validateOperationalData } from '../../utils/validation.js';
import { OPERATIONAL_PATTERNS } from '../../hooks/useOcrExtraction.js';

export default function OperationalDataForm({ data, onChange, errors = {}, ocrFilledFields = [], onOcrScan, submissionId }) {
  const [showOcr, setShowOcr] = useState(false);
  const [localOcrFields, setLocalOcrFields] = useState(ocrFilledFields);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleOcrApply = (filled, fields) => {
    onChange({ ...data, ...filled });
    setLocalOcrFields(fields);
  };

  const liveErrors = { ...validateOperationalData(data, false), ...errors };

  const fields = [
    'totalEmployees',
    'femaleEmployees',
    'digitalTransactionsPercent',
    'energyUsageKwh',
    'trainingHoursPerEmployee',
    'communityProgramsCount',
    'grievancesResolved',
    'grievancesTotal',
  ];

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" size="lg" icon={Camera} onClick={() => setShowOcr(true)}>
          Scan Document / Photo to Auto-Fill
        </Button>
      </div>

      {fields.map((field) => (
        <FormField
          key={field}
          label={OPERATIONAL_FIELD_LABELS[field]}
          help={OPERATIONAL_FIELD_HELP[field]}
          error={liveErrors[field]}
          required
          highlighted={localOcrFields.includes(field)}
        >
          <input
            type="number"
            min="0"
            step={['totalEmployees', 'femaleEmployees', 'communityProgramsCount', 'grievancesResolved', 'grievancesTotal'].includes(field) ? '1' : field === 'digitalTransactionsPercent' ? '0.1' : 'any'}
            max={field === 'digitalTransactionsPercent' ? '100' : undefined}
            value={data[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
            placeholder={`Enter ${OPERATIONAL_FIELD_LABELS[field].toLowerCase()}`}
          />
        </FormField>
      ))}

      <OcrScanModal
        open={showOcr}
        onClose={() => setShowOcr(false)}
        fieldPatterns={OPERATIONAL_PATTERNS}
        onApply={handleOcrApply}
        onScanComplete={onOcrScan}
        submissionId={submissionId}
        evidenceCategory="operational_evidence"
      />
    </div>
  );
}
