import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import FormField from '../../components/common/FormField.jsx';
import {
  BUILDING_FIELD_LABELS,
  OPERATIONAL_FIELD_LABELS,
} from '../../data/constants.js';
import { isPendingReview, validateManagerComment } from '../../utils/validation.js';
import { calculateESGScore } from '../../utils/esg.js';

export default function ManagerSubmissionDetail() {
  const { id } = useParams();
  const { getSubmissionById, approveSubmission, rejectSubmission, returnForCorrection } = useSubmissions();
  const { showToast } = useToast();
  const submission = getSubmissionById(id);

  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-slate-600 mb-4">Submission not found.</p>
        <Link to="/manager/submissions">
          <Button variant="secondary" icon={ArrowLeft}>Back to Submissions</Button>
        </Link>
      </div>
    );
  }

  const canReview = isPendingReview(submission.status);
  const esg = calculateESGScore(submission);

  const handleAction = (action) => {
    if (action === 'approve') {
      setConfirmAction('approve');
      return;
    }
    const err = validateManagerComment(comment);
    if (err) {
      setCommentError(err);
      return;
    }
    setCommentError('');
    setConfirmAction(action);
  };

  const executeAction = () => {
    switch (confirmAction) {
      case 'approve':
        approveSubmission(submission.id);
        showToast('Submission approved successfully');
        break;
      case 'reject':
        rejectSubmission(submission.id, comment.trim());
        showToast('Submission rejected');
        break;
      case 'return':
        returnForCorrection(submission.id, comment.trim());
        showToast('Submission returned for correction');
        break;
      default:
        break;
    }
    setConfirmAction(null);
    setComment('');
  };

  const confirmMessages = {
    approve: `You are about to APPROVE the submission for ${submission.postOffice}, ${submission.reportingPeriod}.\n\nThis will mark the submission as accepted in this prototype's internal review workflow.\n\nContinue?`,
    reject: `You are about to REJECT the submission for ${submission.postOffice}, ${submission.reportingPeriod}.\n\nComment: "${comment.trim()}"\n\nContinue?`,
    return: `You are about to RETURN this submission for correction.\n\nPost Office: ${submission.postOffice}\nComment: "${comment.trim()}"\n\nThe operator will be able to edit and resubmit.\n\nContinue?`,
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link to="/manager/submissions">
          <Button variant="ghost" icon={ArrowLeft}>Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{submission.postOffice}</h1>
          <p className="text-slate-600">{submission.reportingPeriod} · Operator: {submission.operator}</p>
        </div>
        <div className="ml-auto"><Badge status={submission.status} /></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Building / Physical Data</h2>
          <dl className="space-y-3 text-base">
            {Object.entries(BUILDING_FIELD_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-600">{label}</dt>
                <dd className="font-semibold text-slate-900">{submission.buildingData[key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Operational / Digital Data</h2>
          <dl className="space-y-3 text-base">
            {Object.entries(OPERATIONAL_FIELD_LABELS).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-600">{label}</dt>
                <dd className="font-semibold text-slate-900">{submission.operationalData[key] ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 text-white rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300 uppercase tracking-wide font-semibold">Demo ESG readiness</p>
              <p className="text-4xl font-black mt-1">{esg.overall}<span className="text-lg font-medium text-slate-400"> / 100</span></p>
            </div>
            <ShieldCheck className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400 mt-3">Prototype decision-support indicator — not an official BRSR compliance score.</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[['Environmental', esg.environmental], ['Social', esg.social], ['Governance', esg.governance]].map(([label, value]) => (
              <div key={label} className="bg-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-300">{label}</p>
                <p className="text-lg font-bold mt-1">{value}%</p>
              </div>
            ))}
          </div>
          {esg.risks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm font-semibold text-amber-300 mb-2">Risk signals</p>
              <ul className="space-y-1 text-sm text-slate-200">
                {esg.risks.slice(0, 4).map((risk, i) => <li key={i}>• {risk.message}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">Evidence & OCR Audit Trace</h2>
          <p className="text-sm text-slate-500 mt-1">Supporting records linked to this submission.</p>
          {submission.evidence?.length ? (
            <div className="mt-4 space-y-2">
              {submission.evidence.map((item, i) => (
                <div key={`${item.name}-${i}`} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.category || item.type || 'Document'}
                    {item.size ? ` · ${Math.max(1, Math.round(item.size / 1024))} KB` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">No supporting evidence attached.</p>
          )}
          {submission.ocr?.scans?.length ? (
            <p className="mt-3 text-xs text-slate-500">
              {submission.ocr.scans.length} OCR scan record(s) captured.{' '}
              {submission.ocr.scans.map((scan) => `${scan.fileName} (${scan.confidence ?? '—'}%)`).join(' • ')}
            </p>
          ) : null}
        </div>
      </div>

      {submission.history?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Audit Trail</h2>
          <div className="space-y-3">
            {submission.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge status={h.status} />
                <div>
                  <p className="text-sm text-slate-600">{new Date(h.timestamp).toLocaleString('en-IN')}</p>
                  {h.comment && <p className="text-slate-800 mt-1">{h.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canReview && (
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Review Actions</h2>

          <FormField
            label="Comment (required for Reject / Return)"
            help="Explain what needs to be corrected or why you are rejecting. Minimum 10 characters."
            error={commentError}
          >
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setCommentError(''); }}
              rows={4}
              className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none"
              placeholder="Enter your comment here..."
            />
          </FormField>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="success" size="lg" icon={CheckCircle} onClick={() => handleAction('approve')}>
              Approve Submission
            </Button>
            <Button variant="secondary" size="lg" icon={RotateCcw} onClick={() => handleAction('return')}>
              Return for Correction
            </Button>
            <Button variant="danger" size="lg" icon={XCircle} onClick={() => handleAction('reject')}>
              Reject Submission
            </Button>
          </div>
        </div>
      )}

      {submission.managerComment && !canReview && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-2">Previous Manager Comment</h2>
          <p className="text-slate-700">{submission.managerComment}</p>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction === 'approve' ? 'Approve Submission?' :
          confirmAction === 'reject' ? 'Reject Submission?' :
          'Return for Correction?'
        }
        message={confirmMessages[confirmAction] || ''}
        confirmLabel="Yes, Continue"
        cancelLabel="Go Back"
        variant={confirmAction === 'approve' ? 'success' : confirmAction === 'reject' ? 'danger' : 'primary'}
        onConfirm={executeAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
