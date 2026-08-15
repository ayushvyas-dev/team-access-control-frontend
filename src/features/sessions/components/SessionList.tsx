'use client';

import { Session } from '@/types/api';
import { SessionCard } from './SessionCard';
import { useRevokeSession } from '@/features/sessions/hooks/useRevokeSession';

interface SessionListProps {
  sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
  const revokeMutation = useRevokeSession();

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onRevoke={(id) => revokeMutation.mutate(id)}
          revoking={revokeMutation.isPending}
        />
      ))}
    </div>
  );
}
