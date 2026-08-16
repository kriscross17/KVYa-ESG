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
  'M33.08,7.82 L37.83,6.29 L40.17,8.04 L41.39,7.92 L40.26,10.26 L38.37,11.07 L37.99,12.5 L36.31,12.56 ' +
  'L36.96,13.68 L36.47,14.44 L38.03,15.04 L38.49,16.64 L36.56,17.7 L35.8,16.58 L34.64,17.07 L35.92,18.78 ' +
  'L35.93,20.9 L37.0,20.46 L38.09,21.8 L43.43,24.23 L41.22,25.79 L40.25,28.67 L46.28,31.69 L49.03,32.12 ' +
  'L49.12,32.81 L51.05,33.34 L53.83,32.76 L57.36,35.12 L58.79,34.79 L59.5,35.72 L66.69,36.37 L67.3,35.17 ' +
  'L66.63,34.0 L67.06,31.51 L68.78,30.87 L69.62,31.69 L69.16,33.93 L70.42,34.93 L80.19,34.84 L80.41,33.48 ' +
  'L78.84,32.86 L78.59,31.77 L81.52,31.88 L84.5,29.32 L86.39,28.93 L88.97,27.13 L90.87,27.9 L93.49,26.94 ' +
  'L95.4,28.95 L94.99,29.91 L95.69,29.42 L97.98,31.23 L96.33,32.46 L97.15,34.08 L95.7,33.2 L94.35,33.47 ' +
  'L90.51,35.58 L90.62,37.28 L88.63,39.82 L89.13,40.6 L87.19,44.23 L84.44,43.48 L84.62,46.43 L83.76,46.74 ' +
  'L84.0,49.19 L83.01,50.13 L82.4,49.5 L82.0,50.03 L80.9,44.63 L79.83,44.59 L78.73,47.03 L77.21,44.91 ' +
  'L77.9,43.44 L79.67,43.24 L80.83,40.95 L81.63,40.79 L80.17,40.05 L72.79,39.7 L72.26,36.76 L71.92,37.6 ' +
  'L71.17,37.47 L70.29,36.26 L68.9,36.68 L68.03,35.51 L68.41,36.38 L67.01,38.04 L70.03,39.8 L68.14,39.97 ' +
  'L66.7,41.65 L69.1,42.92 L68.54,44.86 L69.31,45.33 L69.11,46.11 L69.99,46.21 L69.48,46.84 L70.23,49.41 ' +
  'L68.22,49.85 L67.56,50.84 L66.83,49.31 L67.32,49.67 L66.1,50.88 L62.96,52.13 L63.23,53.7 L62.52,54.32 ' +
  'L63.51,54.01 L62.67,55.14 L57.23,57.92 L53.77,61.51 L47.91,65.15 L47.71,66.48 L46.79,66.59 L47.72,66.97 ' +
  'L44.21,67.73 L42.76,69.55 L41.66,68.94 L41.06,69.5 L40.0,71.19 L41.18,77.33 L39.19,82.55 L39.61,86.53 ' +
  'L37.61,86.72 L36.33,89.13 L37.3,89.74 L34.69,90.29 L33.56,92.58 L31.84,93.51 L28.49,90.92 L27.97,87.97 ' +
  'L22.75,78.6 L20.97,72.75 L19.28,70.6 L20.01,70.31 L19.23,70.34 L18.18,68.58 L16.44,61.81 L17.06,61.46 ' +
  'L16.39,61.42 L16.19,60.33 L16.78,60.39 L16.81,58.43 L15.92,58.28 L15.5,56.75 L16.49,53.88 L16.03,52.44 ' +
  'L15.38,52.84 L16.06,51.8 L15.37,51.3 L16.04,51.08 L15.09,50.94 L15.76,50.16 L15.02,50.18 L15.29,49.36 ' +
  'L16.27,49.29 L14.97,48.84 L13.67,49.68 L14.35,51.18 L13.71,52.5 L9.43,54.09 L7.21,52.97 L3.12,49.05 ' +
  'L7.16,48.37 L9.1,46.27 L12.38,46.44 L10.71,46.23 L11.31,45.76 L10.16,44.9 L10.9,43.76 L10.52,43.07 ' +
  'L8.57,42.96 L10.4,42.5 L10.33,41.6 L8.87,38.43 L7.01,37.7 L7.26,35.79 L5.04,35.17 L5.29,33.81 ' +
  'L7.9,31.23 L9.58,32.18 L12.98,31.38 L14.59,28.89 L16.48,28.04 L17.99,25.17 L19.84,24.44 L19.81,23.54 ' +
  'L22.31,21.66 L21.71,21.46 L21.85,19.29 L24.6,18.02 L22.28,17.2 L22.29,16.13 L18.78,15.29 L17.98,11.32 ' +
  'L20.4,8.97 L19.07,8.66 L19.27,7.74 L17.01,6.7 L15.27,6.74 L15.17,5.54 L17.25,3.98 L19.61,4.05 ' +
  'L18.86,3.4 L23.79,3.04 L28.79,5.67 L29.38,6.74 L31.19,7.13 L31.31,7.91 Z';

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