"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-4 py-8 sm:px-6">
        <div className="mb-6 flex justify-center sm:mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-semibold">T</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 sm:text-base">
              TeamAccess
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
