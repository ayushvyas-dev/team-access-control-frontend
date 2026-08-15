"use client";

import { useQuery } from "@tanstack/react-query";
import { getPendingInvitations } from "@/lib/api/invitations";
import type { PendingInvitation } from "@/types/api";

export function usePendingInvitations() {
  return useQuery({
    queryKey: ["invitations", "pending"],
    queryFn: async (): Promise<PendingInvitation[]> => {
      const res = await getPendingInvitations();

      // Handles: direct array [...], { data: [...] }, or { invitations: [...] }
      if (Array.isArray(res)) return res as PendingInvitation[];

      const response = res as Record<string, unknown>;
      if (Array.isArray(response.data)) return response.data as PendingInvitation[];
      if (Array.isArray(response.invitations)) return response.invitations as PendingInvitation[];

      // Always return a defined fallback instead of undefined
      return [];
    },
  });
}
