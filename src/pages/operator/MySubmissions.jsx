import { Link } from 'react-router-dom';
import { List, ArrowRight } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import Badge from '../../components/common/Badge.jsx';

export default function MySubmissions() {
  const { submissions, operatorName } = useSubmissions();

  const list = submissions
    .filter((s) => s.status !== 'Draft')
    .filter((s) => !operatorName || s.operator === operatorName)
    .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">My Submissions</h1>
      <p className="text-lg text-slate-600 mb-6">Track the status of all your submitted reports.</p>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <List className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">No submissions yet. Complete and submit a report to see it here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold text-slate-700">Post Office</th>
                  <th className="text-left px-5 py-4 font-semibold text-slate-700">Period</th>
                  <th className="text-left px-5 py-4 font-semibold text-slate-700">Submitted</th>
                  <th className="text-left px-5 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium">{s.postOffice}</td>
                    <td className="px-5 py-4">{s.reportingPeriod}</td>
                    <td className="px-5 py-4">
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-5 py-4"><Badge status={s.status} /></td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/operator/submissions/${s.id}`}
                        className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
                      >
                        View <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
