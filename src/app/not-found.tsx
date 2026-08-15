import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="px-4 text-center sm:px-6">
        <h1 className="mb-2 text-5xl font-semibold text-gray-900 sm:text-6xl">
          404
        </h1>
        <p className="mb-6 text-lg leading-7 text-gray-500">Page not found</p>
        <p className="mb-8 max-w-sm text-sm leading-6 text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
