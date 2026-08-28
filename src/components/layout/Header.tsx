"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip UUID-like segments in display but keep them in href
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        segment,
      );

    const label = isUuid
      ? "Overview"
      : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

    const href = segment === "organizations" ? "/dashboard" : currentPath;

    breadcrumbs.push({ label, href });
  }

  return breadcrumbs;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex shrink-0 items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-500 transition-colors hover:text-gray-900"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </header>
  );
}
