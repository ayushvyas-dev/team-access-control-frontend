"use client";

import { useState } from "react";
import { useSessions } from "@/features/sessions/hooks/useSessions";
import { useRevokeAllSessions } from "@/features/sessions/hooks/useRevokeSession";
import { SessionList } from "@/features/sessions/components/SessionList";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, Trash2 } from "lucide-react";

export default function SecurityPage() {
  const { data: sessions, isLoading, error, refetch } = useSessions();
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const revokeAll = useRevokeAllSessions();

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
            Security
          </h1>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage your active sessions
          </p>
        </div>
        {sessions && sessions.length > 0 && (
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 sm:w-auto"
            onClick={() => setShowRevokeAll(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Revoke all
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorState message="Failed to load sessions" retry={() => refetch()} />
      )}

      {sessions && sessions.length === 0 && (
        <EmptyState
          icon={Shield}
          title="No active sessions"
          description="You have no active sessions."
        />
      )}

      {sessions && sessions.length > 0 && <SessionList sessions={sessions} />}

      <ConfirmDialog
        open={showRevokeAll}
        onOpenChange={setShowRevokeAll}
        title="Revoke all sessions"
        description="This will sign you out of all devices. You will need to sign in again."
        confirmLabel="Revoke all"
        onConfirm={() =>
          revokeAll.mutate(undefined, {
            onSuccess: () => setShowRevokeAll(false),
          })
        }
        destructive
        loading={revokeAll.isPending}
      />
    </div>
  );
}
