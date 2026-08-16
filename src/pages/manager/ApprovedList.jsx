import SubmissionsList from './SubmissionsList.jsx';

export default function ApprovedList() {
  return (
    <SubmissionsList
      filterStatus="approved"
      title="Approved Submissions"
      subtitle="All submissions that have been approved."
    />
  );
}
