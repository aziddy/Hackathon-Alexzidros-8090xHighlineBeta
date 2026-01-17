# DevFlow Architecture Diagrams

## 1. Overall Application Flow

```mermaid
flowchart TB
    subgraph Auth["Authentication"]
        A[Landing Page] --> B[Login with GitHub]
        B --> C[GitHub OAuth]
        C --> D[Session Created]
    end

    subgraph Setup["Project Setup"]
        D --> E[Dashboard]
        E --> F[Select/Add Project]
        F --> G[Link GitHub Repo]
    end

    subgraph Sync["Issue Sync"]
        G --> H[Sync from GitHub]
        H --> I[Fetch Issues]
        H --> J[Fetch PRs]
        I --> K[Link PRs to Issues]
        J --> K
        K --> L[Store in Database]
    end

    subgraph Workflow["Workflow Management"]
        L --> M[View Kanban Board]
        M --> N[Select Issue]
        N --> O{Has Steps?}
        O -->|No| P[Generate AI Steps]
        O -->|Yes| Q[View Steps]
        P --> Q
    end

    subgraph Tracking["Progress Tracking"]
        Q --> R[Work on Step]
        R --> S{Verify Completion}
        S -->|Manual| T[Click Checkbox]
        S -->|GitHub API| U[Check Status]
        S -->|MCP/IDE| V[Report from IDE]
        T --> W[Update Progress]
        U --> W
        V --> W
        W --> X{All Complete?}
        X -->|No| R
        X -->|Yes| Y[Issue Done 🎉]
    end
```

---

## 2. Data Model Relationships

```mermaid
erDiagram
    User ||--o{ Project : owns
    User ||--o{ Account : has
    User ||--o{ Session : has
    Project ||--o{ Issue : contains
    Issue ||--o{ AtomicStep : has

    User {
        string id PK
        string name
        string email
        string image
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string access_token
        string refresh_token
    }

    Session {
        string id PK
        string userId FK
        string sessionToken
        datetime expires
    }

    Project {
        string id PK
        string userId FK
        string name
        string description
        string githubRepoOwner
        string githubRepoName
        string githubRepoId
    }

    Issue {
        string id PK
        string projectId FK
        string title
        string body
        string githubIssueId
        int githubNumber
        enum status
        int progressPercent
        int linkedPrNumber
        string linkedPrState
    }

    AtomicStep {
        string id PK
        string issueId FK
        string name
        string description
        enum type
        int order
        enum status
        datetime completedAt
        enum verifiedVia
    }
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant App as DevFlow App
    participant NextAuth as NextAuth.js
    participant GitHub as GitHub OAuth
    participant DB as Database

    User->>App: Click "Sign in with GitHub"
    App->>NextAuth: Initiate OAuth
    NextAuth->>GitHub: Redirect to consent screen
    GitHub->>User: Show authorization prompt
    User->>GitHub: Approve access
    GitHub->>NextAuth: Return authorization code
    NextAuth->>GitHub: Exchange code for tokens
    GitHub->>NextAuth: Return access_token + user info
    NextAuth->>DB: Create/Update User record
    NextAuth->>DB: Store Account with tokens
    NextAuth->>DB: Create Session
    NextAuth->>App: Set session cookie
    App->>User: Redirect to Dashboard

    Note over User,DB: Subsequent Requests
    User->>App: Access protected route
    App->>NextAuth: Validate session
    NextAuth->>DB: Lookup session token
    DB->>NextAuth: Return session + user
    NextAuth->>App: Session valid
    App->>User: Render protected content
```

---

## 4. GitHub Sync Process

```mermaid
flowchart TB
    subgraph Trigger["Sync Trigger"]
        A[User clicks Sync] --> B[POST /api/projects/id/sync]
    end

    subgraph Fetch["Fetch from GitHub"]
        B --> C[Get user access_token from DB]
        C --> D[Initialize Octokit client]
        D --> E[Fetch Issues]
        D --> F[Fetch Pull Requests]
    end

    subgraph Process["Process & Link"]
        E --> G[For each Issue]
        F --> H[Build PR lookup map]
        G --> I{Find linked PR?}
        H --> I
        I -->|Yes| J[Extract PR metadata]
        I -->|No| K[No PR linked]
        J --> L[Determine status]
        K --> L
    end

    subgraph Status["Status Logic"]
        L --> M{PR State?}
        M -->|Merged| N[Status = DONE]
        M -->|Open| O[Status = IN_REVIEW]
        M -->|None| P[Keep existing status]
    end

    subgraph Persist["Persist to Database"]
        N --> Q[Upsert Issue]
        O --> Q
        P --> Q
        Q --> R[Update lastSyncedAt]
        R --> S[Return updated issues]
    end

    subgraph Link["PR Linking Logic"]
        T[PR Body/Title] --> U{Contains fixes #N?}
        U -->|Yes| V[Link to Issue N]
        U -->|No| W{Contains closes #N?}
        W -->|Yes| V
        W -->|No| X{Branch has issue number?}
        X -->|Yes| V
        X -->|No| Y[No link found]
    end
```

---

## 5. Step Verification Flow

```mermaid
flowchart TB
    subgraph Methods["Verification Methods"]
        A[Step Needs Verification]
        A --> B{Verification Type}
        B -->|Manual| C[User Checkbox]
        B -->|GitHub API| D[Check Button]
        B -->|MCP/IDE| E[IDE Reports]
    end

    subgraph Manual["Manual Verification"]
        C --> F[Click checkbox]
        F --> G[PATCH /api/issues/id/steps]
        G --> H[Update status = COMPLETED]
        H --> I[Set verifiedVia = manual]
    end

    subgraph GitHubAPI["GitHub API Verification"]
        D --> J[POST /api/issues/id/check-status]
        J --> K{Step Type?}
        K -->|CREATE_PR| L[Search for PR with issue ref]
        K -->|REQUEST_REVIEW| M[Count PR reviews]
        K -->|GET_APPROVAL| N[Find approved review]
        K -->|MERGE| O[Check PR merged]
        K -->|DEPLOY| P[Check workflow success]
        K -->|CLOSE_ISSUE| Q[Verify issue closed]
        L --> R{Found?}
        M --> R
        N --> R
        O --> R
        P --> R
        Q --> R
        R -->|Yes| S[Mark COMPLETED]
        R -->|No| T[Keep PENDING]
        S --> U[Set verifiedVia = github_api]
    end

    subgraph MCP["MCP/IDE Verification"]
        E --> V[IDE calls report_step_status]
        V --> W[MCP Server receives]
        W --> X[POST /api/mcp/report-step]
        X --> Y[Update step status]
        Y --> Z[Set verifiedVia = mcp]
    end

    subgraph Progress["Progress Update"]
        I --> AA[Recalculate Progress]
        U --> AA
        Z --> AA
        AA --> AB[completed / total * 100]
        AB --> AC[Update issue.progressPercent]
        AC --> AD{Progress = 100%?}
        AD -->|Yes| AE[Show Confetti]
        AD -->|No| AF[Update UI]
    end
```

---

## 6. Component Hierarchy

```mermaid
flowchart TB
    subgraph Root["Root Layout"]
        A[layout.tsx]
        A --> B[Providers]
        B --> C[SessionProvider]
        B --> D[ThemeProvider]
    end

    subgraph Pages["Pages"]
        A --> E[page.tsx - Landing]
        A --> F[login/page.tsx]
        A --> G[dashboard/page.tsx]
    end

    subgraph Dashboard["Dashboard Components"]
        G --> H[Header]
        H --> H1[Logo]
        H --> H2[SyncButton]
        H --> H3[UserMenu]

        G --> I[ProjectSelector]
        I --> I1[Dropdown]
        I --> I2[AddProjectModal]

        G --> J[KanbanBoard]
    end

    subgraph Kanban["Kanban Components"]
        J --> K1[KanbanColumn TODO]
        J --> K2[KanbanColumn IN_PROGRESS]
        J --> K3[KanbanColumn IN_REVIEW]
        J --> K4[KanbanColumn DONE]
        K1 --> L[KanbanCard]
        K2 --> L
        K3 --> L
        K4 --> L
        L --> M[onClick: Open Modal]
    end

    subgraph Modal["Issue Detail Modal"]
        M --> N[IssueDetailModal]
        N --> N1[Issue Title]
        N --> N2[GitHub Link]
        N --> N3[PR Status Badge]
        N --> N4[StepProgressBar]
        N --> N5[GenerateStepsButton]
        N --> N6[AtomicStepList]
        N6 --> O[AtomicStepItem]
        O --> O1[StatusIcon]
        O --> O2[Checkbox]
        O --> O3[StepName]
        O --> O4[TypeBadge]
        O --> O5[CheckButton]
    end
```

---

## 7. API Request Flow

```mermaid
sequenceDiagram
    participant Client as React Client
    participant MW as Middleware
    participant API as API Route
    participant Auth as NextAuth
    participant DB as Prisma/SQLite
    participant GH as GitHub API
    participant AI as Cerebras AI

    Note over Client,AI: Protected API Request Flow

    Client->>MW: Request /api/projects
    MW->>Auth: Check session
    Auth->>DB: Validate session token
    DB->>Auth: Session valid
    Auth->>MW: User authenticated
    MW->>API: Forward request

    alt GET Projects
        API->>DB: prisma.project.findMany
        DB->>API: Return projects
        API->>Client: JSON response
    end

    alt POST Sync Issues
        API->>DB: Get user access_token
        DB->>API: Return token
        API->>GH: octokit.issues.listForRepo
        GH->>API: Return issues
        API->>GH: octokit.pulls.list
        GH->>API: Return PRs
        API->>API: Link PRs to Issues
        API->>DB: prisma.issue.upsert
        DB->>API: Confirm upsert
        API->>Client: Return synced issues
    end

    alt POST Generate Steps
        API->>DB: Get issue details
        DB->>API: Return issue
        API->>AI: cerebras.chat.completions.create
        AI->>API: Return generated steps
        API->>DB: Delete old steps
        API->>DB: Create new AtomicSteps
        DB->>API: Confirm creation
        API->>Client: Return new steps
    end

    alt PATCH Update Step
        API->>DB: prisma.atomicStep.update
        DB->>API: Return updated step
        API->>DB: Recalculate progress
        API->>DB: Update progressPercent
        DB->>API: Confirm update
        API->>Client: Return updated step
    end
```

---

## 8. State Flow in Dashboard

```mermaid
stateDiagram-v2
    [*] --> Loading: Page Mount
    Loading --> NoProjects: No projects found
    Loading --> HasProjects: Projects exist

    NoProjects --> AddingProject: Click Add Project
    AddingProject --> SearchingRepos: Enter search
    SearchingRepos --> SelectRepo: Select repo
    SelectRepo --> CreatingProject: Confirm
    CreatingProject --> HasProjects: Project created

    HasProjects --> ProjectSelected: Select project
    ProjectSelected --> Syncing: Click Sync
    Syncing --> IssuesLoaded: Sync complete

    IssuesLoaded --> ViewingKanban: Display board
    ViewingKanban --> IssueSelected: Click card

    IssueSelected --> ModalOpen: Open detail modal
    ModalOpen --> GeneratingSteps: No steps - click generate
    GeneratingSteps --> StepsLoaded: AI returns steps
    ModalOpen --> StepsLoaded: Has existing steps

    StepsLoaded --> WorkingOnStep: View steps
    WorkingOnStep --> VerifyingStep: Complete step
    VerifyingStep --> StepsLoaded: Update progress

    StepsLoaded --> AllComplete: 100% progress
    AllComplete --> Celebration: Show confetti
    Celebration --> ModalOpen: Continue

    ModalOpen --> ViewingKanban: Close modal
```

---

## 9. Database Query Flow

```mermaid
flowchart LR
    subgraph Queries["Common Query Patterns"]
        A[Get User Projects]
        A --> A1[findMany where userId]
        A1 --> A2[include issues]

        B[Get Project Issues]
        B --> B1[findMany where projectId]
        B1 --> B2[include atomicSteps]
        B2 --> B3[orderBy createdAt desc]

        C[Upsert Issue]
        C --> C1[where projectId + githubIssueId]
        C1 --> C2[update or create]

        D[Update Step]
        D --> D1[update where id]
        D1 --> D2[set status COMPLETED]
        D2 --> D3[set completedAt now]

        E[Calculate Progress]
        E --> E1[filter COMPLETED steps]
        E1 --> E2[completed / total * 100]
    end
```

---

## 10. MCP Server Architecture

```mermaid
flowchart TB
    subgraph IDE["IDE Environment"]
        A[VS Code / Cursor]
        A --> B[MCP Client Extension]
    end

    subgraph MCP["MCP Server - stdio"]
        B <-->|JSON-RPC| C[mcp/server.ts]
        C --> D[Tool: report_step_status]
        C --> E[Tool: get_issue_steps]
        C --> F[Tool: list_active_issues]
    end

    subgraph API["DevFlow API"]
        D -->|POST| G[/api/mcp/report-step]
        E -->|GET| H[/api/mcp/issue-steps]
        F -->|GET| I[/api/mcp/active-issues]
    end

    subgraph DB["Database"]
        G --> J[(SQLite)]
        H --> J
        I --> J
    end

    subgraph Response["Response Flow"]
        J --> K[Query Results]
        K --> L[Format Response]
        L --> M[Return to IDE]
    end
```

---

## 11. Issue Status Transitions

```mermaid
stateDiagram-v2
    [*] --> TODO: Issue Created

    TODO --> IN_PROGRESS: Start Working
    TODO --> IN_REVIEW: PR Opened

    IN_PROGRESS --> IN_REVIEW: PR Opened
    IN_PROGRESS --> TODO: Pause Work

    IN_REVIEW --> IN_PROGRESS: Changes Requested
    IN_REVIEW --> DONE: PR Merged

    DONE --> [*]

    note right of TODO: Default state for new issues
    note right of IN_REVIEW: Auto-set when PR linked
    note right of DONE: Auto-set when PR merged
```

---

## 12. Step Types and Workflow

```mermaid
flowchart LR
    subgraph Development["Development Phase"]
        A[CODE] --> B[TEST]
        B --> C[RUN_TESTS]
    end

    subgraph Integration["Integration Phase"]
        C --> D[COMMIT]
        D --> E[CREATE_PR]
    end

    subgraph Review["Review Phase"]
        E --> F[REQUEST_REVIEW]
        F --> G[ADDRESS_COMMENTS]
        G --> H[GET_APPROVAL]
    end

    subgraph Completion["Completion Phase"]
        H --> I[MERGE]
        I --> J[DEPLOY]
        J --> K[CLOSE_ISSUE]
    end

    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style D fill:#fff3e0
    style E fill:#fff3e0
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style H fill:#f3e5f5
    style I fill:#e8f5e9
    style J fill:#e8f5e9
    style K fill:#e8f5e9
```
