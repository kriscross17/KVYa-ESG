import { Link } from 'react-router-dom';
import { FilePlus, List, FileText, ArrowRight } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import HelpCard from '../../components/common/HelpCard.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import { STATUSES } from '../../data/constants.js';

export default function OperatorDashboard() {
  const { submissions, operatorName } = useSubmissions();

  const mySubmissions = submissions.filter(
    (s) => s.operator === operatorName || !operatorName
  );

  const drafts = mySubmissions.filter((s) => s.status === STATUSES.DRAFT);
  const pending = mySubmissions.filter(
    (s) => s.status === STATUSES.PENDING_REVIEW || s.status === STATUSES.SUBMITTED
  );
  const approved = mySubmissions.filter((s) => s.status === STATUSES.APPROVED);
  const returned = mySubmissions.filter(
    (s) => s.status === STATUSES.RETURNED || s.status === STATUSES.REJECTED
  );

  const recent = [...mySubmissions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
        Welcome{operatorName ? `, ${operatorName}` : ''}!
      </h1>
      <p className="text-lg text-slate-600 mb-6">Data Entry Operator Dashboard</p>

      <HelpCard
        items={[
          'Start a new submission by selecting your Post Office and reporting period.',
          'Fill in Building Data and Operational Data — you can scan bills using OCR to save time.',
          'Review all entries on the Review screen, then Submit for manager approval.',
          'Check My Submissions to track status. If returned, edit and resubmit.',
        ]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Drafts', count: drafts.length, color: 'bg-slate-100 text-slate-800' },
          { label: 'Pending Review', count: pending.length, color: 'bg-yellow-100 text-yellow-900' },
          { label: 'Approved', count: approved.length, color: 'bg-green-100 text-green-900' },
          { label: 'Returned/Rejected', count: returned.length, color: 'bg-red-100 text-red-900' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl p-5 ${color}`}>
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-base font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link to="/operator/new">
          <Button variant="primary" size="lg" icon={FilePlus}>
            Start New Submission
          </Button>
        </Link>
        <Link to="/operator/drafts">
          <Button variant="secondary" size="lg" icon={FileText}>
            View My Drafts
          </Button>
        </Link>
        <Link to="/operator/submissions">
          <Button variant="secondary" size="lg" icon={List}>
            My Submissions
          </Button>
        </Link>
      </div>

      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Submissions</h2>
          <div className="space-y-3">
            {recent.map((s) => (
              <Link
                key={s.id}
                to={`/operator/submissions/${s.id}`}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-slate-100"
              >
                <div>
                  <p className="font-semibold text-slate-900">{s.postOffice || 'Untitled'}</p>
                  <p className="text-sm text-slate-500">{s.reportingPeriod}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={s.status} />
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
