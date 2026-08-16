import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  List,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileBarChart,
  ArrowLeftRight,
} from 'lucide-react';
import { useSubmissions } from '../context/SubmissionContext.jsx';
import ConnectivityStatus from '../components/common/ConnectivityStatus.jsx';
import { logout } from '../utils/api.js';

const navItems = [
  { to: '/manager', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/manager/submissions', label: 'All Submissions', icon: List },
  { to: '/manager/pending', label: 'Pending Review', icon: Clock },
  { to: '/manager/approved', label: 'Approved', icon: CheckCircle },
  { to: '/manager/returned', label: 'Returned / Rejected', icon: XCircle },
  { to: '/manager/analytics', label: 'ESG Analytics', icon: BarChart3 },
  { to: '/manager/reports', label: 'BRSR Reports', icon: FileBarChart },
];

export default function ManagerLayout() {
  const { setRole, setActiveDraftId, setOperatorName } = useSubmissions();
  const navigate = useNavigate();

  const switchRole = () => {
    logout();
    setActiveDraftId(null);
    setOperatorName('');
    setRole(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-72 bg-white border-r border-slate-200 shrink-0">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-blue-900">KVYA ESG</h1>
          <p className="text-sm text-slate-600 mt-1">Manager (HQ)</p>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4"><h2 className="text-xl font-bold text-slate-900 hidden sm:block">Manager Portal</h2><ConnectivityStatus /></div>
          <button
            type="button"
            onClick={switchRole}
            className="inline-flex items-center gap-2 px-4 py-2 text-base font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200"
          >
            <ArrowLeftRight className="w-5 h-5" />
            Switch Role
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
