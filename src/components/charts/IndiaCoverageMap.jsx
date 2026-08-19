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
  'M31.73,7.86 L37.81,6.29 L41.37,7.88 L38.01,12.49 L36.29,12.59 L38.49,16.64 L36.56,17.7 ' +
  'L35.8,16.58 L34.65,17.09 L35.93,20.9 L37.0,20.45 L43.44,24.23 L41.22,25.79 L40.25,28.67 ' +
  'L49.12,32.81 L53.84,32.76 L57.37,35.13 L66.69,36.37 L67.06,31.51 L68.79,30.88 L70.45,34.98 ' +
  'L80.19,34.85 L78.81,32.0 L81.52,31.9 L88.75,27.2 L90.88,27.91 L93.51,26.93 L95.44,28.96 ' +
  'L94.69,29.67 L97.98,31.21 L96.3,32.48 L97.13,34.09 L94.1,33.5 L90.5,35.57 L87.19,44.23 ' +
  'L84.43,43.5 L83.02,50.18 L82.01,50.07 L80.93,44.63 L79.86,44.58 L78.73,47.07 L77.2,44.97 ' +
  'L81.42,40.53 L72.79,39.71 L72.26,36.76 L71.19,37.48 L68.0,35.54 L67.02,38.08 L69.37,38.99 ' +
  'L70.03,39.8 L66.7,41.66 L69.12,42.88 L68.53,44.85 L69.99,46.2 L70.33,51.13 L68.8,49.76 ' +
  'L67.49,51.37 L67.36,49.53 L67.27,49.4 L66.73,49.3 L66.01,50.95 L63.04,52.07 L63.57,54.0 ' +
  'L61.24,56.4 L56.79,58.15 L47.69,65.51 L47.68,67.0 L40.88,69.77 L41.15,77.24 L39.2,82.28 ' +
  'L39.6,86.53 L37.65,86.69 L36.33,89.1 L37.3,89.75 L34.22,90.57 L31.83,93.52 L28.49,90.94 ' +
  'L26.23,83.99 L18.19,68.58 L15.52,56.77 L16.43,53.88 L15.33,52.19 L16.43,51.01 L15.03,50.08 ' +
  'L16.37,49.17 L14.42,49.04 L13.7,52.5 L9.41,54.09 L3.12,49.04 L7.25,48.31 L8.16,46.97 ' +
  'L3.99,47.39 L1.42,45.28 L2.7,44.13 L1.17,45.06 L0.57,44.95 L2.69,42.77 L10.4,42.49 ' +
  'L8.87,38.43 L7.0,37.69 L7.25,35.78 L5.03,35.18 L5.29,33.8 L7.91,31.21 L9.57,32.17 ' +
  'L12.99,31.37 L22.32,21.64 L22.02,19.09 L24.57,18.04 L22.27,17.21 L22.35,16.12 L18.78,15.33 ' +
  'L17.99,11.32 L20.44,9.0 L17.26,6.69 L15.23,6.71 L15.16,5.52 L16.87,4.07 L19.54,3.99 ' +
  'L18.9,3.37 L23.82,3.02 Z';

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
