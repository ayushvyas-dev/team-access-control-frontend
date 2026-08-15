"use client";

import Link from "next/link";
import { Organization } from "@/types/api";
import { formatDate } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface OrgCardProps {
  org: Organization;
}

export function OrgCard({ org }: OrgCardProps) {
  return (
    <Link
      href={`/organizations/${org.id}`}
      className="group block rounded-lg border border-gray-200 p-5 transition-colors hover:bg-gray-50 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {org.name}
          </h3>
          <p className="mt-1 truncate text-xs font-mono text-gray-400">
            {org.slug}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 ml-4" />
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Created {formatDate(org.createdAt)}
      </p>
    </Link>
  );
}
