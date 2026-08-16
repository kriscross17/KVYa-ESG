import { useMemo } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { useSubmissions } from '../../context/SubmissionContext.jsx';
import { STATUSES } from '../../data/constants.js';
import { calculateESGScore } from '../../utils/esg.js';

function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export default function Reports() {
  const { submissions } = useSubmissions();
  const approved = submissions.filter((s) => s.status === STATUSES.APPROVED);

  const report = useMemo(() => {
    const totalElectricity = approved.reduce((sum, s) => sum + (Number(s.buildingData?.electricityConsumptionKwh) || 0), 0);
    const totalRenewable = approved.reduce((sum, s) => sum + (Number(s.buildingData?.renewableEnergyKwh) || 0), 0);
    const totalEmployees = approved.reduce((sum, s) => sum + (Number(s.operationalData?.totalEmployees) || 0), 0);
    const totalFemale = approved.reduce((sum, s) => sum + (Number(s.operationalData?.femaleEmployees) || 0), 0);
    const scores = approved.map(calculateESGScore);
    const avg = (key) => scores.length ? scores.reduce((sum, score) => sum + score[key], 0) / scores.length : 0;
    return {
      offices: new Set(approved.map((s) => s.postOffice)).size,
      submissions: approved.length,
      totalElectricity,
      totalRenewable,
      renewablePercent: totalElectricity ? (totalRenewable / totalElectricity) * 100 : 0,
      totalWater: approved.reduce((sum, s) => sum + (Number(s.buildingData?.waterUsageKl) || 0), 0),
      totalWaste: approved.reduce((sum, s) => sum + (Number(s.buildingData?.wasteGeneratedKg) || 0), 0),
      totalEmployees,
      totalFemale,
      femalePercent: totalEmployees ? (totalFemale / totalEmployees) * 100 : 0,
      training: approved.reduce((sum, s) => sum + (Number(s.operationalData?.trainingHoursPerEmployee) || 0), 0),
      community: approved.reduce((sum, s) => sum + (Number(s.operationalData?.communityProgramsCount) || 0), 0),
      avgDigital: approved.length ? approved.reduce((sum, s) => sum + (Number(s.operationalData?.digitalTransactionsPercent) || 0), 0) / approved.length : 0,
      environmental: avg('environmental'),
      social: avg('social'),
      governance: avg('governance'),
      overall: avg('overall'),
    };
  }, [approved]);

  const reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const reportingPeriods = [...new Set(approved.map((s) => s.reportingPeriod).filter(Boolean))];

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><FileText className="w-6 h-6 text-blue-700" /><h1 className="text-2xl sm:text-3xl font-bold text-slate-900">BRSR Report Generator</h1></div>
          <p className="text-lg text-slate-600 mt-2">Generate a print-ready BRSR data report from approved submissions.</p>
        </div>
        {approved.length > 0 && (
          <button type="button" onClick={printReport} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 shadow-sm"><Download className="w-4 h-4" />Download / Save as PDF</button>
        )}
      </div>

      {approved.length === 0 ? (
        <div className="no-print bg-white rounded-2xl border border-slate-200 p-8 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto" /><p className="text-slate-600 text-lg mt-3">No approved submissions yet. Approve operator submissions to generate the report.</p></div>
      ) : (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm print-report">
          <header className="p-6 sm:p-10 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-5">
              <div><p className="text-sm font-semibold tracking-widest text-blue-700 uppercase">India Post • Sustainability Reporting</p><h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">BRSR Data Report</h2><p className="text-slate-600 mt-2">Business Responsibility & Sustainability Report data summary</p></div>
              <div className="text-sm text-slate-600 sm:text-right"><p><strong>Generated:</strong> {reportDate}</p><p className="mt-1"><strong>Periods:</strong> {reportingPeriods.join(', ') || 'N/A'}</p><p className="mt-1"><strong>Approved records:</strong> {report.submissions}</p></div>
            </div>
            <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Reporting offices</p><p className="text-2xl font-bold mt-1">{report.offices}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Overall readiness</p><p className="text-2xl font-bold mt-1">{formatNumber(report.overall, 0)}%</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Renewable share</p><p className="text-2xl font-bold mt-1">{formatNumber(report.renewablePercent, 1)}%</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Female workforce</p><p className="text-2xl font-bold mt-1">{formatNumber(report.femalePercent, 1)}%</p></div>
            </div>
          </header>

          <section className="p-6 sm:p-10 space-y-8">
            <div><h3 className="text-xl font-bold text-slate-900">1. Environmental Performance</h3><div className="grid sm:grid-cols-2 gap-4 mt-4">{[
              ['Electricity consumption', `${formatNumber(report.totalElectricity)} kWh`], ['Renewable energy used', `${formatNumber(report.totalRenewable)} kWh`], ['Renewable energy share', `${formatNumber(report.renewablePercent, 1)}%`], ['Water consumption', `${formatNumber(report.totalWater)} KL`], ['Waste generated', `${formatNumber(report.totalWaste)} kg`], ['Environmental readiness', `${formatNumber(report.environmental)}%`],
            ].map(([label, value]) => <div key={label} className="border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900 mt-1">{value}</p></div>)}</div></div>

            <div><h3 className="text-xl font-bold text-slate-900">2. Social Performance</h3><div className="grid sm:grid-cols-2 gap-4 mt-4">{[
              ['Total employees', formatNumber(report.totalEmployees)], ['Female employees', `${formatNumber(report.totalFemale)} (${formatNumber(report.femalePercent, 1)}%)`], ['Training hours recorded', formatNumber(report.training)], ['Community programs', formatNumber(report.community)], ['Social readiness', `${formatNumber(report.social)}%`],
            ].map(([label, value]) => <div key={label} className="border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900 mt-1">{value}</p></div>)}</div></div>

            <div><h3 className="text-xl font-bold text-slate-900">3. Governance & Digital Operations</h3><div className="grid sm:grid-cols-2 gap-4 mt-4">{[
              ['Average digital transaction adoption', `${formatNumber(report.avgDigital, 1)}%`], ['Governance readiness', `${formatNumber(report.governance)}%`], ['Overall readiness', `${formatNumber(report.overall)}%`],
            ].map(([label, value]) => <div key={label} className="border border-slate-200 rounded-xl p-4"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900 mt-1">{value}</p></div>)}</div></div>

            <div><h3 className="text-xl font-bold text-slate-900">4. Approved Post Office Register</h3><div className="overflow-x-auto mt-4"><table className="w-full text-sm report-table"><thead className="bg-slate-50"><tr><th className="text-left px-3 py-3">Post Office</th><th className="text-left px-3 py-3">Period</th><th className="text-right px-3 py-3">Electricity</th><th className="text-right px-3 py-3">Renewable %</th><th className="text-right px-3 py-3">Employees</th><th className="text-right px-3 py-3">ESG</th></tr></thead><tbody>{approved.map((s) => { const score = calculateESGScore(s); return <tr key={s.id} className="border-t border-slate-100"><td className="px-3 py-3 font-medium">{s.postOffice}</td><td className="px-3 py-3">{s.reportingPeriod}</td><td className="px-3 py-3 text-right">{formatNumber(s.buildingData?.electricityConsumptionKwh)} kWh</td><td className="px-3 py-3 text-right">{formatNumber(score.renewablePct, 1)}%</td><td className="px-3 py-3 text-right">{formatNumber(s.operationalData?.totalEmployees)}</td><td className="px-3 py-3 text-right font-bold">{score.overall}%</td></tr>; })}</tbody></table></div></div>

            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-sm text-amber-900"><strong>Prototype disclosure:</strong> The ESG readiness score in this prototype is a transparent decision-support indicator. It is not an official SEBI/BRSR compliance score or regulatory filing.</div>
            <div className="no-print flex justify-end"><button type="button" onClick={printReport} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><Printer className="w-4 h-4" /> Print report</button></div>
          </section>
        </article>
      )}
    </div>
  );
}
