import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Save } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import Button from '../../components/common/Button.jsx';
import FormField from '../../components/common/FormField.jsx';
import { OPERATOR_STEPS, POST_OFFICE_RECORDS, REPORTING_PERIODS, STATUSES } from '../../data/constants.js';
import { backendEnabled } from '../../utils/api.js';

export default function NewSubmission() {
  const {
    createDraft,
    updateDraft,
    operatorName,
    operatorOfficeId,
    operatorOfficeName,
    getSubmissionById,
  } = useSubmissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDraftId = location.state?.draftId || null;

  // /operator/new starts a genuinely new submission unless a draft was explicitly selected.
  const candidate = selectedDraftId ? getSubmissionById(selectedDraftId) : null;
  const existing = candidate && candidate.status === STATUSES.DRAFT ? candidate : null;
  const [currentDraftId, setCurrentDraftId] = useState(existing?.id || null);
  const [postOffice, setPostOffice] = useState(existing?.postOffice || '');
  const [reportingPeriod, setReportingPeriod] = useState(existing?.reportingPeriod || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing) {
      setCurrentDraftId(existing.id);
      setPostOffice(existing.postOffice || '');
      setReportingPeriod(existing.reportingPeriod || '');
    }
  }, [existing]);

  const validate = () => {
    const errs = {};
    if (!postOffice) errs.postOffice = 'Please select a Post Office — this field cannot be empty.';
    if (!reportingPeriod) errs.reportingPeriod = 'Please select a Reporting Period — this field cannot be empty.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const officeOptions = backendEnabled && operatorOfficeName
    ? POST_OFFICE_RECORDS.filter((office) => office.name === operatorOfficeName)
    : POST_OFFICE_RECORDS;

  const handleSaveDraft = () => {
    // Only update a draft when the operator explicitly opened one or
    // when this page has already created a new draft during this visit.
    let draftId = currentDraftId;
    const savedDraft = draftId ? getSubmissionById(draftId) : null;

    if (savedDraft?.status === STATUSES.DRAFT) {
      updateDraft(draftId, { postOffice, reportingPeriod, operator: operatorName });
    } else {
      draftId = createDraft({ postOffice, reportingPeriod, operator: operatorName });
      setCurrentDraftId(draftId);
    }

    showToast('Draft saved successfully');
  };

  const handleContinue = () => {
    if (!validate()) return;

    let draftId = currentDraftId;
    const savedDraft = draftId ? getSubmissionById(draftId) : null;

    if (savedDraft?.status === STATUSES.DRAFT) {
      updateDraft(draftId, { postOffice, reportingPeriod, operator: operatorName });
    } else {
      draftId = createDraft({ postOffice, reportingPeriod, operator: operatorName });
      setCurrentDraftId(draftId);
    }

    navigate('/operator/building-data', { state: { draftId } });
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">New Submission</h1>
      <Stepper steps={OPERATOR_STEPS} currentStep={0} />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
        <FormField
          label="Post Office"
          help="Select the post office for which you are entering ESG/BRSR data."
          error={errors.postOffice}
          required
        >
          <select
            value={postOffice}
            onChange={(e) => setPostOffice(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
          >
            <option value="">— Select Post Office —</option>
            {officeOptions.map((office) => (
              <option key={office.officeCode || office.name} value={office.name}>{office.name}</option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Reporting Period"
          help="Select the financial year for this report (e.g. FY 2025-26)."
          error={errors.reportingPeriod}
          required
        >
          <select
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
          >
            <option value="">— Select Reporting Period —</option>
            {REPORTING_PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormField>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button variant="secondary" size="lg" icon={Save} onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button variant="primary" size="lg" icon={ArrowRight} onClick={handleContinue}>
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
