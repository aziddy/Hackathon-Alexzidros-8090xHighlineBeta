# How GitHub User Authentication Works

This document explains how GitHub OAuth authentication is implemented in the DevFlow application, covering the initial authentication flow, token storage, and how authentication is used for GitHub API requests.

## Overview

DevFlow uses **NextAuth.js (Auth.js v5)** with the GitHub OAuth provider for user authentication. The architecture combines:
- **JWT sessions** for session management
- **Prisma adapter** with SQLite for persistent token storage
- **Octokit** for authenticated GitHub API calls

## 1. Initial First-Time Flow for a User

When a user first authenticates with GitHub, they go through the following OAuth flow:

### Step-by-Step Authentication Process

1. **User Visits Login Page**
   - Location: [/login](../src/app/login/page.tsx)
   - User sees "Sign in with GitHub" button
   - UI explains that repository access is needed

2. **OAuth Initiation**
   - User clicks "Sign in with GitHub"
   - Client calls `signIn("github", { callbackUrl: "/dashboard" })`
   - User is redirected to GitHub's OAuth consent screen

3. **GitHub Authorization**
   - GitHub displays OAuth consent screen
   - Requested scopes: `read:user user:email repo`
   - User authorizes the DevFlow application

4. **OAuth Callback**
   - GitHub redirects to: `/api/auth/callback/github`
   - Location: [/api/auth/[...nextauth]/route.ts](../src/app/api/auth/[...nextauth]/route.ts)
   - NextAuth exchanges authorization code for access token

5. **Token Storage**
   - **PrismaAdapter** stores OAuth credentials in the database
   - Account record created with:
     - `access_token`: GitHub access token
     - `refresh_token`: Refresh token (if provided)
     - `provider`: "github"
     - `scope`: "read:user user:email repo"
     - `expires_at`: Token expiration timestamp

6. **Session Creation**
   - JWT session created containing user ID
   - No sensitive data stored in JWT (only user ID)
   - Session token sent to client as HTTP-only cookie

7. **Redirect to Dashboard**
   - User redirected to `/dashboard`
   - Middleware verifies authentication status
   - User can now access protected routes

### Configuration Files

**Auth Configuration** - [src/lib/auth.config.ts](../src/lib/auth.config.ts):
```typescript
GitHub({
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  authorization: {
    params: {
      scope: "read:user user:email repo",
    },
  },
})
```

**Environment Variables** (`.env.local`):
```env
AUTH_SECRET="your-generated-secret-here"
AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 2. How Auth is Stored

DevFlow uses a **hybrid storage approach**: JWT sessions for session management + database persistence for OAuth tokens.

### Database Schema

**Account Model** - [prisma/schema.prisma](../../prisma/schema.prisma):
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String                    // "github"
  providerAccountId String
  refresh_token     String?                   // GitHub refresh token
  access_token      String?                   // GitHub access token (STORED HERE)
  expires_at        Int?                      // Token expiration timestamp
  token_type        String?                   // "bearer"
  scope             String?                   // "read:user user:email repo"
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

### Storage Architecture

**NextAuth Configuration** - [src/lib/auth.ts](../src/lib/auth.ts):
```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),  // Database persistence
  session: { strategy: "jwt" },     // JWT session strategy
  providers: [GitHub],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;          // Add user ID to JWT
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;  // Add user ID to session
      return session;
    },
  },
})
```

### What Gets Stored Where

| Data | Storage Location | Purpose |
|------|-----------------|---------|
| `access_token` | Database (Account table) | Used for GitHub API calls |
| `refresh_token` | Database (Account table) | Token refresh (if needed) |
| `user.id` | JWT session cookie | Session identification |
| `scope` | Database (Account table) | OAuth permissions granted |
| `expires_at` | Database (Account table) | Token expiration tracking |

**Key Points:**
- Access tokens are **NOT** stored in JWT sessions (more secure)
- Each API request retrieves the token from the database
- SQLite database file: `./dev.db`
- One Account record per user per OAuth provider

### Route Protection

**Middleware** - [src/middleware.ts](../src/middleware.ts):
```typescript
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Authorization Callback** - [src/lib/auth.config.ts](../src/lib/auth.config.ts):
- Protects `/dashboard/*` routes (requires login)
- Redirects authenticated users away from `/login`
- Custom sign-in page: `/login`

## 3. How Auth is Used for Subsequent GitHub API Requests

Every GitHub API request follows a consistent authentication pattern:

### Token Retrieval Pattern

Used in all API routes that interact with GitHub:

```typescript
// Step 1: Get current user session (JWT-based)
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Step 2: Query database for GitHub account and access token
const account = await prisma.account.findFirst({
  where: {
    userId: session.user.id,
    provider: "github",
  },
});

// Step 3: Verify token exists
if (!account?.access_token) {
  return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
}

// Step 4: Create authenticated GitHub client
const octokit = createOctokit(account.access_token);

// Step 5: Make GitHub API calls
const repos = await fetchUserRepos(octokit);
```

### Octokit Client Creation

**GitHub Client Factory** - [src/lib/github.ts](../src/lib/github.ts):
```typescript
import { Octokit } from "@octokit/rest";

export function createOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken,
  });
}
```

### API Routes Using GitHub Authentication

Here are the main API routes that use GitHub authentication:

| Route | Purpose | File |
|-------|---------|------|
| `/api/github/repos` | Fetch user repositories | [api/github/repos/route.ts](../src/app/api/github/repos/route.ts) |
| `/api/chat` | AI chat with GitHub actions | [api/chat/route.ts](../src/app/api/chat/route.ts) |
| `/api/chat/execute-github-action` | Execute confirmed GitHub actions | [api/chat/execute-github-action/route.ts](../src/app/api/chat/execute-github-action/route.ts) |
| `/api/projects/[id]/sync` | Sync issues and PRs from GitHub | [api/projects/[projectId]/sync/route.ts](../src/app/api/projects/[projectId]/sync/route.ts) |
| `/api/issues/[id]/check-status` | Check issue status via GitHub | [api/issues/[issueId]/check-status/route.ts](../src/app/api/issues/[issueId]/check-status/route.ts) |
| `/api/issues/[id]/steps/[id]/check` | Check step completion via GitHub | [api/issues/[issueId]/steps/[stepId]/check/route.ts](../src/app/api/issues/[issueId]/steps/[stepId]/check/route.ts) |

### GitHub API Wrapper Functions

**Core GitHub Functions** - [src/lib/github.ts](../src/lib/github.ts):
- `fetchUserRepos(octokit)` - Get user's repositories
- `fetchRepoIssues(octokit, owner, repo)` - Get repository issues
- `fetchRepoPRs(octokit, owner, repo)` - Get pull requests
- `findLinkedPR(issueNumber, prs)` - Find PR linked to issue
- `fetchWorkflowRuns(octokit, owner, repo, branch)` - Get CI/CD runs
- `checkPRMerged(octokit, owner, repo, prNumber)` - Check PR merge status
- `fetchPRReviews(octokit, owner, repo, prNumber)` - Get PR reviews

**GitHub Actions Library** - [src/lib/github-actions.ts](../src/lib/github-actions.ts):

Provides comprehensive GitHub operations for the AI chat feature:
- `createIssue()` - Create GitHub issue
- `addComment()` - Add comment to issue/PR
- `createBranch()` - Create and optionally link branch
- `createPR()` - Create pull request
- `linkBranch()` - Link existing branch to issue (GraphQL)
- `getLinkedBranches()` - Get branches linked to issue (GraphQL)
- `listBranches()` - List repository branches
- `listRepos()` - List user repositories
- `listIssues()` - List repository issues
- `listPRs()` - List repository pull requests
- `checkWorkflow()` - Check CI/CD workflow status

### Authentication Flow Diagram

```
┌─────────────────┐
│   API Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  1. auth() - Get Session    │
│     (JWT from cookie)       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  2. Query Database          │
│     WHERE userId = ?        │
│     AND provider = 'github' │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  3. Extract access_token    │
│     from Account record     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  4. createOctokit(token)    │
│     Create authenticated    │
│     GitHub client           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  5. Make GitHub API Call    │
│     using Octokit client    │
└─────────────────────────────┘
```

## Security Considerations

### Current Implementation

1. **Token Storage**: Access tokens stored in plaintext in SQLite database
2. **Session Security**: JWT sessions use HTTP-only cookies
3. **OAuth Scopes**: Full repository access (`repo` scope)
4. **Token Validation**: Checked on every API request
5. **Route Protection**: Middleware validates authentication for `/dashboard/*` routes

### Best Practices Applied

- Tokens never stored in JWT sessions
- Tokens never sent to client
- Session cookies are HTTP-only
- Each request validates authentication
- Database access restricted by user ID

## Client-Side Session Management

**Session Provider** - [src/components/providers.tsx](../src/components/providers.tsx):
```typescript
import { SessionProvider } from "next-auth/react";

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

**Using Session in Components**:
```typescript
import { useSession, signOut } from "next-auth/react";

function Header() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return (
    <div>
      <img src={session.user.image} alt={session.user.name} />
      <button onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </button>
    </div>
  );
}
```

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next-auth` | 5.0.0-beta.30 | Authentication framework |
| `@auth/prisma-adapter` | 2.11.1 | Prisma integration |
| `@octokit/rest` | 22.0.1 | GitHub API client |
| `@prisma/client` | 6.19.2 | Database ORM |

## Summary

DevFlow's GitHub authentication system follows this pattern:

1. **Login**: OAuth flow with GitHub → store tokens in database → create JWT session
2. **Storage**: Access tokens in SQLite (Account table) + User ID in JWT session
3. **API Calls**: Retrieve token from database → create Octokit client → make authenticated requests

This architecture keeps sensitive tokens secure in the database while maintaining fast session lookups via JWT.
