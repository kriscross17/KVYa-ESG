import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Gauge,
  Leaf,
  ShieldCheck,
  Users,
  Database,
} from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import HelpCard from '../../components/common/HelpCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import { STATUSES } from '../../data/constants.js';
import { isPendingReview } from '../../utils/validation.js';
import { calculateESGScore, getNetworkMetrics } from '../../utils/esg.js';
import IndiaCoverageMap from '../../components/charts/IndiaCoverageMap.jsx';
import { backendEnabled, getOffices } from '../../utils/api.js';
import { POST_OFFICE_RECORDS } from '../../data/constants.js';

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const { submissions, loadDemoData } = useSubmissions();
  const [offices, setOffices] = useState(POST_OFFICE_RECORDS);

  useEffect(() => {
    if (!backendEnabled) return;
    let active = true;
    getOffices().then((rows) => { if (active && Array.isArray(rows) && rows.length) setOffices(rows); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const metrics = getNetworkMetrics(submissions);
  const pending = submissions.filter((s) => isPendingReview(s.status));
  const approved = submissions.filter((s) => s.status === STATUSES.APPROVED);
  const returned = submissions.filter((s) => s.status === STATUSES.RETURNED || s.status === STATUSES.REJECTED);

  const highRisk = approved
    .map((s) => ({ submission: s, score: calculateESGScore(s) }))
    .filter(({ score }) => score.overall < 60 || score.risks.some((r) => r.severity === 'high'))
    .sort((a, b) => a.score.overall - b.score.overall)
    .slice(0, 5);

  const recentPending = [...pending]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">India Post • HQ</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">National ESG Command Center</h1>
          <p className="text-lg text-slate-600 mt-2">A single view of reporting coverage, ESG performance and submissions that need attention.</p>
        </div>
        {!backendEnabled && <button
          type="button"
          onClick={loadDemoData}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors shadow-sm"
        >
          <Database className="w-4 h-4" />
          Load Demo Network
        </button>}
      </div>

      {submissions.some((s) => s.demoData) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Demo network loaded</p>
            <p className="text-sm text-blue-800 mt-1">These are synthetic demonstration records. Replace them with a current, verified Department of Posts data source before production use.</p>
          </div>
        </div>
      )}

      <HelpCard
        items={[
          'Review pending submissions before they enter the approved dataset.',
          'Use the ESG readiness score as a transparent demo decision-support indicator — it is not an official BRSR compliance score.',
          'Investigate high-risk offices before approving or publishing their data.',
          'Use Analytics and Reports for network-level trends and BRSR summaries.',
        ]}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Reporting Offices', value: metrics.reportingOffices, icon: FileText, href: '/manager/submissions' },
          { label: 'Pending Review', value: pending.length, icon: Clock, href: '/manager/pending' },
          { label: 'Approved', value: approved.length, icon: CheckCircle, href: '/manager/approved' },
          { label: 'High-Risk Offices', value: metrics.highRisk, icon: AlertTriangle, href: '/manager/analytics' },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} to={href} className="bg-white rounded-2xl border border-slate-200 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
            <Icon className="w-6 h-6 text-slate-500 mb-3" />
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <IndiaCoverageMap submissions={submissions} offices={offices} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-700" />
                <h2 className="text-xl font-bold text-slate-900">Network ESG Readiness</h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">Average across approved submissions</p>
            </div>
            <span className="text-4xl font-black text-blue-700">{metrics.averageOverall}</span>
          </div>
          <div className="space-y-5">
            <ScoreBar label="Environmental" value={metrics.averageEnvironmental} />
            <ScoreBar label="Social" value={metrics.averageSocial} />
            <ScoreBar label="Governance" value={metrics.averageGovernance} />
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-6">
          <p className="text-sm font-semibold text-slate-300">Why this matters</p>
          <h2 className="text-xl font-bold mt-2">From data collection to action</h2>
          <p className="text-slate-300 mt-3 leading-relaxed">The platform turns scattered post-office reports into comparable indicators, flags anomalies and gives managers a clear queue of actions.</p>
          <Link to="/manager/analytics" className="inline-flex items-center gap-2 mt-5 font-semibold hover:underline">Open analytics <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>

      {highRisk.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /><h2 className="text-xl font-bold text-slate-900">High-Risk Offices</h2></div>
              <p className="text-sm text-slate-500 mt-1">Prioritize these approved records for follow-up.</p>
            </div>
            <Link to="/manager/analytics" className="text-sm font-semibold text-blue-700">View all</Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {highRisk.map(({ submission, score }) => (
              <Link key={submission.id} to={`/manager/submissions/${submission.id}`} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50">
                <div className="flex justify-between gap-3">
                  <div><p className="font-semibold text-slate-900">{submission.postOffice}</p><p className="text-xs text-slate-500 mt-1">{submission.reportingPeriod}</p></div>
                  <span className="font-bold text-amber-700">{score.overall}</span>
                </div>
                <p className="text-sm text-slate-600 mt-3">{score.risks[0]?.message || 'Low overall readiness score.'}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-slate-500" /><h2 className="text-xl font-bold text-slate-900">Action Queue</h2></div>
          {recentPending.length === 0 ? <p className="text-slate-500">No submissions are waiting for review.</p> : <div className="space-y-3">
            {recentPending.map((s) => <Link key={s.id} to={`/manager/submissions/${s.id}`} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50"><div><p className="font-semibold">{s.postOffice}</p><p className="text-sm text-slate-500">{s.reportingPeriod} · {s.operator}</p></div><div className="flex items-center gap-3"><Badge status={s.status} /><ArrowRight className="w-4 h-4 text-slate-400" /></div></Link>)}
          </div>}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-5 h-5 text-slate-500" /><h2 className="text-xl font-bold text-slate-900">Network Snapshot</h2></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl"><Leaf className="w-5 h-5 text-green-600" /><p className="text-2xl font-bold mt-2">{metrics.averageEnvironmental}%</p><p className="text-sm text-slate-600">Environmental</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /><p className="text-2xl font-bold mt-2">{metrics.averageSocial}%</p><p className="text-sm text-slate-600">Social</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><ShieldCheck className="w-5 h-5 text-violet-600" /><p className="text-2xl font-bold mt-2">{metrics.averageGovernance}%</p><p className="text-sm text-slate-600">Governance</p></div>
            <div className="p-4 bg-slate-50 rounded-xl"><FileText className="w-5 h-5 text-slate-600" /><p className="text-2xl font-bold mt-2">{returned.length}</p><p className="text-sm text-slate-600">Returned / rejected</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
