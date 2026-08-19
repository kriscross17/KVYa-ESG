import { useMemo, useState } from 'react';
import { Activity, MapPin, X } from 'lucide-react';
import { POST_OFFICE_RECORDS, STATUSES } from '../../data/constants.js';
import { backendEnabled } from '../../utils/api.js';

const INDIA_BOUNDS = { minLat: 6, maxLat: 38, minLon: 68, maxLon: 98 };

// India's national boundary, plotted in the same 0-100 lat/lon-mapped
// coordinate space used for the state markers below. Derived from real
// boundary coordinates (OpenStreetMap/DataMeet admin_level=2 polygon),
// simplified with Douglas-Peucker and reprojected through the same
// toMapPosition math used for markers, so it lines up with them exactly.
const INDIA_OUTLINE =
  'M24.0,81.23 L18.18,68.58 L15.97,59.56 L16.12,51.04 L15.01,50.14 L15.27,49.37 L15.86,49.46 ' +
  'L16.03,49.23 L16.26,49.3 L16.37,49.24 L16.39,49.13 L14.95,49.38 L14.98,49.22 L14.9,49.25 ' +
  'L14.78,49.06 L14.63,49.03 L14.71,48.88 L14.65,48.8 L14.54,48.82 L13.71,52.51 L11.46,53.54 ' +
  'L9.41,54.09 L8.13,53.59 L7.0,52.8 L3.12,49.04 L7.21,48.28 L8.31,46.64 L4.9,47.58 L1.61,45.16 ' +
  'L2.58,42.83 L10.42,42.52 L8.89,38.45 L6.99,37.67 L7.23,35.78 L5.03,35.16 L5.26,33.86 ' +
  'L7.89,31.22 L9.61,32.19 L12.99,31.38 L22.28,21.65 L22.0,19.11 L24.54,18.02 L20.05,15.01 ' +
  'L20.88,12.58 L19.61,12.34 L19.87,10.32 L25.83,10.89 L33.68,7.86 L34.16,10.33 L36.63,11.51 ' +
  'L35.77,13.7 L38.55,16.65 L36.59,17.68 L34.71,17.01 L35.72,20.36 L43.4,24.21 L41.23,25.78 ' +
  'L40.26,28.67 L49.12,32.8 L55.41,33.32 L59.51,35.72 L66.78,36.36 L67.08,31.41 L68.74,30.84 ' +
  'L70.44,34.97 L80.18,34.85 L80.4,33.48 L78.48,31.7 L81.87,31.81 L88.76,27.04 L91.49,28.01 ' +
  'L93.62,26.68 L94.64,27.32 L93.89,28.42 L95.08,27.88 L95.39,28.82 L94.21,29.96 L98.0,30.62 ' +
  'L96.33,32.43 L97.15,34.05 L94.11,33.48 L90.52,35.56 L87.2,44.21 L84.49,43.4 L83.04,50.17 ' +
  'L82.03,50.07 L80.92,44.62 L78.73,47.05 L77.22,44.99 L81.44,40.53 L72.78,39.7 L72.27,36.76 ' +
  'L71.17,37.47 L68.0,35.54 L67.06,38.14 L70.04,39.71 L66.7,41.67 L69.12,42.9 L69.59,48.89 ' +
  'L67.55,50.84 L67.34,49.48 L66.62,49.23 L66.49,48.73 L66.28,48.62 L66.47,49.19 L67.29,49.7 ' +
  'L66.01,50.93 L63.04,52.06 L62.52,54.33 L63.48,54.03 L61.21,56.39 L55.74,58.94 L55.82,59.22 ' +
  'L53.75,61.53 L47.89,65.26 L47.7,66.98 L40.9,69.77 L41.05,76.77 L40.49,75.86 L40.17,76.29 ' +
  'L41.1,76.98 L41.06,76.8 L41.09,76.74 L41.16,77.21 L40.52,79.79 L40.06,80.19 L40.21,80.15 ' +
  'L39.82,80.56 L40.02,80.45 L39.41,81.62 L39.34,81.61 L39.3,81.63 L39.61,86.56 L37.62,86.71 ' +
  'L36.33,89.1 L37.3,89.74 L34.2,90.57 L32.49,93.2 L31.05,93.37 L28.49,90.93 L26.19,83.94 Z';

function toMapPosition(latitude, longitude) {
  const x = ((longitude - INDIA_BOUNDS.minLon) / (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon)) * 100;
  const y = 100 - ((latitude - INDIA_BOUNDS.minLat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * 100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(94, Math.max(6, y)) };
}

function officeStatus(office, submissions) {
  const records = submissions.filter((s) => s.officeId === office.id || s.postOffice === office.name);
  if (!records.length) return 'none';
  if (records.some((s) => s.status === STATUSES.PENDING_REVIEW)) return 'pending';
  if (records.some((s) => s.status === STATUSES.APPROVED)) return 'approved';
  return 'attention';
}

const STATUS_META = {
  approved: { label: 'Approved', dot: 'bg-emerald-500', ring: 'ring-emerald-300', text: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200' },
  pending: { label: 'Pending', dot: 'bg-amber-400', ring: 'ring-amber-300', text: 'text-amber-700', chip: 'bg-amber-50 border-amber-200' },
  attention: { label: 'Attention', dot: 'bg-red-500', ring: 'ring-red-300', text: 'text-red-700', chip: 'bg-red-50 border-red-200' },
  none: { label: 'No data', dot: 'bg-slate-300', ring: 'ring-slate-200', text: 'text-slate-500', chip: 'bg-slate-50 border-slate-200' },
};

export default function IndiaCoverageMap({ submissions = [], offices = POST_OFFICE_RECORDS }) {
  const [selectedState, setSelectedState] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);

  const states = useMemo(() => {
    const grouped = new Map();
    offices.forEach((office) => {
      if (!grouped.has(office.state)) grouped.set(office.state, []);
      grouped.get(office.state).push(office);
    });
    return [...grouped.entries()].map(([state, stateOffices]) => {
      const latitude = stateOffices.reduce((sum, office) => sum + Number(office.latitude || 0), 0) / stateOffices.length;
      const longitude = stateOffices.reduce((sum, office) => sum + Number(office.longitude || 0), 0) / stateOffices.length;
      const position = toMapPosition(latitude, longitude);
      const statuses = stateOffices.map((office) => officeStatus(office, submissions));
      const status = statuses.includes('attention') ? 'attention' : statuses.includes('pending') ? 'pending' : statuses.includes('approved') ? 'approved' : 'none';
      return { state, offices: stateOffices, ...position, status };
    });
  }, [offices, submissions]);

  const statusCounts = useMemo(() => {
    const counts = { approved: 0, pending: 0, attention: 0, none: 0 };
    states.forEach((s) => { counts[s.status] += 1; });
    return counts;
  }, [states]);

  const selected = states.find((item) => item.state === selectedState) || null;
  const latest = submissions.reduce((latestAt, item) => {
    const value = item.reviewedAt || item.submittedAt || item.updatedAt || item.createdAt;
    return value && (!latestAt || value > latestAt) ? value : latestAt;
  }, null);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">India Coverage Map</h2>
            {backendEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700">
                <Activity className="w-3 h-3" />Live sync
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {offices.length} offices across {states.length} states/UTs.{' '}
            {backendEnabled ? 'Status updates refresh from the backend when submissions change.' : 'Prototype mode uses the local demo/offline data until a backend is configured.'}{' '}
            Last activity: {latest ? new Date(latest).toLocaleTimeString() : 'No activity yet'}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.chip} ${meta.text}`}>
              <i className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
              {meta.label}
              <span className="tabular-nums opacity-70">{statusCounts[key]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-5">
        <div className="relative min-h-[440px] overflow-hidden rounded-2xl bg-gradient-to-b from-blue-50/60 to-slate-50 border border-slate-100">
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <path d={INDIA_OUTLINE} fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.6" strokeLinejoin="round" />
          </svg>

          {states.map((point) => {
            const meta = STATUS_META[point.status];
            const isSelected = point.state === selectedState;
            const isHovered = point.state === hoveredState;
            const isActive = point.status === 'attention' || point.status === 'pending';
            return (
              <button
                key={point.state}
                type="button"
                onClick={() => setSelectedState(point.state)}
                onMouseEnter={() => setHoveredState(point.state)}
                onMouseLeave={() => setHoveredState(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={`View ${point.state} (${meta.label})`}
              >
                {isActive && (
                  <span className={`absolute inset-0 -m-1.5 rounded-full ${meta.dot} opacity-40 animate-ping`} />
                )}
                <span
                  className={`relative block w-4 h-4 rounded-full border-2 border-white shadow-md ${meta.dot} transition-transform duration-150 ${
                    isSelected ? `scale-125 ring-4 ${meta.ring}` : 'group-hover:scale-125'
                  }`}
                />
                <span
                  className={`pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-slate-700 bg-white shadow-md border border-slate-200 px-2 py-1 rounded-md transition-opacity duration-150 z-10 ${
                    isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {point.state}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
          {!selected ? (
            <div className="h-full flex flex-col justify-center text-center">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800 mt-3">Choose a state</p>
              <p className="text-sm text-slate-500 mt-1">The office-level status will appear here.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">State drill-down</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{selected.state}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedState(null)}
                  className="p-2 rounded-lg hover:bg-white"
                  aria-label="Close state details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 mt-5 max-h-[340px] overflow-auto pr-1">
                {selected.offices.map((office) => {
                  const status = officeStatus(office, submissions);
                  const meta = STATUS_META[status];
                  const records = submissions.filter((s) => s.officeId === office.id || s.postOffice === office.name);
                  return (
                    <div key={office.officeCode || office.id || office.name} className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{office.name}</p>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.chip} ${meta.text}`}>
                          <i className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {records.length ? `${records.length} submission${records.length > 1 ? 's' : ''}` : 'No submission recorded'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
