import { useState } from 'react';
import { Camera } from 'lucide-react';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';
import OcrScanModal from './OcrScanModal.jsx';
import {
  BUILDING_TYPES,
  BUILDING_FIELD_LABELS,
  BUILDING_FIELD_HELP,
} from '../../data/constants.js';
import { validateBuildingData } from '../../utils/validation.js';
import { BUILDING_PATTERNS } from '../../hooks/useOcrExtraction.js';

export default function BuildingDataForm({ data, onChange, errors = {}, ocrFilledFields = [], onOcrScan, submissionId }) {
  const [showOcr, setShowOcr] = useState(false);
  const [localOcrFields, setLocalOcrFields] = useState(ocrFilledFields);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleOcrApply = (filled, fields) => {
    onChange({ ...data, ...filled });
    setLocalOcrFields(fields);
  };

  const liveErrors = { ...validateBuildingData(data, false), ...errors };

  return (
    <div>
      <div className="mb-6">
        <Button variant="secondary" size="lg" icon={Camera} onClick={() => setShowOcr(true)}>
          Scan Document / Photo to Auto-Fill
        </Button>
      </div>

      <FormField
        label={BUILDING_FIELD_LABELS.buildingType}
        help={BUILDING_FIELD_HELP.buildingType}
        error={liveErrors.buildingType}
        required
      >
        <select
          value={data.buildingType}
          onChange={(e) => handleChange('buildingType', e.target.value)}
          className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
        >
          <option value="">— Select building type —</option>
          {BUILDING_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>

      {['areaSqFt', 'electricityConsumptionKwh', 'waterUsageKl', 'wasteGeneratedKg', 'renewableEnergyKwh', 'fuelConsumptionLitres', 'greenCoverSqFt'].map((field) => (
        <FormField
          key={field}
          label={BUILDING_FIELD_LABELS[field]}
          help={BUILDING_FIELD_HELP[field]}
          error={liveErrors[field]}
          required
          highlighted={localOcrFields.includes(field)}
        >
          <input
            type="number"
            min="0"
            step="any"
            value={data[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
            placeholder={`Enter ${BUILDING_FIELD_LABELS[field].toLowerCase()}`}
          />
        </FormField>
      ))}

      <OcrScanModal
        open={showOcr}
        onClose={() => setShowOcr(false)}
        fieldPatterns={BUILDING_PATTERNS}
        onApply={handleOcrApply}
        onScanComplete={onOcrScan}
        submissionId={submissionId}
        evidenceCategory="building_evidence"
      />
    </div>
  );
}
