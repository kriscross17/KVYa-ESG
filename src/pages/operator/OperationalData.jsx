import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import Button from '../../components/common/Button.jsx';
import OperationalDataForm from '../../components/forms/OperationalDataForm.jsx';
import { OPERATOR_STEPS, EMPTY_OPERATIONAL_DATA } from '../../data/constants.js';

export default function OperationalData() {
  const { getSubmissionById, updateDraft, activeDraftId, setActiveDraftId } = useSubmissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const draftId = location.state?.draftId || activeDraftId;
  const draft = draftId ? getSubmissionById(draftId) : null;

  const [data, setData] = useState(draft?.operationalData || { ...EMPTY_OPERATIONAL_DATA });
  const [ocrScans, setOcrScans] = useState(draft?.ocr?.scans || []);

  useEffect(() => {
    if (draftId && draftId !== activeDraftId) {
      setActiveDraftId(draftId);
    }
  }, [draftId, activeDraftId, setActiveDraftId]);

  useEffect(() => {
    if (!draftId || !draft || draft.status !== 'Draft') {
      navigate('/operator/new', { replace: true });
      return;
    }
    if (draft?.operationalData) setData(draft.operationalData);
    if (draft?.ocr?.scans) setOcrScans(draft.ocr.scans);
  }, [draftId, draft, navigate]);

  const handleSaveDraft = () => {
    updateDraft(draftId, { operationalData: data, ocr: { scans: ocrScans } });
    showToast('Draft saved successfully');
  };

  const handleContinue = () => {
    updateDraft(draftId, { operationalData: data, ocr: { scans: ocrScans } });
    navigate('/operator/review', { state: { draftId } });
  };

  if (!draftId) return null;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Operational / Digital Data</h1>
      <Stepper steps={OPERATOR_STEPS} currentStep={2} />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
        <OperationalDataForm data={data} onChange={setData} submissionId={draftId} onOcrScan={(scan) => setOcrScans((prev) => [...prev, scan])} />

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => navigate('/operator/building-data', { state: { draftId } })}>
            Back
          </Button>
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
