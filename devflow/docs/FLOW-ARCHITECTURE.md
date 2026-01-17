# DevFlow Application Architecture

## Overview

DevFlow is a developer workflow management tool that integrates with GitHub to track issues and break them down into atomic, verifiable steps. It uses AI to generate step sequences and provides both a web dashboard and IDE integration via MCP.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.3 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite + Prisma ORM |
| Authentication | NextAuth.js v5 (GitHub OAuth) |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| AI | Cerebras Cloud SDK (llama-3.3-70b) |
| GitHub API | Octokit REST |
| IDE Integration | Model Context Protocol (MCP) |
| Animations | Framer Motion |

---

## Project Structure

```
devflow/src/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API routes
│   │   ├── ai/generate-steps/    # AI step generation
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── github/repos/         # GitHub repo listing
│   │   ├── issues/[issueId]/     # Issue & step management
│   │   ├── mcp/                  # MCP/IDE integration
│   │   └── projects/             # Project CRUD
│   ├── dashboard/                # Main application
│   ├── login/                    # Authentication
│   ├── layout.tsx                # Root layout + providers
│   └── page.tsx                  # Landing page
├── components/
│   ├── issues/                   # Issue & step components
│   ├── kanban/                   # Kanban board UI
│   ├── layout/                   # Header, sidebar, theme
│   ├── projects/                 # Project selector
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── cerebras.ts               # AI step generation
│   ├── github.ts                 # GitHub API client
│   ├── prisma.ts                 # Database client
│   └── utils.ts                  # Helpers
├── types/                        # TypeScript definitions
├── mcp/                          # MCP server for IDE
└── middleware.ts                 # Route protection
```

---

## Data Models

### Entity Relationship

```
User (1) ─────────── (*) Project
                           │
                           │ (1)
                           │
                           ▼
                      (*) Issue
                           │
                           │ (1)
                           │
                           ▼
                    (*) AtomicStep
```

### Core Models

**User** - NextAuth account
- Links to GitHub OAuth identity
- Owns multiple projects

**Project** - GitHub repository reference
- Stores `githubRepoOwner`, `githubRepoName`, `githubRepoId`
- Syncs issues from GitHub
- Tracks `lastSyncedAt` timestamp

**Issue** - GitHub issue tracking
- Status: `TODO` | `IN_PROGRESS` | `IN_REVIEW` | `DONE`
- Stores GitHub metadata (number, URL, labels, assignees)
- Links to PRs via `linkedPrNumber`, `linkedPrUrl`, `linkedPrState`
- Tracks `progressPercent` based on completed steps

**AtomicStep** - Individual workflow step
- Types: `CODE`, `TEST`, `RUN_TESTS`, `COMMIT`, `CREATE_PR`, `REQUEST_REVIEW`, `ADDRESS_COMMENTS`, `GET_APPROVAL`, `MERGE`, `DEPLOY`, `CLOSE_ISSUE`, `CUSTOM`
- Status: `PENDING` | `IN_PROGRESS` | `COMPLETED` | `BLOCKED` | `SKIPPED`
- Verification: `manual` | `github_api` | `mcp`

---

## Application Flow

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. AUTHENTICATION                                               │
│     User → GitHub OAuth → Session Created → Dashboard Access     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. PROJECT SETUP                                                │
│     Select GitHub Repo → Create Project → Store in Database      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ISSUE SYNC                                                   │
│     Fetch GitHub Issues → Fetch PRs → Link PRs → Upsert to DB    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. STEP GENERATION                                              │
│     Issue Selected → AI Generates Steps → Steps Stored in DB     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. STEP TRACKING                                                │
│     Manual Checkbox │ GitHub API Check │ MCP Report → Update DB  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. PROGRESS CALCULATION                                         │
│     Count Completed / Total → Update progressPercent → UI Update │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│  GitHub  │────▶│ Callback │────▶│Dashboard │
│  Page    │     │  OAuth   │     │  Handler │     │  (Auth)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │   Database   │
                                 │  - Account   │
                                 │  - Session   │
                                 │  - User      │
                                 └──────────────┘
```

1. User clicks "Sign in with GitHub"
2. Redirects to GitHub OAuth consent
3. GitHub redirects back with authorization code
4. NextAuth exchanges code for access token
5. Token stored in `Account` table
6. Session created, user redirected to dashboard

### GitHub Sync Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│  Fetch via  │────▶│   Process   │
│  Sync Btn   │     │   Octokit   │     │  & Link PRs │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        UPSERT LOGIC                              │
│  - Match by githubIssueId                                        │
│  - Auto-set status: merged PR → DONE, open PR → IN_REVIEW        │
│  - Store PR metadata (number, URL, state)                        │
│  - Update lastSyncedAt                                           │
└─────────────────────────────────────────────────────────────────┘
```

### AI Step Generation Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Issue     │────▶│   Cerebras   │────▶│    Parse     │
│   Context    │     │    API       │     │    JSON      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │  title, body, labels                    │  steps array
       │                                         ▼
       │                                  ┌──────────────┐
       │                                  │   Database   │
       │                                  │  - Delete    │
       │                                  │    old steps │
       │                                  │  - Create    │
       │                                  │    new steps │
       └─────────────────────────────────▶└──────────────┘
```

**AI System Prompt:**
- Generate 5-10 atomic, verifiable steps
- Use specific step types (CODE, TEST, CREATE_PR, etc.)
- Each step must be independently verifiable
- Fallback to default sequence on failure

### Step Verification Methods

| Method | Trigger | How It Works |
|--------|---------|--------------|
| **Manual** | Checkbox click | User marks step complete |
| **GitHub API** | "Check" button | Validates via GitHub API |
| **MCP** | IDE reports | IDE sends completion signal |

**GitHub API Verification Types:**
- `CREATE_PR` → Search for linked PR
- `REQUEST_REVIEW` → Count PR reviews
- `GET_APPROVAL` → Find approved reviews
- `MERGE` → Check if PR merged
- `DEPLOY` → Check workflow run status
- `CLOSE_ISSUE` → Verify issue closed

---

## API Routes

### Authentication
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js handler |

### Projects
| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects` | GET | List user's projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/[projectId]/sync` | POST | Sync from GitHub |
| `/api/projects/[projectId]/issues` | GET | Get project issues |

### Issues & Steps
| Route | Method | Description |
|-------|--------|-------------|
| `/api/issues/[issueId]/steps` | GET | Get issue steps |
| `/api/issues/[issueId]/steps` | PATCH | Update step status |
| `/api/issues/[issueId]/steps/[stepId]` | PATCH | Update specific step |
| `/api/issues/[issueId]/check-status` | POST | Verify via GitHub |

### AI
| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/generate-steps` | POST | Generate atomic steps |

### GitHub
| Route | Method | Description |
|-------|--------|-------------|
| `/api/github/repos` | GET | List user's repositories |

### MCP Integration
| Route | Method | Description |
|-------|--------|-------------|
| `/api/mcp/issue-steps` | GET | Get steps (for IDE) |
| `/api/mcp/active-issues` | GET | List active issues |
| `/api/mcp/report-step` | POST | Report step completion |

---

## Component Architecture

### Page Hierarchy

```
layout.tsx
├── Providers (NextAuth, Theme)
│
├── page.tsx (Landing - unauthenticated)
│
├── login/page.tsx
│   └── GitHub Sign In Button
│
└── dashboard/page.tsx
    ├── Header
    │   ├── Logo
    │   ├── Sync Button
    │   └── UserMenu (Avatar, Theme, Logout)
    │
    ├── ProjectSelector
    │   ├── Dropdown (existing projects)
    │   └── AddProjectModal
    │       └── GitHub Repo Search
    │
    └── KanbanBoard
        ├── KanbanColumn (TODO)
        ├── KanbanColumn (IN_PROGRESS)
        ├── KanbanColumn (IN_REVIEW)
        └── KanbanColumn (DONE)
            └── KanbanCard
                └── onClick → IssueDetailModal
```

### Issue Detail Modal

```
IssueDetailModal
├── Issue Title & GitHub Link
├── PR Status Badge (if linked)
├── StepProgressBar (animated)
│
├── Generate Steps Button (if no steps)
│
└── AtomicStepList
    └── AtomicStepItem
        ├── Status Icon
        ├── Checkbox (manual toggle)
        ├── Step Name & Description
        ├── Type Badge
        └── Check Button (GitHub verification)
```

---

## MCP/IDE Integration

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            IDE (VS Code)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MCP Client                            │    │
│  │   - Reads mcp/server.ts                                  │    │
│  │   - Communicates via stdio                               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ stdio (JSON-RPC)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Tools:                                                  │    │
│  │   - report_step_status: Mark step complete               │    │
│  │   - get_issue_steps: Fetch issue progress                │    │
│  │   - list_active_issues: Show in-progress issues          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DevFlow API                                │
│   /api/mcp/report-step                                           │
│   /api/mcp/issue-steps                                           │
│   /api/mcp/active-issues                                         │
└─────────────────────────────────────────────────────────────────┘
```

### MCP Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `report_step_status` | Mark step complete from IDE | issueNumber, stepOrder, status |
| `get_issue_steps` | Get steps for an issue | issueNumber |
| `list_active_issues` | List in-progress issues | (none) |

---

## State Management

DevFlow uses a simple state management approach:

### Client-Side State
- **useState** for component-local state
- **useEffect** for data fetching
- **useSession** (NextAuth) for auth state

### Data Fetching Pattern
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/endpoint')
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
}, [deps]);
```

### Update Pattern
```typescript
// Optimistic update
setState(newValue);

// Persist to server
await fetch('/api/endpoint', {
  method: 'PATCH',
  body: JSON.stringify(newValue)
});
```

---

## Security

### Authentication
- GitHub OAuth via NextAuth.js
- Session tokens stored in database
- Access tokens encrypted in Account model

### Authorization
- All API routes verify `session.user.id`
- Database queries filtered by userId
- Project ownership verified before operations

### Data Protection
- Prisma parameterized queries (no SQL injection)
- React escapes output (no XSS)
- Secrets in environment variables only

---

## Environment Configuration

### Required Variables
```bash
DATABASE_URL=file:./dev.db
NEXTAUTH_SECRET=<32-byte-secret>
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=<github-oauth-app-id>
GITHUB_CLIENT_SECRET=<github-oauth-app-secret>
CEREBRAS_API_KEY=<cerebras-api-key>
```

### Optional Variables
```bash
DEVFLOW_API_URL=http://localhost:3000  # For MCP server
NODE_ENV=development
```

---

## Build & Run

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Development
npm run dev

# Production build
npm run build
npm run start

# Database GUI
npm run db:studio

# Build MCP server
npm run build:mcp
```

---

## Performance Considerations

### Current Optimizations
- Next.js automatic code splitting
- Prisma query batching with includes
- Framer Motion for smooth animations

### Potential Improvements
- Add SWR/React Query for client caching
- Implement pagination for large issue lists
- Lazy load atomic steps in detail modal
- Add Redis for session caching at scale
