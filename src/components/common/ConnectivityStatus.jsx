import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useConnectivity } from '../../hooks/useConnectivity.js';

export default function ConnectivityStatus() {
  const { online, queued, lastSync } = useConnectivity();
  return (
    <div className="flex items-center gap-2 text-sm" title={lastSync ? `Last local sync: ${new Date(lastSync).toLocaleTimeString()}` : undefined}>
      {online ? <Cloud className="w-4 h-4 text-emerald-600" /> : <CloudOff className="w-4 h-4 text-amber-600" />}
      <span className="font-medium text-slate-700">{online ? 'Online' : 'Offline'}</span>
      {queued > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800"><RefreshCw className="w-3 h-3" />{queued} queued</span>}
      {!online && <span className="hidden sm:inline text-slate-500">Changes will sync when connection returns</span>}
    </div>
  );
}
