# DevFlow Architecture

## High-Level System Architecture

```mermaid
flowchart LR
    APP[DevFlow App]
    MCP[MCP Server]
    IDE[VS Code + Claude]
    GH[GitHub]

    APP <-->|Tickets & Steps| MCP
    MCP <-->|Tools & Context| IDE
    IDE <-->|Code & PRs| GH
    GH <-->|Issues Sync| APP

    style APP fill:#6366f1,stroke:#4338ca,color:#fff
    style MCP fill:#f59e0b,stroke:#d97706,color:#fff
    style IDE fill:#10b981,stroke:#059669,color:#fff
    style GH fill:#8b5cf6,stroke:#7c3aed,color:#fff
```

## Data Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant IDE as VS Code + Claude
    participant MCP as MCP Server
    participant App as DevFlow App
    participant GH as GitHub

    Dev->>App: Create Ticket with Atomic Steps
    App->>GH: Sync to GitHub Issue

    Dev->>IDE: Start working on ticket
    IDE->>MCP: Get ticket details
    MCP->>App: Fetch atomic steps
    App-->>MCP: Return task breakdown
    MCP-->>IDE: Provide context to Claude

    IDE->>IDE: Claude implements code
    IDE->>MCP: Update atomic step status
    MCP->>App: Mark step complete
    App->>App: Update Kanban board

    IDE->>GH: Create PR
    GH->>App: Update ticket status
```

## Key Integration Points

| Component | Role | Technology |
|-----------|------|------------|
| **DevFlow App** | Visual task management & Kanban | Next.js, React |
| **MCP Server** | AI-IDE bridge & tool provider | Model Context Protocol |
| **Claude Code** | AI pair programmer | Claude API |
| **GitHub** | Source control & issue tracking | GitHub API |
