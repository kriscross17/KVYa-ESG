import { STATUS_COLORS } from '../../data/constants.js';

export default function Badge({ status }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-200 text-slate-800';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
}
