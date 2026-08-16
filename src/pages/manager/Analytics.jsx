import { useSubmissions } from '../../context/SubmissionContext.jsx';
import {
  EnergyConsumptionChart,
  WaterWasteChart,
  GenderDiversityChart,
  DigitalAdoptionChart,
  StatusDistributionChart,
} from '../../components/charts/ESGCharts.jsx';
import { STATUSES } from '../../data/constants.js';

export default function Analytics() {
  const { submissions } = useSubmissions();
  const approved = submissions.filter((s) => s.status === STATUSES.APPROVED);

  const totals = {
    electricity: approved.reduce((s, x) => s + (Number(x.buildingData.electricityConsumptionKwh) || 0), 0),
    renewable: approved.reduce((s, x) => s + (Number(x.buildingData.renewableEnergyKwh) || 0), 0),
    water: approved.reduce((s, x) => s + (Number(x.buildingData.waterUsageKl) || 0), 0),
    waste: approved.reduce((s, x) => s + (Number(x.buildingData.wasteGeneratedKg) || 0), 0),
    employees: approved.reduce((s, x) => s + (Number(x.operationalData.totalEmployees) || 0), 0),
    female: approved.reduce((s, x) => s + (Number(x.operationalData.femaleEmployees) || 0), 0),
  };

  const avgDigital = approved.length
    ? (approved.reduce((s, x) => s + (Number(x.operationalData.digitalTransactionsPercent) || 0), 0) / approved.length).toFixed(1)
    : 0;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">ESG Analytics</h1>
      <p className="text-lg text-slate-600 mb-6">
        All metrics calculated from {approved.length} approved submission(s) — no hardcoded data.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Electricity', value: `${totals.electricity.toLocaleString('en-IN')} kWh` },
          { label: 'Renewable Energy', value: `${totals.renewable.toLocaleString('en-IN')} kWh` },
          { label: 'Total Water Used', value: `${totals.water.toLocaleString('en-IN')} KL` },
          { label: 'Avg Digital Adoption', value: `${avgDigital}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-slate-600 text-sm">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {[
          { title: 'Energy Consumption by Post Office', Chart: EnergyConsumptionChart },
          { title: 'Water & Waste by Post Office', Chart: WaterWasteChart },
          { title: 'Gender Diversity (All Approved)', Chart: GenderDiversityChart },
          { title: 'Digital Adoption by Post Office', Chart: DigitalAdoptionChart },
          { title: 'Submission Status Distribution', Chart: StatusDistributionChart },
        ].map(({ title, Chart }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
            <Chart submissions={submissions} />
          </div>
        ))}
      </div>
    </div>
  );
}
