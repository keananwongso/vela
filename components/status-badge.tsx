import { STATUS_LABELS, type StatusKey } from '@/lib/dashboard-types';

export default function StatusBadge({ status }: { status: StatusKey }) {
  return (
    <span className={`badge ${status}`}>
      <span className="dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
