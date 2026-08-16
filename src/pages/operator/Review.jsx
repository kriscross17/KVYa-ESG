import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Save, AlertCircle, Leaf, ShieldCheck, Users, FileCheck2 } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Badge from '../../components/common/Badge.jsx';
import {
  OPERATOR_STEPS,
  BUILDING_FIELD_LABELS,
  OPERATIONAL_FIELD_LABELS,
} from '../../data/constants.js';
import { validateSubmissionForSubmit } from '../../utils/validation.js';
import { calculateESGScore } from '../../utils/esg.js';

export default function Review() {
  const { getSubmissionById, updateDraft, submitSubmission, activeDraftId, setActiveDraftId } = useSubmissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const draftId = location.state?.draftId || activeDraftId;
  const draft = draftId ? getSubmissionById(draftId) : null;
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (draftId && draftId !== activeDraftId) {
      setActiveDraftId(draftId);
    }
  }, [draftId, activeDraftId, setActiveDraftId]);

  useEffect(() => {
    if (!draftId || !draft || draft.status !== 'Draft') {
      navigate('/operator/new', { replace: true });
    }
  }, [draftId, navigate]);

  useEffect(() => {
    if (draft) {
      setValidationErrors(validateSubmissionForSubmit(draft));
    }
  }, [draft]);

  if (!draft) return null;

  const handleSaveDraft = () => {
    updateDraft(draft.id, {
      buildingData: draft.buildingData,
      operationalData: draft.operationalData,
      evidence: draft.evidence || [],
      ocr: draft.ocr || { scans: [] },
    });
    showToast('Draft saved successfully');
  };

  const handleSubmitClick = () => {
    const errors = validateSubmissionForSubmit(draft);
    setValidationErrors(errors);
    if (errors.length > 0) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    submitSubmission(draft.id);
    setShowConfirm(false);
    showToast('Submission sent for review successfully');
    navigate(`/operator/submissions/${draft.id}`);
  };

  const isValid = validationErrors.length === 0;
  const esg = calculateESGScore(draft);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Review & Submit</h1>
      <Stepper steps={OPERATOR_STEPS} currentStep={3} />

      {!isValid && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-900">Validation Summary</h2>
          </div>
          <p className="text-red-800 mb-3">Please fix the following before submitting:</p>
          <ul className="space-y-2">
            {validationErrors.map((err, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => navigate(err.path)}
                  className="text-red-700 hover:underline text-left font-medium"
                >
                  → {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300 uppercase tracking-wide font-semibold">Demo ESG readiness</p>
            <div className="flex items-end gap-2 mt-1"><span className="text-4xl font-bold">{esg.overall}</span><span className="text-slate-300 mb-1">/ 100</span></div>
            <p className="text-xs text-slate-400 mt-2">Decision-support indicator for this prototype — not an official BRSR compliance score.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-2/3">
            {[['Environmental', esg.environmental, Leaf], ['Social', esg.social, Users], ['Governance', esg.governance, ShieldCheck]].map(([label,value,Icon]) => (
              <div key={label} className="bg-white/10 rounded-xl p-3"><Icon className="w-4 h-4 mb-2" /><p className="text-xs text-slate-300">{label}</p><p className="text-xl font-bold">{value}%</p></div>
            ))}
          </div>
        </div>
        {esg.risks.length > 0 && <div className="mt-4 pt-4 border-t border-white/10"><p className="text-sm font-semibold text-amber-300 mb-2">{esg.risks.length} risk signal(s) detected</p><div className="grid sm:grid-cols-2 gap-2">{esg.risks.slice(0,4).map((risk,i)=><div key={i} className="text-xs text-slate-200 bg-white/5 rounded-lg p-2">{risk.severity.toUpperCase()} · {risk.message}</div>)}</div></div>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-blue-700" /> Evidence & audit trace</h2>
        <p className="text-sm text-slate-500 mt-1">Supporting documents are linked to the submission record for manager verification.</p>
        {draft.evidence?.length ? <div className="mt-4 grid sm:grid-cols-2 gap-3">{draft.evidence.map((item,i)=><div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200"><p className="font-medium truncate">{item.name}</p><p className="text-xs text-slate-500 mt-1">{item.type || 'document'}</p></div>)}</div> : <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">No supporting evidence attached. Consider adding the latest electricity/water bill or meter photo.</div>}
        {draft.ocr?.scans?.length > 0 && <p className="text-xs text-slate-500 mt-3">{draft.ocr.scans.length} OCR scan record(s) captured with confidence metadata.</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Submission Details</h2>
          <dl className="space-y-2 text-base">
            <div className="flex justify-between"><dt className="text-slate-600">Post Office</dt><dd className="font-medium">{draft.postOffice || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Period</dt><dd className="font-medium">{draft.reportingPeriod || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Operator</dt><dd className="font-medium">{draft.operator || '—'}</dd></div>
            <div className="flex justify-between items-center"><dt className="text-slate-600">Status</dt><dd><Badge status={draft.status} /></dd></div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Building Data</h2>
          <dl className="space-y-2 text-base">
            {Object.entries(BUILDING_FIELD_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="text-slate-600 shrink-0">{label}</dt>
                <dd className="font-medium text-right">{draft.buildingData[key] !== '' && draft.buildingData[key] != null ? draft.buildingData[key] : '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Operational Data</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-base">
            {Object.entries(OPERATIONAL_FIELD_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="text-slate-600 shrink-0">{label}</dt>
                <dd className="font-medium text-right">{draft.operationalData[key] !== '' && draft.operationalData[key] != null ? draft.operationalData[key] : '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => navigate('/operator/operational-data', { state: { draftId } })}>
          Back
        </Button>
        <Button variant="secondary" size="lg" icon={Save} onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button
          variant="success"
          size="lg"
          icon={Send}
          onClick={handleSubmitClick}
          disabled={!isValid}
        >
          Submit for Review
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Submit for Review?"
        message={`You are about to submit data for ${draft.postOffice}, ${draft.reportingPeriod}.\n\nYou cannot edit after submitting unless it is returned by the manager.\n\nContinue?`}
        confirmLabel="Yes, Submit"
        cancelLabel="Go Back"
        variant="success"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
