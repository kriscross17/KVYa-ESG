import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, FileCheck2, Upload } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Stepper from '../../components/common/Stepper.jsx';
import Button from '../../components/common/Button.jsx';
import BuildingDataForm from '../../components/forms/BuildingDataForm.jsx';
import { OPERATOR_STEPS, EMPTY_BUILDING_DATA } from '../../data/constants.js';
import { backendEnabled, uploadEvidence } from '../../utils/api.js';

export default function BuildingData() {
  const { getSubmissionById, updateDraft, activeDraftId, setActiveDraftId } = useSubmissions();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const draftId = location.state?.draftId || activeDraftId;
  const draft = draftId ? getSubmissionById(draftId) : null;

  const [data, setData] = useState(draft?.buildingData || { ...EMPTY_BUILDING_DATA });
  const [evidence, setEvidence] = useState(draft?.evidence || []);
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
    if (draft?.buildingData) setData(draft.buildingData);
    if (draft?.evidence) setEvidence(draft.evidence);
    if (draft?.ocr?.scans) setOcrScans(draft.ocr.scans);
  }, [draftId, draft, navigate]);

  const handleSaveDraft = () => {
    updateDraft(draftId, { buildingData: data, evidence, ocr: { scans: ocrScans } });
    showToast('Draft saved successfully');
  };

  const handleContinue = () => {
    updateDraft(draftId, { buildingData: data, evidence, ocr: { scans: ocrScans } });
    navigate('/operator/operational-data', { state: { draftId } });
  };

  if (!draftId) return null;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Building / Physical Data</h1>
      <Stepper steps={OPERATOR_STEPS} currentStep={1} />

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-2xl">
        <BuildingDataForm
          data={data}
          onChange={setData}
          submissionId={draftId}
          onOcrScan={(scan) => { setOcrScans((prev) => [...prev, scan]); if (scan.evidence) setEvidence((prev) => [...prev, { ...scan.evidence, name: scan.evidence.filename }]); }}
        />

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-blue-700" /> Evidence</h2>
              <p className="text-sm text-slate-500 mt-1">Attach bills, meter photos, or supporting documents for audit traceability.</p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer font-medium text-slate-700">
              <Upload className="w-4 h-4" /> Add evidence
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => { const file=e.target.files?.[0]; e.target.value=''; if (!file) return; if (backendEnabled && navigator.onLine) { try { const saved=await uploadEvidence({submissionId:draftId,file,category:'building_evidence'}); setEvidence((prev)=>[...prev,{...saved,name:saved.filename}]); showToast('Evidence uploaded successfully'); } catch (error) { showToast(error.message || 'Evidence upload failed','error'); } } else { setEvidence((prev)=>[...prev,{name:file.name,type:file.type || 'document',size:file.size,addedAt:new Date().toISOString(),pendingUpload:true}]); showToast('Evidence metadata was saved locally; upload the file when you are back online','error'); } }} />
            </label>
          </div>
          {evidence.length ? (
            <div className="space-y-2">{evidence.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{item.name}</p><p className="text-xs text-slate-500">{item.type} · {Math.max(1, Math.round((item.size || 0)/1024))} KB</p></div>
                <button type="button" className="text-red-600 text-sm font-medium" onClick={()=>setEvidence((prev)=>prev.filter((_,i)=>i!==index))}>Remove</button>
              </div>
            ))}</div>
          ) : <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">No evidence attached yet. Add the latest bill or meter photo before submission.</p>}
          {ocrScans.length > 0 && <p className="text-xs text-slate-500 mt-3">OCR scans recorded: {ocrScans.length}. These records are for audit traceability.</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => navigate('/operator/new', { state: { draftId } })}>
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
