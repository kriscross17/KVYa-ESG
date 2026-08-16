import { Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import { STATUSES } from '../../data/constants.js';

function getResumePath(draft) {
  if (!draft.postOffice || !draft.reportingPeriod) return '/operator/new';
  const bd = draft.buildingData;
  if (!bd?.buildingType || bd.electricityConsumptionKwh === '' || bd.electricityConsumptionKwh === null || bd.electricityConsumptionKwh === undefined) return '/operator/building-data';
  const od = draft.operationalData;
  if (od?.totalEmployees === '' || od?.totalEmployees === null || od?.totalEmployees === undefined) return '/operator/operational-data';
  return '/operator/review';
}

export default function MyDrafts() {
  const { submissions, setActiveDraftId, operatorName } = useSubmissions();
  const navigate = useNavigate();

  const drafts = submissions
    .filter((s) => s.status === STATUSES.DRAFT)
    .filter((s) => !operatorName || s.operator === operatorName)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const resumeDraft = (draft) => {
    setActiveDraftId(draft.id);
    const path = getResumePath(draft);
    navigate(path, { state: { draftId: draft.id } });
  };

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">My Drafts</h1>
      <p className="text-lg text-slate-600 mb-6">Incomplete submissions saved as drafts.</p>

      {drafts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg mb-4">You have no saved drafts.</p>
          <Link to="/operator/new">
            <Button variant="primary" size="lg">Start New Submission</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-900 text-lg">{s.postOffice || 'Untitled Draft'}</p>
                <p className="text-slate-600">{s.reportingPeriod || 'No period selected'}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Last saved: {new Date(s.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={s.status} />
                <Button variant="primary" icon={ArrowRight} onClick={() => resumeDraft(s)}>
                  Continue Editing
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
