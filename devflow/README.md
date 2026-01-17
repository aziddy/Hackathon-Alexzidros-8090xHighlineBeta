# DevFlow

**Track Every Step of Your Dev Workflow** - AI-powered developer productivity tool that breaks down GitHub issues into atomic steps and tracks progress from code to deploy.

Built for the Hackathon with Cerebras AI, GitHub API, and MCP.

## Features

- **AI-Generated Steps** - Cerebras LLM analyzes your issues and generates tailored atomic workflow steps
- **GitHub Integration** - Sync issues, verify PR creation, check merge status, monitor pipelines
- **Visual Kanban Board** - 4-column board with animated progress bars
- **Status Verification** - One-click verification of step completion via GitHub API
- **MCP Server** - IDE integration for reporting step completion from Cursor/Claude Code
- **Celebration Mode** - Confetti animation when you complete all steps!

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A GitHub account
- Cerebras API key (get free credits at https://cloud.cerebras.ai)

### 2. Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: DevFlow
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy your **Client ID**
6. Click "Generate a new client secret" and copy the **Client Secret**

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Database (SQLite - no changes needed)
DATABASE_URL="file:./dev.db"

# NextAuth (generate a secret with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth (from step 2)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Cerebras AI (from https://cloud.cerebras.ai)
CEREBRAS_API_KEY="your-cerebras-api-key"
```

### 4. Install Dependencies & Initialize Database

```bash
npm install
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In** - Click "Get Started" and authenticate with GitHub
2. **Add a Project** - Select one of your GitHub repositories
3. **Sync Issues** - Click "Sync" to pull issues from GitHub
4. **Generate Steps** - Click on an issue, then "Generate Steps" to use AI
5. **Track Progress** - Check off steps manually or use "Check Status" to verify via GitHub API
6. **Celebrate** - Complete all steps and enjoy the confetti!

## Demo Script for Judges

1. Landing page → Show animated hero and features
2. Sign in with GitHub → OAuth flow
3. Add project → Select a repo with open issues
4. Sync issues → Watch them populate the Kanban board
5. Open an issue → Click "Generate Steps" (AI magic!)
6. Complete steps → Watch the progress bar animate
7. Use "Check Status" → Verify PR/merge status via API
8. Complete all steps → Confetti celebration!
9. Toggle dark mode → Show polish

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite + Prisma ORM
- **Auth**: NextAuth.js v5 with GitHub OAuth
- **UI**: shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion + canvas-confetti
- **AI**: Cerebras Cloud SDK (llama-3.3-70b)
- **GitHub**: Octokit REST API
- **IDE Integration**: Model Context Protocol (MCP)

## Project Structure

```
devflow/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   │   ├── api/                # Backend API endpoints
│   │   │   ├── ai/             # Cerebras AI integration
│   │   │   ├── github/         # GitHub API proxy
│   │   │   ├── issues/         # Issue & step management
│   │   │   ├── mcp/            # MCP server endpoints
│   │   │   └── projects/       # Project CRUD
│   │   ├── dashboard/          # Main app dashboard
│   │   └── login/              # Authentication page
│   ├── components/             # React components
│   │   ├── issues/             # Issue detail & atomic steps
│   │   ├── kanban/             # Kanban board components
│   │   ├── layout/             # Sidebar, header, theme
│   │   └── projects/           # Project selector
│   ├── lib/                    # Utility libraries
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── cerebras.ts         # AI step generation
│   │   ├── github.ts           # GitHub API client
│   │   └── prisma.ts           # Database client
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── mcp/
│   ├── server.ts               # MCP server for IDE integration
│   └── README.md               # MCP setup instructions
└── .env.local                  # Environment variables
```

## MCP Integration (Optional)

DevFlow includes an MCP server for IDE integration. See [mcp/README.md](mcp/README.md) for setup instructions.

This allows you to report step completions directly from your IDE:
- "Mark the RUN_TESTS step as completed for issue #42"
- "Get the steps for issue #42"
- "Show me my active issues"

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:push    # Push schema to database
npm run db:studio  # Open Prisma Studio
npm run build:mcp  # Build MCP server
```

## License

MIT

---

*"The back-office secretary every developer deserves"*
