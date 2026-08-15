'use client';

import { createContext, useContext } from 'react';
import { Organization, Membership, Role } from '@/types/api';

type OrgContextValue = {
  org: Organization;
  membership: Membership;
  role: Role;
};

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({
  children,
  org,
  membership,
}: {
  children: React.ReactNode;
  org: Organization;
  membership: Membership;
}) {
  return (
    <OrgContext.Provider
      value={{
        org,
        membership,
        role: membership.role,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrgContext must be used within an OrgProvider');
  }
  return context;
}
