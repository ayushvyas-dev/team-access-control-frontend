# TeamAccess — Frontend

Frontend for TeamAccess, a team and organization access control application. Built with Next.js 16 (App Router) and React 19.

The backend API lives in a separate repository (`team-access-control-api`) and handles authentication, organization management, RBAC, invitations, sessions, and audit logging.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | App Router, file-based routing, server/client components |
| **React 19** | UI rendering |
| **TypeScript** | Type safety across the codebase |
| **Tailwind CSS 4** | Utility-first styling |
| **TanStack Query** | Server state management, caching, and data fetching |
| **React Hook Form + Zod** | Form handling with schema-based validation |
| **shadcn/ui** (Base UI) | Accessible UI primitives (dialog, select, dropdown, table, etc.) |
| **Sonner** | Toast notifications |
| **Lucide React** | Icons |

## Architecture

The project uses a **feature-based** structure. Each domain (auth, organizations, members, invitations, sessions, audit-logs) has its own directory under `src/features/` containing colocated components and hooks.

```
src/
├── app/                          # Next.js App Router (pages + layouts)
│   ├── (auth)/                   # Auth route group (login, register, verify-email)
│   ├── (dashboard)/              # Authenticated route group
│   │   ├── dashboard/            # Main dashboard (org list + pending invitations)
│   │   ├── invitations/          # Full pending invitations page
│   │   ├── organizations/[orgId]/ # Org detail with nested layout
│   │   │   ├── audit-logs/
│   │   │   ├── invitations/
│   │   │   └── members/
│   │   └── settings/             # User settings (profile, security, account)
│   └── invitations/[token]/      # Public accept/reject invitation pages
│
├── components/
│   ├── layout/                   # Sidebar, Header
│   ├── shared/                   # ConfirmDialog, EmptyState, ErrorState, LoadingSpinner
│   └── ui/                       # shadcn/ui primitives
│
├── features/                     # Feature modules
│   ├── audit-logs/               # components/ + hooks/
│   ├── auth/                     # LoginForm, RegisterForm, OtpForm + hooks
│   ├── invitations/              # InviteForm, InvitationTable, PendingInvitationsSection + hooks
│   ├── members/                  # MemberTable, MemberActions, MemberRoleBadge + hooks
│   ├── organizations/            # OrgCard, CreateOrgDialog, OrgForm, OrgDeleteDialog + hooks
│   └── sessions/                 # SessionCard, SessionList + hooks
│
├── hooks/                        # Shared hooks (useAuth, usePermission)
├── lib/
│   ├── api/                      # API functions per resource (auth, users, organizations, etc.)
│   ├── api-client.ts             # Fetch wrapper with 401/refresh interceptor
│   └── utils.ts                  # cn(), date formatting helpers
│
├── providers/                    # React context providers
│   ├── AuthProvider.tsx           # Auth state (user, login/logout, token refresh)
│   ├── OrgProvider.tsx            # Current org + membership context
│   └── QueryProvider.tsx          # TanStack Query client
│
├── schemas/                      # Zod validation schemas for forms
└── types/                        # TypeScript types (API types, permission matrix)
```

### Data Flow

1. **API Client** (`lib/api-client.ts`) — A thin `fetch` wrapper. All requests include `credentials: "include"` (cookies). On 401, it attempts a token refresh and retries the original request once.
2. **API Functions** (`lib/api/*.ts`) — Typed functions per resource. Each calls `apiClient` and returns typed data.
3. **Hooks** (`features/*/hooks/`) — TanStack Query `useQuery`/`useMutation` hooks wrapping the API functions. Handle cache invalidation and toast notifications.
4. **Components** — Consume hooks. Forms use React Hook Form with Zod resolvers.

### State Management

- **Server state**: TanStack Query. Cache keys follow a consistent pattern: `['organizations']`, `['organizations', orgId]`, `['organizations', orgId, 'members']`, etc.
- **Auth state**: React Context via `AuthProvider`. Initializes by calling `GET /users/me`. Exposes `user`, `isAuthenticated`, `isLoading`, `setUser`, `logout`, `refreshUser`.
- **Org context**: `OrgProvider` provides the current organization and membership to child routes.
- **Form state**: React Hook Form with Zod schemas. Local to each form component.
- **UI state**: `useState` for modals, confirmations, filters, pagination.

## Features

### Authentication
- Registration with email verification (6-digit OTP)
- Login/logout
- Auth layout redirects authenticated users away from login/register

### Organizations
- Dashboard showing all organizations as a card grid
- Create, rename, and delete organizations
- Organization detail page with tabbed navigation (Overview, Members, Invitations, Audit Logs)

### Members
- Member list with role badges (Owner, Admin, Member)
- Role changes via inline select (Owner/Admin only)
- Remove members (Owner/Admin only)
- Leave organization

### Invitations
- Send invitations by email with role selection
- View and revoke pending invitations within an org (Owner/Admin only)
- Dedicated page listing all invitations sent to the current user
- Accept/reject invitations (inline or via token-based URLs)
- Pending invitations section on the dashboard

### Audit Logs
- Paginated activity history per organization (Owner/Admin only)
- Filterable by action type and resource type
- Shows actor name/email, action, resource type, and timestamp

### Sessions
- View all active sessions with device info and IP
- Revoke individual sessions or all sessions at once

### Settings
- **Profile**: Update display name (email shown but not editable)
- **Security**: Session management
- **Account**: Delete account

## Authentication & Authorization

### Auth Mechanism

The backend uses **dual HttpOnly cookies** (`accessToken` + `refreshToken`). The frontend never touches tokens directly — cookies are sent automatically via `credentials: "include"`.

### Token Refresh

The API client (`lib/api-client.ts`) intercepts 401 responses and attempts `POST /auth/refresh`. If refresh succeeds, the original request is retried. If it fails, the user is redirected to `/login`. A mutex prevents concurrent refresh attempts.

### Route Protection

- **Auth layout** (`(auth)/layout.tsx`): Client component that redirects to `/dashboard` if already authenticated.
- **Dashboard layout** (`(dashboard)/layout.tsx`): Client component that redirects to `/login` if not authenticated.

### RBAC

Permission checks happen client-side via `usePermission(permission)`, which reads the current user's role from `OrgProvider` and checks it against a static permission matrix in `types/permissions.ts`.

| Permission | Owner | Admin | Member |
|---|:---:|:---:|:---:|
| `organization:update` | ✓ | | |
| `organization:delete` | ✓ | | |
| `member:update-role` | ✓ | ✓ | |
| `member:remove` | ✓ | ✓ | |
| `invitation:read` | ✓ | ✓ | |
| `invitation:create` | ✓ | ✓ | |
| `invitation:delete` | ✓ | ✓ | |
| `audit-log:read` | ✓ | ✓ | |

UI elements (tabs, buttons, forms) are conditionally rendered based on these permissions.

## API Integration

The frontend communicates with a REST backend at `http://localhost:5000/api/v1` by default. This is configurable via the `NEXT_PUBLIC_API_URL` environment variable.

API functions are organized by resource in `src/lib/api/`:

| File | Endpoints |
|---|---|
| `auth.ts` | `register`, `verifyEmail`, `login`, `refresh` |
| `users.ts` | `getMe`, `updateMe`, `deleteMe` |
| `organizations.ts` | CRUD for organizations |
| `members.ts` | List, get, update role, remove, leave |
| `invitations.ts` | List (org + user-facing), create, delete, accept, reject |
| `sessions.ts` | List, revoke one, revoke all |
| `audit-logs.ts` | List with pagination and filtering |

## Project Setup

### Prerequisites

- Node.js 18+
- npm
- The [backend API](https://github.com/ayushvyas-dev/team-access-control-api) running (defaults to `http://localhost:5000`)

### Installation

```bash
git clone https://github.com/ayushvyas-dev/team-access-control-frontend.git
cd team-access-control-frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:5000/api/v1` | Backend API base URL |

No `.env` file is included in the repo. Create one if you need to override the default:

```bash
echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1' > .env.local
```

## Development Notes

- **UI components** are from shadcn/ui (built on Base UI / `@base-ui/react`). To add new ones, use `npx shadcn add <component>`.
- **Font**: Geist Sans and Geist Mono, loaded via `next/font/google`.
- **Design system**: Minimal black/white/gray palette. Destructive actions use red accents. All forms share consistent spacing and error styling.
- **Error handling**: API errors are caught as `ApiError` instances with `statusCode` and `message`. Mutations show toast notifications on success/failure.
- **Cache invalidation**: Mutations invalidate related query keys after success (e.g., creating an org invalidates `['organizations']`).
- **Path alias**: `@/*` maps to `./src/*`.
