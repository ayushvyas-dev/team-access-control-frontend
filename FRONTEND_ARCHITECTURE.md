# Team Access Control — Frontend Architecture Document
## Backend Analysis + Next.js Frontend Design

---

## 1. Backend Overview

**Stack:** Node.js + Express 5 + TypeScript + Prisma (PostgreSQL via Neon) + Redis (Upstash) + BullMQ + Nodemailer + JWT + Pino

**Base URL:** `http://localhost:5000/api/v1`

**Request flow:** `Rate Limiter → Logger → Route → validate() → authenticate() → requireOrgMembership() → requirePermission() → Controller → Service → Repository → Prisma → PostgreSQL`

---

## 2. Database Schema (Source of Truth)

### Models

| Model | Key Fields |
|---|---|
| `User` | `id` (uuid), `name`, `email` (unique), `passwordHash`, `emailVerified` (bool), `createdAt`, `updatedAt`, `deletedAt` (soft-delete) |
| `Session` | `id`, `userId`, `userAgent?`, `ip?`, `createdAt`, `expiresAt`, `revokedAt?` |
| `RefreshToken` | `id`, `sessionId`, `tokenHash` (unique, sha256), `createdAt`, `expiresAt`, `revokedAt?`, `replacedByTokenId?` |
| `Otp` | `id`, `userId`, `otpHash`, `createdAt`, `expiresAt` |
| `Organization` | `id`, `name`, `slug` (unique), `createdAt`, `updatedAt` |
| `Membership` | `id`, `userId`, `organizationId`, `role` (OWNER/ADMIN/MEMBER), `createdAt` — unique on `(userId, organizationId)` |
| `Invitation` | `id`, `organizationId`, `invitedById`, `email`, `role`, `token` (unique, sha256 hash), `status` (PENDING/ACCEPTED/REJECTED/EXPIRED), `expiresAt`, `createdAt`, `updatedAt` |

### Enums
```
Role:             OWNER | ADMIN | MEMBER
InvitationStatus: PENDING | ACCEPTED | REJECTED | EXPIRED
```

---

## 3. Authentication System

### Mechanism
- **Dual HttpOnly cookie** authentication
- `accessToken` cookie — JWT, expires in **15 minutes** (`sub`, `sessionId`, `type:"access"`)
- `refreshToken` cookie — JWT, expires in **30 days**, stored as SHA-256 hash in DB
- No `Authorization: Bearer` header — cookies only
- `sameSite: "lax"`, `secure: true` in production only

### Token Flow
1. **Login** → server sets both cookies; response body contains `{ user: { id, email } }`
2. **Access** → `authenticate` middleware reads `req.cookies.accessToken`, verifies JWT
3. **Refresh** → `POST /auth/refresh` rotates both tokens (revokes old refresh token, issues new pair)
4. **Reuse detection** → if a revoked refresh token is replayed, the rotation fails (though full session revocation on reuse is not yet implemented — documented as an observation)
5. **Logout** — **NOT IMPLEMENTED** (commented out in code)

---

## 4. Authorization / RBAC

### Role → Permission Matrix

| Permission | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| `organization:read` | ✅ | ✅ | ✅ |
| `organization:update` | ✅ | ❌ | ❌ |
| `organization:delete` | ✅ | ❌ | ❌ |
| `member:read` | ✅ | ✅ | ✅ |
| `member:update-role` | ✅ | ✅ | ❌ |
| `member:remove` | ✅ | ✅ | ❌ |
| `invitation:read` | ✅ | ✅ | ❌ |
| `invitation:create` | ✅ | ✅ | ❌ |
| `invitation:delete` | ✅ | ✅ | ❌ |

### Middleware Chain for Protected Org Routes
```
authenticate → requireOrgMembership → requirePermission(permission)
```
- `requireOrgMembership` reads `:organizationId` from params, finds membership, sets `req.membership`
- `requirePermission` reads `req.membership.role`, checks against `rolePermissions` config

---

## 5. Complete API Map

### Group A — Health

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/v1/health` | None | — | `{ success, message, timestamp }` |

---

### Group B — Authentication (`/api/v1/auth`)
Rate limit: **10 requests / 15 min** per IP (sliding window)

#### `POST /api/v1/auth/register`
- **Auth:** None
- **Body:** `{ name: string(min:3), email: string, password: string(8-30) }`
- **Success 201:** `{ success: true, message: "...", data: { name, email } }`
- **Side effect:** Creates OTP (expires 10min), queues verification email via BullMQ
- **Errors:** 400 (validation), 500 (user exists → generic Error "User already exists")

#### `POST /api/v1/auth/verify-email`
- **Auth:** None
- **Body:** `{ email: string, otp: string(exactly 6 digits) }`
- **Success 200:** `{ success: true, message: "Email verified successfully", data: null }`
- **Errors:** 400 (validation), 500 ("Invalid or expired OTP", "OTP has expired", "Invalid OTP")

#### `POST /api/v1/auth/login`
- **Auth:** None
- **Body:** `{ email: string, password: string(8-30) }`
- **Success 200:** Sets `accessToken` + `refreshToken` cookies. Body: `{ success: true, message: "...", user: { id, email } }`
- **Errors:** 400 (validation), 500 ("Invalid credentials", "Email not verified", "User account does not exist")

#### `POST /api/v1/auth/refresh`
- **Auth:** Requires `refreshToken` cookie
- **Body:** None
- **Success 200:** Sets new `accessToken` + `refreshToken` cookies. Body: `{ success: true, message: "Token refreshed successfully" }`
- **Errors:** 500 ("Refresh token is required", "Invalid refresh token", "Refresh token has expired", "Session expired")

> ⚠️ **Logout NOT implemented** — `POST /auth/logout` and `POST /auth/logout-all` are commented out in the codebase.

---

### Group C — Users (`/api/v1/users`)
No rate limiter applied.

#### `GET /api/v1/users/me`
- **Auth:** `accessToken` cookie required
- **Success 200:** `{ success, message, data: { id, name, email, emailVerified, createdAt, updatedAt } }`

#### `PATCH /api/v1/users/me`
- **Auth:** `accessToken` cookie required
- **Body:** `{ name: string }` (no Zod schema defined — raw body used)
- **Success 200:** `{ success, message, data: { id, name, email, emailVerified, createdAt, updatedAt } }`

#### `DELETE /api/v1/users/me`
- **Auth:** `accessToken` cookie required
- **Success 200:** `{ success, message: "User deleted successfully" }` (soft-delete — sets `deletedAt`)

---

### Group D — Organizations (`/api/v1/organizations`)
Rate limit: **60 requests / 15 min** per IP

#### `POST /api/v1/organizations`
- **Auth:** `accessToken` cookie required
- **Body:** `{ name: string(3-255) }`
- **Success 201:** `{ success, message, data: { id, name, slug, createdAt, updatedAt } }`
- **Side effect:** Creates organization + `OWNER` membership in a single transaction

#### `GET /api/v1/organizations`
- **Auth:** `accessToken` cookie required
- **Success 200:** `{ success, message, data: Organization[] }` — only orgs the user is a member of

#### `GET /api/v1/organizations/:organizationId`
- **Auth:** `accessToken` cookie required
- **Params:** `organizationId` (UUID)
- **Success 200:** `{ success, message, data: Organization }` — only if user is a member
- **Errors:** 400 (invalid UUID), 500 ("Organization not found for the user")

#### `PATCH /api/v1/organizations/:organizationId`
- **Auth:** `accessToken` cookie + `organization:update` permission (OWNER only)
- **Body:** `{ name: string(3-255) }`
- **Success 200:** `{ success, message, data: Organization }`

#### `DELETE /api/v1/organizations/:organizationId`
- **Auth:** `accessToken` cookie + `organization:delete` permission (OWNER only)
- **Success 200:** `{ success, message: "Organization deleted successfully" }`

---

### Group E — Memberships (`/api/v1/organizations/:organizationId/members`)

#### `GET /api/v1/organizations/:organizationId/members`
- **Auth:** `accessToken` cookie + `member:read` (OWNER/ADMIN/MEMBER)
- **Success 200:** `{ success, message, data: { memberships: Membership[] } }`
- **Membership shape:** `{ id, userId, organizationId, role, createdAt }` (no user name/email joined — DB issue observed)

#### `GET /api/v1/organizations/:organizationId/members/:memberId`
- **Auth:** `accessToken` cookie (no `requireOrgMembership` or permission check!)
- **Params:** `organizationId` (UUID), `memberId` (UUID)
- **Success 200:** `{ success, message, data: { membership } }`

#### `PATCH /api/v1/organizations/:organizationId/members/:memberId`
- **Auth:** `accessToken` cookie + `member:update-role` (OWNER/ADMIN)
- **Body:** `{ role: "OWNER" | "ADMIN" | "MEMBER" }`
- **Success 200:** `{ success, message, data: { membership: { role } } }`

#### `DELETE /api/v1/organizations/:organizationId/members/me`
- **Auth:** `accessToken` cookie (no org membership check)
- **Success 200:** `{ success, message: "Current user's membership deleted successfully" }` (leave organization)

#### `DELETE /api/v1/organizations/:organizationId/members/:memberId`
- **Auth:** `accessToken` cookie + `member:remove` (OWNER/ADMIN)
- **Success 200:** `{ success, message: "Membership deleted successfully" }` (remove another member)

---

### Group F — Invitations

#### `POST /api/v1/organizations/:organizationId/invitations`
- **Auth:** `accessToken` cookie + `invitation:create` (OWNER/ADMIN)
- **Body:** `{ email: string, role: "OWNER" | "ADMIN" | "MEMBER" }`
- **Success 201:** `{ success, message, data: { id, email, role, status, expiresAt, createdAt, invitationUrl (dev only) } }`
- **Expiry:** 7 days
- **Side effects:** In production, sends invitation email. In development, returns `invitationUrl` in response body

#### `GET /api/v1/organizations/:organizationId/invitations`
- **Auth:** `accessToken` cookie + `invitation:read` (OWNER/ADMIN)
- **Success 200:** `{ success, message, data: Invitation[] }`
- **Invitation shape:** `{ id, email, role, expiresAt, createdAt }` (status not included — DB observation)

#### `DELETE /api/v1/organizations/:organizationId/invitations/:invitationId`
- **Auth:** `accessToken` cookie + `invitation:delete` (OWNER/ADMIN)
- **Success 200:** `{ success, message: "Invitation deleted successfully" }`

#### `POST /api/v1/invitations/:token/accept`
- **Auth:** `accessToken` cookie (any authenticated user)
- **Params:** `token` (64-char hex string)
- **Success 200:** `{ success, message: "Invitation accepted successfully" }`
- **Validation:** Token's target email must match authenticated user's email

#### `POST /api/v1/invitations/:token/reject`
- **Auth:** `accessToken` cookie (any authenticated user)
- **Params:** `token` (64-char hex string)
- **Success 200:** `{ success, message: "Invitation rejected successfully" }`

---

### Group G — Sessions (`/api/v1/sessions`)

#### `GET /api/v1/sessions`
- **Auth:** `accessToken` cookie
- **Success 200:** `{ success, message, data: Session[] }` — all sessions for current user
- **Session shape:** `{ id, userId, userAgent, ip, createdAt, expiresAt, revokedAt }`

#### `DELETE /api/v1/sessions/:sessionId`
- **Auth:** `accessToken` cookie
- **Params:** `sessionId` (UUID)
- **Success 200:** `{ success, message: "Session deleted successfully" }`

#### `DELETE /api/v1/sessions`
- **Auth:** `accessToken` cookie
- **Success 200:** `{ success, message: "All session deleted successfully" }`

---

## 6. Standard Error Response Shape

All errors:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

Validation errors (400):
```json
{
  "success": false,
  "message": "body validation failed",
  "errors": { "fieldErrors": { "field": ["message"] }, "formErrors": [] }
}
```

Rate limit (429):
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## 7. Backend Issues / Observations (Do Not Fix)

1. **Logout not implemented** — `/auth/logout` and `/auth/logout-all` are commented-out stubs. Frontend must handle session expiry only via cookie expiration or 401 responses.
2. **`PATCH /users/me` has no Zod validation** — body is used directly without schema validation.
3. **`GET /members/:memberId` has no `requireOrgMembership`** — any authenticated user can read any membership by guessing IDs.
4. **Membership list returns no user details** — `getMembershipsByOrgId` returns raw membership rows with `userId` only, no joined `name`/`email`. Frontend must make separate calls or the table will only show UUIDs.
5. **Invitation list omits `status` field** — `getAllOrgInvitations` selects `{ id, email, role, expiresAt, createdAt }` but excludes `status`.
6. **Error messages leak business logic** — "User already exists", "Invalid credentials" etc. are thrown as generic `Error` objects, not `AppError` with proper status codes. The global error handler will return 500 for these instead of 409/401. Frontend must not rely on HTTP status codes alone; always read `message`.
7. **Invitation URL hardcoded** — `invitationUrl` in `invitation.service.ts` is hardcoded to `http://localhost:5000`. This needs to be a frontend URL in production.
8. **No CORS configuration** — No `cors()` middleware registered in `app.ts`. Cookie-based auth from a different-origin frontend will fail unless CORS is configured.
9. **Reuse detection incomplete** — When a revoked refresh token is replayed, an error is thrown but the associated session is not revoked (partial security).
10. **`AppError` class exists but is rarely used** — most service errors use `throw new Error(msg)` instead of `throw new AppError(msg, statusCode)`, causing 500s for non-critical errors.
11. **`getOrganizationService` uses `findFirst` with userId membership filter** — but `getOrganization` route does NOT run `requireOrgMembership` first. The membership check is done inside the repository query.
# Team Access Control — Frontend Architecture Document (Part 2)
## Next.js Frontend Design

---

## 8. Authentication Architecture

### Strategy
The backend uses **dual HttpOnly cookies** (`accessToken` + `refreshToken`). The frontend must NOT use NextAuth or any token-based auth library. Instead:

- `credentials: "include"` on every fetch
- The `accessToken` cookie is HttpOnly — **the frontend cannot read it**
- Authentication state is determined by calling `GET /api/v1/users/me`; if it returns 200, the user is authenticated
- On 401, attempt `POST /api/v1/auth/refresh` to silently rotate tokens, then retry the original request
- If refresh also fails, redirect to `/login`

### Critical Problem: CORS Must Be Fixed in Backend
Before any cookie-based frontend works, the backend needs `cors()` with `origin` and `credentials: true`. This is a **prerequisite** (document it; do not implement in backend).

### Auth State (Frontend)
Store in React Context / Zustand:
```ts
type AuthState = {
  user: { id: string; email: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### Login Flow
1. `POST /auth/login` with credentials
2. Server sets cookies
3. Frontend stores `{ id, email }` from response body in auth state
4. Redirect to `/dashboard`

### Logout Flow (Workaround — No Backend Logout Endpoint)
Since `/auth/logout` is not implemented:
- Call `DELETE /api/v1/sessions` (deletes all sessions server-side)
- Clear local auth state
- Redirect to `/login`
- Cookies will expire naturally (or use `document.cookie` expiry workaround — but cookies are HttpOnly, so this only works for non-HttpOnly cookies)

> ⚠️ **This is a known backend limitation.** The frontend cannot clear HttpOnly cookies. The workaround is deleting all sessions; the cookie remains but becomes invalid on next use.

### Protected Route Pattern (Next.js App Router)
Use a Server Component layout that calls `/users/me` and redirects if unauthenticated:
```ts
// app/(dashboard)/layout.tsx
const user = await getMe(); // server-side fetch with forwarded cookies
if (!user) redirect('/login');
```

---

## 9. Frontend Route Structure

```
app/
├── (auth)/
│   ├── login/               — Login page
│   ├── register/            — Registration page
│   ├── verify-email/        — OTP verification page
│   └── layout.tsx           — Public layout (redirect to dashboard if logged in)
│
├── (dashboard)/
│   ├── layout.tsx           — Protected layout (redirect to /login if not authenticated)
│   ├── dashboard/           — Overview: list of user's organizations
│   ├── settings/
│   │   ├── profile/         — Edit name (PATCH /users/me)
│   │   ├── security/        — View and revoke sessions
│   │   └── danger/          — Delete account (DELETE /users/me)
│   └── organizations/
│       └── [orgId]/
│           ├── layout.tsx           — Fetch org + membership, inject org context
│           ├── page.tsx             — Org overview / settings (OWNER only: edit/delete)
│           ├── members/             — Member list + role management
│           └── invitations/         — Pending invitations (OWNER/ADMIN only)
│
├── invitations/
│   └── [token]/
│       ├── accept/          — Accept invitation page (authenticated)
│       └── reject/          — Reject invitation page (authenticated)
│
└── not-found.tsx            — Global 404 page
```

### Route Details

| Route | Purpose | APIs Used | Permissions |
|---|---|---|---|
| `/login` | Login form | `POST /auth/login` | Public |
| `/register` | Registration form | `POST /auth/register` | Public |
| `/verify-email` | OTP input | `POST /auth/verify-email` | Public |
| `/dashboard` | User's org list | `GET /organizations` | Authenticated |
| `/settings/profile` | Edit name | `GET /users/me`, `PATCH /users/me` | Authenticated |
| `/settings/security` | Sessions list | `GET /sessions`, `DELETE /sessions/:id`, `DELETE /sessions` | Authenticated |
| `/settings/danger` | Delete account | `DELETE /users/me` | Authenticated |
| `/organizations/[orgId]` | Org details + edit/delete | `GET /organizations/:id`, `PATCH`, `DELETE` | OWNER (update/delete) |
| `/organizations/[orgId]/members` | Member list + role change + remove | `GET /members`, `PATCH /members/:id`, `DELETE /members/:id` | OWNER/ADMIN/MEMBER (role-gated UI) |
| `/organizations/[orgId]/invitations` | Invite + list + revoke | `GET /invitations`, `POST /invitations`, `DELETE /invitations/:id` | OWNER/ADMIN |
| `/invitations/[token]/accept` | Accept invite | `POST /invitations/:token/accept` | Authenticated |
| `/invitations/[token]/reject` | Reject invite | `POST /invitations/:token/reject` | Authenticated |

---

## 10. Frontend Project Structure

```
src/
├── app/                         — Next.js App Router pages
│   ├── (auth)/
│   ├── (dashboard)/
│   └── invitations/
│
├── components/
│   ├── ui/                      — Primitive UI: Button, Input, Badge, Modal, Toast
│   ├── layout/                  — Sidebar, Header, Breadcrumb
│   └── shared/                  — ConfirmDialog, EmptyState, ErrorState, LoadingSpinner
│
├── features/
│   ├── auth/
│   │   ├── components/          — LoginForm, RegisterForm, OtpForm
│   │   └── hooks/               — useLogin, useRegister, useVerifyEmail
│   ├── organizations/
│   │   ├── components/          — OrgCard, OrgForm, OrgDeleteDialog
│   │   └── hooks/               — useOrganizations, useOrganization, useCreateOrg
│   ├── members/
│   │   ├── components/          — MemberTable, MemberRoleBadge, MemberActions
│   │   └── hooks/               — useMembers, useUpdateRole, useRemoveMember
│   ├── invitations/
│   │   ├── components/          — InviteForm, InvitationTable, InvitationActions
│   │   └── hooks/               — useInvitations, useCreateInvitation
│   └── sessions/
│       ├── components/          — SessionCard, SessionList
│       └── hooks/               — useSessions, useRevokeSession
│
├── lib/
│   ├── api-client.ts            — Central fetch wrapper (handles 401 → refresh → retry)
│   ├── api/
│   │   ├── auth.ts              — Auth API functions
│   │   ├── users.ts             — User API functions
│   │   ├── organizations.ts     — Organization API functions
│   │   ├── members.ts           — Membership API functions
│   │   ├── invitations.ts       — Invitation API functions
│   │   └── sessions.ts          — Session API functions
│   └── utils.ts                 — cn(), formatDate(), etc.
│
├── hooks/
│   ├── useAuth.ts               — Auth context consumer
│   └── usePermission.ts         — Permission checker based on current membership role
│
├── providers/
│   ├── AuthProvider.tsx         — Auth context (user state, login, logout helpers)
│   ├── OrgProvider.tsx          — Current org context (membership + role)
│   └── QueryProvider.tsx        — TanStack Query client
│
├── types/
│   ├── api.ts                   — API response types (User, Org, Membership, Invitation, Session)
│   └── permissions.ts           — Role, Permission, rolePermissions map (mirrored from backend)
│
└── schemas/
    ├── auth.schemas.ts          — Zod schemas for login/register/verify forms
    ├── organization.schemas.ts  — Zod schema for org name
    ├── member.schemas.ts        — Zod schema for role update
    └── invitation.schemas.ts    — Zod schema for invite form
```

---

## 11. API Client Architecture

### Central Fetch Wrapper (`src/lib/api-client.ts`)

```ts
// Pseudocode
async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',               // always send cookies
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (res.status === 401) {
    // Try to refresh
    const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST', credentials: 'include'
    });
    if (!refreshed.ok) {
      redirect('/login');     // or throw AuthError
    }
    // Retry original request once
    return apiClient(path, options);
  }

  const body = await res.json();
  if (!res.ok) {
    throw new ApiError(body.message, res.status, body.errors);
  }
  return body;
}
```

### ApiError Class
```ts
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>   // Zod flatten errors
  ) { super(message); }
}
```

### Error Handling per Status Code

| Code | Meaning | Frontend Action |
|---|---|---|
| 400 | Validation failed | Show field errors from `errors.fieldErrors` |
| 401 | Unauthenticated | Attempt refresh; if fails, redirect to `/login` |
| 403 | Forbidden | Show "You don't have permission" toast/message |
| 404 | Not found | Show 404 state or redirect |
| 429 | Rate limited | Show "Too many requests, try again later" toast |
| 500 | Server error | Show generic error toast |

> ⚠️ **Important:** Many backend errors that should be 401/403/409 are returned as 500 due to the `Error` vs `AppError` issue. The frontend must read `message` alongside `statusCode` when handling errors. For example, "Invalid credentials" will arrive as status 500.

---

## 12. Data Fetching Strategy

**Recommendation:** Use **TanStack Query (React Query)** for all client-side data fetching.

**Rationale:**
- The org dashboard, member list, and invitation list all need cache invalidation after mutations
- Session management page needs optimistic updates when revoking sessions
- Org switching means stale data for the previous org needs to be cleared
- Without React Query, manual loading/error state management becomes deeply repetitive

**Server vs. Client fetching:**

| Data | Strategy | Why |
|---|---|---|
| `/users/me` (auth check) | Server Component (layout) | Guards every protected page; runs before render |
| Org list | Client (React Query) | Changes dynamically; user can create orgs inline |
| Current org detail | Server (layout) | Needed to set up org context and breadcrumbs |
| Member list | Client (React Query) | Mutations (role change, remove) need cache invalidation |
| Invitation list | Client (React Query) | Mutations (invite, revoke) need cache invalidation |
| Sessions | Client (React Query) | Mutations (revoke session) need cache invalidation |

**Cache Keys:**
```ts
['organizations']
['organizations', orgId]
['organizations', orgId, 'members']
['organizations', orgId, 'invitations']
['sessions']
['me']
```

---

## 13. TypeScript Types (`src/types/api.ts`)

```ts
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

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: string;
};

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type Invitation = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  // status NOT returned by GET /invitations (backend issue)
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
```

---

## 14. Authorization in the Frontend

The backend is the **final authority**. The frontend uses role information only to show/hide UI elements.

### OrgProvider
Each org page layout fetches current user's membership and stores it in context:
```ts
type OrgContextValue = {
  org: Organization;
  membership: Membership;   // current user's membership in this org
  role: Role;
};
```

### usePermission Hook
```ts
function usePermission(permission: Permission): boolean {
  const { role } = useOrgContext();
  return rolePermissions[role].includes(permission);
}
```

### Frontend Permission → Role Mapping (mirror of backend)
```ts
const rolePermissions: Record<Role, Permission[]> = {
  OWNER: ['organization:read','organization:update','organization:delete',
          'member:read','member:update-role','member:remove',
          'invitation:read','invitation:create','invitation:delete'],
  ADMIN: ['organization:read',
          'member:read','member:update-role','member:remove',
          'invitation:read','invitation:create','invitation:delete'],
  MEMBER: ['organization:read','member:read'],
};
```

### Usage Examples
```tsx
// Hide edit button for non-OWNER
const canUpdate = usePermission('organization:update');
{canUpdate && <Button>Edit Organization</Button>}

// Hide invitations tab for MEMBER
const canReadInvitations = usePermission('invitation:read');
{canReadInvitations && <NavLink href="invitations">Invitations</NavLink>}
```

---

## 15. Page-by-Page Design

### `/register`
- **Components:** `RegisterForm` (name, email, password inputs)
- **Mutation:** `POST /auth/register`
- **On success:** Show success toast → redirect to `/verify-email?email=...`
- **Errors:** Show field-level validation errors

### `/verify-email`
- **Components:** `OtpForm` (email pre-filled from query param, 6-digit OTP input)
- **Mutation:** `POST /auth/verify-email`
- **On success:** Redirect to `/login` with success toast

### `/login`
- **Components:** `LoginForm` (email, password)
- **Mutation:** `POST /auth/login`
- **On success:** Store `{ id, email }` in auth context → redirect to `/dashboard`
- **Error note:** Backend returns 500 for "Invalid credentials" — display `message` from error body

### `/dashboard`
- **Data:** `GET /organizations`
- **Components:** `OrgCard` grid, `CreateOrgDialog` (form with org name)
- **Empty state:** "No organizations yet — create your first one"
- **Mutation:** `POST /organizations` → invalidate `['organizations']`

### `/organizations/[orgId]`
- **Data:** `GET /organizations/:id`
- **Components:** Org name, slug display; `EditOrgForm`; `DeleteOrgDialog`
- **Permission-gated UI:**
  - Edit form: OWNER only
  - Delete button: OWNER only
- **On delete:** Redirect to `/dashboard`

### `/organizations/[orgId]/members`
- **Data:** `GET /organizations/:id/members`
- **Problem:** Backend only returns `userId`, not `name`/`email`. **Workaround:** For each member, call `GET /organizations/:id/members/:memberId`. This is N+1 — document as a backend limitation; display userId if name unavailable.
- **Components:** `MemberTable` (columns: User, Role, Actions), `RoleSelect`, `RemoveMemberDialog`, `LeaveOrgButton`
- **Permission-gated actions:**
  - Role change dropdown: OWNER/ADMIN
  - Remove button: OWNER/ADMIN
  - Leave button: always shown (for self)

### `/organizations/[orgId]/invitations`
- **Access guard:** Redirect MEMBER role to org page (no `invitation:read` permission)
- **Data:** `GET /organizations/:id/invitations`
- **Components:** `InviteForm` (email, role select), `InvitationTable` (email, role, expires, actions), `RevokeInvitationDialog`
- **Note:** Status column will be missing (backend limitation). Show "Pending" for all displayed invitations.
- **Mutation:** `POST /invitations` → invalidate `['organizations', orgId, 'invitations']`

### `/settings/profile`
- **Data:** `GET /users/me`
- **Components:** Profile card with name edit, email display (read-only)
- **Mutation:** `PATCH /users/me { name }` → update auth context name

### `/settings/security`
- **Data:** `GET /sessions`
- **Components:** `SessionCard` (device/browser from userAgent, IP, creation date), revoke button, "Revoke All" button
- **Highlight current session** (match `sessionId` from JWT if accessible — not possible since cookies are HttpOnly. Show all sessions without highlighting.)

### `/settings/danger`
- **Components:** `DeleteAccountDialog` with confirmation input
- **Mutation:** `DELETE /users/me` → logout → redirect to `/`

### `/invitations/[token]/accept`
- **Server Component** — extract token from URL
- **Mutation:** `POST /invitations/:token/accept`
- **On success:** Show success state → link to dashboard
- **On error:** Show error (expired, wrong email, already accepted)

### `/invitations/[token]/reject`
- Same pattern as accept with reject mutation

---

## 16. State Management

| State | Location | Tool |
|---|---|---|
| Auth user (id, email) | Global | React Context (`AuthProvider`) |
| Current org + membership | Per-org layout | React Context (`OrgProvider`) |
| Server data (orgs, members, etc.) | Component-level | TanStack Query |
| Form state | Form component | React Hook Form + Zod |
| UI state (modals, toasts) | Component-level | Local `useState` |

---

## 17. Security Considerations for Frontend

1. **Never store tokens in localStorage** — cookies are HttpOnly, this is already enforced by the backend
2. **Never trust client-side role checks for security** — permission checks hide UI only; backend enforces access
3. **CSRF:** `sameSite: "lax"` on cookies provides basic CSRF protection. No additional CSRF token needed for same-site requests. For cross-origin, the backend must add CORS + `sameSite: "none"` + CSRF tokens.
4. **Invitation token** — the raw 64-char hex token appears in the URL (`/invitations/:token/accept`). The backend hashes it before storage. Users must not share invitation links carelessly.
5. **Sensitive data in query params** — do not put email or OTP in URL query params. Use `sessionStorage` or form state to pass email to the verify-email page.

---

## 18. Backend → Frontend Feature Mapping

| Backend Feature | Frontend Feature |
|---|---|
| `POST /auth/register` | `/register` page |
| `POST /auth/verify-email` | `/verify-email` page |
| `POST /auth/login` | `/login` page |
| `POST /auth/refresh` | Transparent token refresh in API client |
| `GET /users/me` | Auth state initialization + profile page |
| `PATCH /users/me` | Profile settings page |
| `DELETE /users/me` | Danger zone settings |
| `GET /organizations` | Dashboard org list |
| `POST /organizations` | Create org dialog |
| `GET /organizations/:id` | Org detail page |
| `PATCH /organizations/:id` | Org settings (OWNER only) |
| `DELETE /organizations/:id` | Delete org (OWNER only) |
| `GET /members` | Members page table |
| `PATCH /members/:id` | Role change dropdown |
| `DELETE /members/me` | Leave org button |
| `DELETE /members/:id` | Remove member button |
| `GET /invitations` | Invitations page table |
| `POST /invitations` | Invite member form |
| `DELETE /invitations/:id` | Revoke invitation |
| `POST /invitations/:token/accept` | Accept invitation page |
| `POST /invitations/:token/reject` | Reject invitation page |
| `GET /sessions` | Security settings — sessions list |
| `DELETE /sessions/:id` | Revoke single session |
| `DELETE /sessions` | Revoke all sessions (also used as logout workaround) |
| `GET /health` | Optional status indicator in admin footer |

---

## 19. Implementation Plan

### Phase 1 — Foundation
- [ ] Initialize Next.js 15 project (App Router, TypeScript, Tailwind CSS)
- [ ] Create `src/lib/api-client.ts` with 401 refresh-retry logic
- [ ] Create all API functions in `src/lib/api/`
- [ ] Define all TypeScript types in `src/types/api.ts`
- [ ] Set up TanStack Query provider
- [ ] Set up AuthProvider with `getMe()` initialization

### Phase 2 — Auth Pages
- [ ] `/register` with `RegisterForm` + Zod + React Hook Form
- [ ] `/verify-email` with `OtpForm`
- [ ] `/login` with `LoginForm`
- [ ] Protected layout (server-side auth check)

### Phase 3 — Dashboard & Organizations
- [ ] `/dashboard` — org list with create dialog
- [ ] `/organizations/[orgId]` — org detail, edit, delete
- [ ] OrgProvider with current membership context

### Phase 4 — Members & RBAC
- [ ] `/organizations/[orgId]/members` — member table, role update, remove
- [ ] Permission-gated UI using `usePermission`

### Phase 5 — Invitations
- [ ] `/organizations/[orgId]/invitations` — invitation table, create, revoke
- [ ] `/invitations/[token]/accept` and `/reject` pages

### Phase 6 — Settings
- [ ] `/settings/profile` — name edit
- [ ] `/settings/security` — sessions management
- [ ] `/settings/danger` — account deletion

### Phase 7 — Polish
- [ ] Loading skeletons for all data-fetching states
- [ ] Empty states for org list, member list, invitation list
- [ ] Error boundaries
- [ ] Toast notifications for all mutations
- [ ] Responsive mobile layout

---

## 20. Open Questions for Backend (Not Addressed by Current Code)

1. **Logout endpoint** — Is `/auth/logout` planned? Without it, the frontend workaround (delete all sessions) leaves the HttpOnly cookie in the browser until expiry.
2. **Member name in member list** — Should `GET /members` join user data? Currently only `userId` is returned.
3. **Invitation status** — Should `GET /invitations` return `status`? Currently omitted from the select clause.
4. **CORS configuration** — Required before any frontend can consume this API cross-origin with cookies.
5. **Frontend invitation URL** — The `invitationUrl` is hardcoded to `http://localhost:5000`. Should it point to the frontend app URL?
6. **Email verification on resend** — There is no `POST /auth/resend-otp` endpoint. Users cannot request a new OTP if the original expires.

---

## 21. Approved Technology Stack

The following packages are approved for building the frontend. Do not introduce any package not listed here without explicit discussion.

| Package | Version | Role | Why |
|---|---|---|---|
| `next` | 15 (App Router) | Framework | Server + client components, file-based routing, built-in SSR |
| `typescript` | 5+ | Language | End-to-end type safety with backend response types |
| `tailwindcss` | 4 | Styling | Utility-first CSS; co-located with JSX, no CSS files needed |
| `shadcn/ui` | latest | UI components | Accessible, unstyled-by-default Radix primitives + Tailwind; copy-paste into project |
| `@tanstack/react-query` | 5 | Data fetching | Caching, background refetch, mutation + cache invalidation, loading/error states |
| `react-hook-form` | 7 | Forms | Performant uncontrolled forms; minimal re-renders; pairs perfectly with Zod |
| `zod` | 4 | Validation | Mirror backend Zod schemas on the client; validate forms before submission |
| `lucide-react` | latest | Icons | Tree-shakeable SVG icon set; already used in most shadcn/ui examples |
| `sonner` | latest | Toasts | Lightweight toast library; one `<Toaster />` in root layout; call `toast.success/error()` anywhere |
| `date-fns` | 4 | Dates | Format `createdAt`, `expiresAt` timestamps returned by the API |
| `clsx` | latest | Class merging | Conditionally combine class names |
| `tailwind-merge` | latest | Class merging | Merge conflicting Tailwind classes safely (used in `cn()` utility) |

### `cn()` utility

Every component should import this helper instead of raw `clsx`:

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### shadcn/ui components to install

Install only what is needed per feature. Recommended starting set:

```
npx shadcn@latest add button input label form card dialog
  alert-dialog badge table dropdown-menu separator avatar
  skeleton tooltip popover select tabs
```

### Integration notes

- **React Hook Form + Zod:** use `@hookform/resolvers/zod` to connect a Zod schema directly to a `useForm` call — no manual error mapping needed
- **TanStack Query + API client:** wrap every API function (`src/lib/api/*.ts`) in `useQuery` / `useMutation`; never call `fetch` directly inside components
- **Sonner:** call `toast.success(message)` / `toast.error(message)` inside `onSuccess` / `onError` callbacks of `useMutation`
- **date-fns:** use `format(new Date(dateString), 'MMM d, yyyy')` for all displayed timestamps
- **clsx + tailwind-merge:** always use the `cn()` utility for className composition in components

---

## 22. Design System & Visual Theme

### Reference
The visual target is the design language used by **Cal.com** — clean, black-and-white, content-first, minimal. Every page should feel like it was designed by a human who cares about whitespace, not generated by a template.

---

### Core Principle
> **Restraint over decoration.** If you're about to add a gradient, a colored badge, a card shadow, or a rounded pill button — stop and ask whether a simple border or a weight change achieves the same result with less noise.

---

### Color Palette

Use Tailwind's default black/white/gray scale exclusively. Do not introduce any other hues (blue, green, purple, etc.) except for destructive actions.

| Token | Tailwind class | Hex | Use |
|---|---|---|---|
| Background | `bg-white` | `#ffffff` | Page background |
| Surface | `bg-gray-50` | `#f9fafb` | Sidebar, card backgrounds |
| Border | `border-gray-200` | `#e5e7eb` | All borders, dividers |
| Muted text | `text-gray-400` | `#9ca3af` | Placeholders, helper text, timestamps |
| Secondary text | `text-gray-500` | `#6b7280` | Labels, captions, metadata |
| Body text | `text-gray-900` | `#111827` | All primary readable text |
| Primary action | `bg-black text-white` | `#000000` | Primary buttons, active nav items |
| Hover state | `hover:bg-gray-100` | `#f3f4f6` | Button hover, row hover |
| Destructive | `text-red-600`, `bg-red-50` | — | Delete buttons, danger alerts only |
| Focus ring | `ring-1 ring-gray-900` | — | Focused inputs |

**No gradients. No colored backgrounds. No box-shadow beyond `shadow-sm`.**

---

### Typography

Use **Geist** (Next.js default) or **Inter** as the font. Load from Google Fonts or use the `next/font` module.

| Role | Class | Weight |
|---|---|---|
| Page title (h1) | `text-2xl tracking-tight` | `font-semibold` |
| Section heading (h2) | `text-lg` | `font-semibold` |
| Card/dialog title | `text-base` | `font-medium` |
| Body | `text-sm` | `font-normal` |
| Caption / meta | `text-xs` | `font-normal` |
| Code / slug | `font-mono text-xs` | — |

Rules:
- No `font-bold` on body text — use `font-medium` or `font-semibold` maximum
- No `text-3xl` or larger except on auth/marketing-style pages
- Letter-spacing: use `tracking-tight` on headings only
- Line height: default (`leading-normal`) everywhere; `leading-relaxed` for multi-line descriptions only

---

### Spacing & Layout

- **Sidebar width:** `w-64` (256px), fixed, left-aligned
- **Content padding:** `p-6` or `p-8` — be generous, do not pack content
- **Section gaps:** `space-y-6` between distinct sections; `space-y-2` between label and input
- **Max content width:** `max-w-3xl` for forms and settings; `max-w-5xl` for tables and lists
- **Card padding:** `p-4` or `p-6` — consistent across all cards

---

### Component Design Rules

#### Buttons
```
Primary:   bg-black text-white hover:bg-gray-800   px-4 py-2 text-sm font-medium rounded-md
Secondary: bg-white text-gray-900 border border-gray-200 hover:bg-gray-50   same sizing
Danger:    bg-white text-red-600 border border-red-200 hover:bg-red-50
Ghost:     bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900
```
- Border radius: `rounded-md` (6px) — not `rounded-full`, not `rounded-xl`
- No drop shadows on buttons
- Disabled state: `opacity-50 cursor-not-allowed`

#### Inputs
```
border border-gray-200 rounded-md px-3 py-2 text-sm
focus:outline-none focus:ring-1 focus:ring-gray-900
placeholder:text-gray-400
```
- Error state: `border-red-400 focus:ring-red-400`
- No colored background on inputs — always `bg-white`

#### Cards / Panels
```
border border-gray-200 rounded-lg bg-white p-6
```
- No `shadow-md` or higher — at most `shadow-sm` if elevation is needed
- No colored headers on cards

#### Tables
```
<table> with full-width, text-sm
<th>: text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-200
<tr>: hover:bg-gray-50 border-b border-gray-100
<td>: py-3 px-4 text-gray-900
```

#### Badges / Status chips
```
OWNER:  bg-gray-900 text-white        text-xs px-2 py-0.5 rounded-md font-medium
ADMIN:  bg-gray-100 text-gray-900     same
MEMBER: bg-gray-50  text-gray-500     same border border-gray-200
```
No colored badges (no blue, green, purple). Role hierarchy is communicated through fill contrast alone.

#### Modals / Dialogs
- Use shadcn/ui `Dialog` with default overlay `bg-black/40`
- Dialog content: `bg-white rounded-xl p-6 max-w-md`
- Destructive dialogs: red danger text inside, not a red header

#### Navigation (Sidebar)
```
Active item:   bg-gray-100 text-gray-900 font-medium rounded-md
Inactive item: text-gray-500 hover:bg-gray-50 hover:text-gray-900
Icon:          w-4 h-4 text-gray-400 (active: text-gray-900)
```

#### Empty States
- Single centered column: icon (Lucide, `w-8 h-8 text-gray-300`) + short heading (`font-medium text-gray-900`) + description (`text-sm text-gray-500`) + optional CTA button
- No illustrations, no colored backgrounds

#### Loading States
- Use `Skeleton` from shadcn/ui with `bg-gray-100 animate-pulse`
- Match the skeleton shape to the real content (table rows, card blocks) — not a generic spinner

---

### What NOT to Do

These patterns make a UI look AI-generated or template-heavy. **Avoid all of them:**

| ❌ Don't | ✅ Do instead |
|---|---|
| Gradient backgrounds (`from-blue-500 to-purple-600`) | Flat `bg-black` or `bg-white` |
| Colorful role badges (green for OWNER, blue for ADMIN) | Fill-contrast grayscale badges |
| Oversized hero text (`text-5xl`) in dashboard | `text-2xl` max, content-first |
| Box shadows on every card (`shadow-lg`) | Border only (`border border-gray-200`) |
| Rounded pill buttons (`rounded-full`) | `rounded-md` |
| Icon + label stacked in a centered card layout | Left-aligned, horizontal list layout |
| Progress bars for no reason | Plain text counts |
| Hover animations that scale/translate elements | Simple `bg-gray-50` color transition |
| Dark sidebars with colored accents | `bg-white` or `bg-gray-50` sidebar |
| Toast banners with colored backgrounds | Sonner default (black toast, white text) |

---

### Tailwind CSS Configuration (`tailwind.config.ts`)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],  // required by shadcn/ui
};

export default config;
```

---

### shadcn/ui Theme Override (`globals.css`)

Override shadcn/ui CSS variables to match the black-and-white palette:

```css
@layer base {
  :root {
    --background:    0 0% 100%;       /* white */
    --foreground:    0 0% 7%;         /* near-black */
    --card:          0 0% 100%;
    --card-foreground: 0 0% 7%;
    --border:        0 0% 90%;        /* gray-200 equivalent */
    --input:         0 0% 90%;
    --ring:          0 0% 7%;         /* focus ring = near-black */
    --primary:       0 0% 7%;         /* black buttons */
    --primary-foreground: 0 0% 100%;  /* white text on black */
    --secondary:     0 0% 96%;        /* gray-50 */
    --secondary-foreground: 0 0% 7%;
    --muted:         0 0% 96%;
    --muted-foreground: 0 0% 45%;     /* gray-500 equivalent */
    --accent:        0 0% 96%;
    --accent-foreground: 0 0% 7%;
    --destructive:   0 84% 60%;       /* red-500 */
    --destructive-foreground: 0 0% 100%;
    --radius: 0.375rem;               /* rounded-md = 6px */
  }
}
```
