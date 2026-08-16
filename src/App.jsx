import { Routes, Route, Navigate } from 'react-router-dom';
import { useSubmissions } from './context/SubmissionContext.jsx';
import RoleSelect from './pages/RoleSelect.jsx';
import OperatorLayout from './layouts/OperatorLayout.jsx';
import ManagerLayout from './layouts/ManagerLayout.jsx';
import OperatorDashboard from './pages/operator/OperatorDashboard.jsx';
import NewSubmission from './pages/operator/NewSubmission.jsx';
import BuildingData from './pages/operator/BuildingData.jsx';
import OperationalData from './pages/operator/OperationalData.jsx';
import Review from './pages/operator/Review.jsx';
import MyDrafts from './pages/operator/MyDrafts.jsx';
import MySubmissions from './pages/operator/MySubmissions.jsx';
import OperatorSubmissionDetail from './pages/operator/OperatorSubmissionDetail.jsx';
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import SubmissionsList from './pages/manager/SubmissionsList.jsx';
import PendingReview from './pages/manager/PendingReview.jsx';
import ApprovedList from './pages/manager/ApprovedList.jsx';
import ReturnedRejected from './pages/manager/ReturnedRejected.jsx';
import ManagerSubmissionDetail from './pages/manager/ManagerSubmissionDetail.jsx';
import Analytics from './pages/manager/Analytics.jsx';
import Reports from './pages/manager/Reports.jsx';

function RequireRole({ role, children }) {
  const { role: currentRole, hydrated } = useSubmissions();
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Loading...</p>
      </div>
    );
  }
  if (currentRole !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { role, hydrated } = useSubmissions();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-slate-600">Loading application...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          role ? (
            <Navigate to={role === 'operator' ? '/operator' : '/manager'} replace />
          ) : (
            <RoleSelect />
          )
        }
      />

      <Route
        path="/operator"
        element={
          <RequireRole role="operator">
            <OperatorLayout />
          </RequireRole>
        }
      >
        <Route index element={<OperatorDashboard />} />
        <Route path="new" element={<NewSubmission />} />
        <Route path="building-data" element={<BuildingData />} />
        <Route path="operational-data" element={<OperationalData />} />
        <Route path="review" element={<Review />} />
        <Route path="drafts" element={<MyDrafts />} />
        <Route path="submissions" element={<MySubmissions />} />
        <Route path="submissions/:id" element={<OperatorSubmissionDetail />} />
      </Route>

      <Route
        path="/manager"
        element={
          <RequireRole role="manager">
            <ManagerLayout />
          </RequireRole>
        }
      >
        <Route index element={<ManagerDashboard />} />
        <Route path="submissions" element={<SubmissionsList />} />
        <Route path="submissions/:id" element={<ManagerSubmissionDetail />} />
        <Route path="pending" element={<PendingReview />} />
        <Route path="approved" element={<ApprovedList />} />
        <Route path="returned" element={<ReturnedRejected />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
