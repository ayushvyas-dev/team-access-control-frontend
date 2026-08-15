"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { acceptInvitation } from "@/lib/api/invitations";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(params.token),
    onSuccess: () => setResult("success"),
    onError: (error: ApiError) => {
      setResult("error");
      setErrorMessage(error.message || "Failed to accept invitation");
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
      <div className="w-full max-w-sm px-4 py-8 text-center sm:px-6">
        <div className="flex justify-center mb-6">
          <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-semibold">T</span>
          </div>
        </div>

        {!result && (
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
              Accept invitation
            </h1>
            <p className="mb-6 text-sm leading-6 text-gray-500">
              You&apos;ve been invited to join an organization.
            </p>
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="w-full"
            >
              {acceptMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Accept invitation
            </Button>
          </div>
        )}

        {result === "success" && (
          <div>
            <CheckCircle className="h-10 w-10 text-gray-900 mx-auto mb-4" />
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
              Invitation accepted
            </h1>
            <p className="mb-6 text-sm leading-6 text-gray-500">
              You&apos;ve successfully joined the organization.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Go to dashboard</Button>
            </Link>
          </div>
        )}

        {result === "error" && (
          <div>
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm leading-6 text-gray-500">
              {errorMessage}
            </p>
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
