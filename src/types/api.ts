export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: string;
};

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  invitationUrl?: string;
};

export type PendingInvitation = {
  id: string;
  email?: string;
  invitedEmail?: string;
  role: Role;
  status?: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  team?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  organizationName?: string;
  teamName?: string;
};

export type PendingInvitationsResponse = {
  success: boolean;
  invitations: PendingInvitation[];
};

export type Session = {
  id: string;
  userId: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: {
    fieldErrors: Record<string, string[]>;
    formErrors: string[];
  };
};
