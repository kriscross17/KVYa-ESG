import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import Badge from '../../components/common/Badge.jsx';
import { POST_OFFICES, REPORTING_PERIODS, STATUSES } from '../../data/constants.js';

export default function SubmissionsList({ filterStatus = null, title = 'All Submissions', subtitle = 'View and filter all ESG/BRSR submissions.' }) {
  const { submissions } = useSubmissions();
  const [postOfficeFilter, setPostOfficeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(filterStatus || '');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return submissions
      .filter((s) => {
        if (filterStatus === 'pending') {
          return s.status === STATUSES.PENDING_REVIEW || s.status === STATUSES.SUBMITTED;
        }
        if (filterStatus === 'approved') return s.status === STATUSES.APPROVED;
        if (filterStatus === 'returned') {
          return s.status === STATUSES.RETURNED || s.status === STATUSES.REJECTED;
        }
        return true;
      })
      .filter((s) => !postOfficeFilter || s.postOffice === postOfficeFilter)
      .filter((s) => !periodFilter || s.reportingPeriod === periodFilter)
      .filter((s) => !statusFilter || s.status === statusFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.postOffice?.toLowerCase().includes(q) ||
          s.operator?.toLowerCase().includes(q) ||
          s.reportingPeriod?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
  }, [submissions, postOfficeFilter, periodFilter, statusFilter, search, filterStatus]);

  const allStatuses = Object.values(STATUSES);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-lg text-slate-600 mb-6">{subtitle}</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Post Office</label>
            <select
              value={postOfficeFilter}
              onChange={(e) => setPostOfficeFilter(e.target.value)}
              className="w-full px-3 py-2 text-base border-2 border-slate-300 rounded-xl"
            >
              <option value="">All Post Offices</option>
              {POST_OFFICES.map((po) => (
                <option key={po} value={po}>{po}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-3 py-2 text-base border-2 border-slate-300 rounded-xl"
            >
              <option value="">All Periods</option>
              {REPORTING_PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {!filterStatus && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-base border-2 border-slate-300 rounded-xl"
              >
                <option value="">All Statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-base border-2 border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-slate-600 mb-4">{filtered.length} submission(s) found</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600 text-lg">No submissions match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Post Office</th>
                  <th className="text-left px-5 py-4 font-semibold">Period</th>
                  <th className="text-left px-5 py-4 font-semibold">Operator</th>
                  <th className="text-left px-5 py-4 font-semibold">Date</th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium">{s.postOffice || '—'}</td>
                    <td className="px-5 py-4">{s.reportingPeriod || '—'}</td>
                    <td className="px-5 py-4">{s.operator || '—'}</td>
                    <td className="px-5 py-4">
                      {(s.submittedAt || s.createdAt)
                        ? new Date(s.submittedAt || s.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td className="px-5 py-4"><Badge status={s.status} /></td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/manager/submissions/${s.id}`}
                        className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
                      >
                        Review <ArrowRight className="w-4 h-4" />
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
