'use client';

import { Session } from '@/types/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Globe, X } from 'lucide-react';

interface SessionCardProps {
  session: Session;
  onRevoke: (sessionId: string) => void;
  revoking: boolean;
}

function parseUserAgent(ua: string | null) {
  if (!ua) return { device: 'Unknown device', icon: Monitor };
  const lower = ua.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    return { device: 'Mobile device', icon: Smartphone };
  }
  return { device: 'Desktop browser', icon: Monitor };
}

export function SessionCard({ session, onRevoke, revoking }: SessionCardProps) {
  const { device, icon: DeviceIcon } = parseUserAgent(session.userAgent);
  const isRevoked = !!session.revokedAt;

  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
          <DeviceIcon className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{device}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {session.ip && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Globe className="h-3 w-3" />
                {session.ip}
              </span>
            )}
            <span className="text-xs text-gray-400">
              Created {formatDateTime(session.createdAt)}
            </span>
          </div>
          {isRevoked && (
            <span className="text-xs text-red-500 mt-0.5 block">Revoked</span>
          )}
        </div>
      </div>
      {!isRevoked && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-600"
          onClick={() => onRevoke(session.id)}
          disabled={revoking}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
