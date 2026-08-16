import SubmissionsList from './SubmissionsList.jsx';

export default function PendingReview() {
  return (
    <SubmissionsList
      filterStatus="pending"
      title="Pending Review"
      subtitle="Submissions waiting for your approval."
    />
  );
}
