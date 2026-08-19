import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building, ArrowRight } from 'lucide-react';
import { useSubmissions } from '../context/SubmissionContext.jsx';
import Button from '../components/common/Button.jsx';
import { backendEnabled, login } from '../utils/api.js';

export default function RoleSelect() {
  const { setRole, setOperatorName, setOperatorOffice, operatorName } = useSubmissions();
  const navigate = useNavigate();
  const [name, setName] = useState(operatorName);
  const [showNameInput, setShowNameInput] = useState(false);
  const [showBackendLogin, setShowBackendLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const selectOperator = () => {
    if (backendEnabled) { setShowBackendLogin(true); setEmail('operator1@sih.local'); setPassword('SIH@2026'); return; }
    setShowNameInput(true);
  };

  const confirmOperator = () => {
    setOperatorName(name.trim() || 'Operator');
    setRole('operator');
    navigate('/operator');
  };

  const selectManager = () => {
    setOperatorOffice(null, '');
    if (backendEnabled) { setShowBackendLogin(true); setEmail('manager@sih.local'); setPassword('SIH@2026'); return; }
    setRole('manager');
    navigate('/manager');
  };

  const confirmBackendLogin = async () => {
    setLoggingIn(true); setLoginError('');
    try {
      const user = await login(email.trim(), password);
      setOperatorName(user.name || 'Operator');
      setOperatorOffice(user.officeId || null, user.office?.name || '');
      setRole(user.role === 'OPERATOR' ? 'operator' : 'manager');
      navigate(user.role === 'OPERATOR' ? '/operator' : '/manager');
    } catch (error) { setLoginError(error.message || 'Login failed'); }
    finally { setLoggingIn(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            KVYa BRSR/ESG Platform
          </h1>
          <p className="text-lg text-slate-600 mt-3 max-w-xl mx-auto">
            Welcome! Please select your role to continue. {backendEnabled ? 'Sign in with your account.' : 'No password is needed for this demo.'}
          </p>
        </div>

        {showBackendLogin ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Backend Login</h2>
            <p className="text-slate-600 mb-6">Use your authenticated Operator or Manager account.</p>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-4" />
            <label className="block text-sm font-semibold text-slate-800 mb-2">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl mb-4" />
            {loginError && <p className="text-red-700 bg-red-50 rounded-lg p-3 mb-4">{loginError}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowBackendLogin(false)}>Back</Button>
              <Button variant="primary" onClick={confirmBackendLogin} disabled={loggingIn}>{loggingIn ? 'Signing in…' : 'Sign in'}</Button>
            </div>
          </div>
        ) : !showNameInput ? (
          <div className="grid sm:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={selectOperator}
              className="group bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left"
            >
              <div className="p-4 bg-blue-100 rounded-xl w-fit mb-4 group-hover:bg-blue-200 transition-colors">
                <User className="w-8 h-8 text-blue-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                I am a Data Entry Operator
              </h2>
              <p className="text-slate-600 text-base">
                Enter ESG and BRSR data for your post office and submit for review.
              </p>
              <div className="mt-4 flex items-center gap-2 text-blue-700 font-semibold">
                Continue <ArrowRight className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={selectManager}
              className="group bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-green-500 hover:shadow-lg transition-all text-left"
            >
              <div className="p-4 bg-green-100 rounded-xl w-fit mb-4 group-hover:bg-green-200 transition-colors">
                <Building className="w-8 h-8 text-green-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                I am a Manager
              </h2>
              <p className="text-slate-600 text-base">
                Review submissions, approve or return data, and view ESG analytics at HQ.
              </p>
              <div className="mt-4 flex items-center gap-2 text-green-700 font-semibold">
                Continue <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Enter Your Name</h2>
            <p className="text-slate-600 mb-6">
              Your name will be saved with each submission you create.
            </p>
            <label className="block text-base font-semibold text-slate-800 mb-2">
              Your Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none mb-6"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="secondary" onClick={() => setShowNameInput(false)}>
                Back
              </Button>
              <Button variant="primary" icon={ArrowRight} onClick={confirmOperator}>
                Go to Operator Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
