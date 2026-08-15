'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { rejectInvitation } from '@/lib/api/invitations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';

export default function RejectInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const rejectMutation = useMutation({
    mutationFn: () => rejectInvitation(params.token),
    onSuccess: () => setResult('success'),
    onError: (error: ApiError) => {
      setResult('error');
      setErrorMessage(error.message || 'Failed to reject invitation');
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login`);
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-semibold">T</span>
          </div>
        </div>

        {!result && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
              Reject invitation
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to decline this invitation?
            </p>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              {rejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reject invitation
            </Button>
          </div>
        )}

        {result === 'success' && (
          <div>
            <CheckCircle className="h-10 w-10 text-gray-900 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
              Invitation rejected
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              You&apos;ve declined the invitation.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Go to dashboard</Button>
            </Link>
          </div>
        )}

        {result === 'error' && (
          <div>
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
