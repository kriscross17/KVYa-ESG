import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import BuildingDataForm from '../../components/forms/BuildingDataForm.jsx';
import OperationalDataForm from '../../components/forms/OperationalDataForm.jsx';
import {
  BUILDING_FIELD_LABELS,
  OPERATIONAL_FIELD_LABELS,
  STATUSES,
} from '../../data/constants.js';
import { validateSubmissionForSubmit } from '../../utils/validation.js';

export default function OperatorSubmissionDetail() {
  const { id } = useParams();
  const { getSubmissionById, setActiveDraftId, updateDraft, resubmit } = useSubmissions();
  const { showToast } = useToast();
  const submission = getSubmissionById(id);
  const [editing, setEditing] = useState(false);
  const [buildingData, setBuildingData] = useState({});
  const [operationalData, setOperationalData] = useState({});
  const [ocrScans, setOcrScans] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (submission) {
      setBuildingData(submission.buildingData);
      setOperationalData(submission.operationalData);
      setOcrScans(submission.ocr?.scans || []);
      if (submission.status === STATUSES.RETURNED) {
        setEditing(true);
        setActiveDraftId(submission.id);
      }
    }
  }, [submission, setActiveDraftId]);

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-600 mb-4">Submission not found.</p>
        <Link to="/operator/submissions">
          <Button variant="secondary" icon={ArrowLeft}>Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const handleResubmit = () => {
    const updated = {
      ...submission,
      buildingData,
      operationalData,
    };
    const errors = validateSubmissionForSubmit(updated);
    setValidationErrors(errors);
    if (errors.length > 0) {
      showToast('Please fix all errors before resubmitting', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const confirmResubmit = () => {
    updateDraft(submission.id, {
      buildingData,
      operationalData,
      ocr: { scans: ocrScans },
    });
    resubmit(submission.id);
    setShowConfirm(false);
    setEditing(false);
    showToast('Submission resubmitted successfully');
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/operator/submissions">
          <Button variant="ghost" icon={ArrowLeft}>Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{submission.postOffice}</h1>
          <p className="text-slate-600">{submission.reportingPeriod}</p>
        </div>
        <div className="ml-auto"><Badge status={submission.status} /></div>
      </div>

      {submission.managerComment && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-red-900 mb-2">Manager Comment</h2>
          <p className="text-red-800">{submission.managerComment}</p>
        </div>
      )}

      {editing && submission.status === STATUSES.RETURNED ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Edit Building Data</h2>
            <BuildingDataForm
              data={buildingData}
              onChange={setBuildingData}
              onOcrScan={(scan) => setOcrScans((prev) => [...prev, scan])}
            />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Edit Operational Data</h2>
            <OperationalDataForm
              data={operationalData}
              onChange={setOperationalData}
              onOcrScan={(scan) => setOcrScans((prev) => [...prev, scan])}
            />
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <ul className="space-y-1">
                {validationErrors.map((e, i) => (
                  <li key={i} className="text-red-700">{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          <Button variant="success" size="lg" icon={Send} onClick={handleResubmit}>
            Resubmit for Review
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Building Data</h2>
            <dl className="space-y-2">
              {Object.entries(BUILDING_FIELD_LABELS).map(([key, label]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-medium">{submission.buildingData[key] ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Operational Data</h2>
            <dl className="space-y-2">
              {Object.entries(OPERATIONAL_FIELD_LABELS).map(([key, label]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-slate-600">{label}</dt>
                  <dd className="font-medium">{submission.operationalData[key] ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {submission.history?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
              <h2 className="text-lg font-bold mb-4">Status History</h2>
              <div className="space-y-3">
                {submission.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <Badge status={h.status} />
                    <div>
                      <p className="text-slate-600">{new Date(h.timestamp).toLocaleString('en-IN')}</p>
                      {h.comment && <p className="text-slate-800 mt-1">{h.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Resubmit for Review?"
        message={`You are about to resubmit corrected data for ${submission.postOffice}, ${submission.reportingPeriod}.\n\nContinue?`}
        confirmLabel="Yes, Resubmit"
        cancelLabel="Go Back"
        variant="success"
        onConfirm={confirmResubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
