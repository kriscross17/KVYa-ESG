import SubmissionsList from './SubmissionsList.jsx';

export default function ReturnedRejected() {
  return (
    <SubmissionsList
      filterStatus="returned"
      title="Returned / Rejected"
      subtitle="Submissions returned for correction or rejected."
    />
  );
}
