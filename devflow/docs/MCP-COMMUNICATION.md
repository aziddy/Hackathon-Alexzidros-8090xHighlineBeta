# MCP Communication Architecture

This document explains how Model Context Protocol (MCP) servers communicate with IDEs and applications.

## What is MCP?

MCP (Model Context Protocol) is a standard for connecting AI assistants to external tools and data sources. It allows IDEs like Cursor and Claude Code to interact with custom tools you define.

## Transport Types

MCP supports two main transport mechanisms:

| Transport | Use Case | Communication |
|-----------|----------|---------------|
| **STDIO** | Local development | Process pipes (stdin/stdout) |
| **SSE/HTTP** | Remote/hosted servers | HTTP requests + Server-Sent Events |

---

## 1. Local MCP (STDIO Transport)

This is what DevFlow uses. The IDE spawns the MCP server as a child process and communicates through standard input/output pipes.

### Architecture

```mermaid
flowchart TB
    subgraph IDE["IDE (Cursor / Claude Code)"]
        Agent["AI Agent"]
        MCPClient["MCP Client"]
    end

    subgraph MCPProcess["Child Process"]
        MCPServer["MCP Server<br/>(node server.js)"]
        STDIN["stdin"]
        STDOUT["stdout"]
    end

    Agent -->|"Tool Request"| MCPClient
    MCPClient -->|"JSON via pipe"| STDIN
    STDIN --> MCPServer
    MCPServer --> STDOUT
    STDOUT -->|"JSON via pipe"| MCPClient
    MCPClient -->|"Tool Response"| Agent

    style IDE fill:#e1f5fe
    style MCPProcess fill:#fff3e0
```

### How It Works

1. **IDE starts**: Reads MCP config and spawns child processes for each server
2. **Process created**: `node /path/to/mcp/dist/server.js` runs as a child process
3. **Communication**: IDE writes JSON to stdin, reads JSON from stdout
4. **Lifecycle**: Process lives as long as the IDE session

### Configuration

```json
{
  "mcpServers": {
    "devflow": {
      "command": "node",
      "args": ["/path/to/devflow/mcp/dist/server.js"],
      "env": {
        "DEVFLOW_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Simple setup | Local only |
| No network config | Must rebuild after changes |
| No authentication needed | One instance per IDE |
| Fast (no network latency) | Can't share across machines |

---

## 2. Remote MCP (HTTP/SSE Transport)

For hosted MCP servers that can be accessed over the network. Uses HTTP for requests and Server-Sent Events (SSE) for streaming responses.

### Architecture

```mermaid
flowchart TB
    subgraph IDE["IDE (Cursor / Claude Code)"]
        Agent["AI Agent"]
        MCPClient["MCP Client"]
    end

    subgraph Cloud["Remote Server"]
        HTTPServer["HTTP Server<br/>(Express/Fastify)"]
        MCPServer["MCP Server"]
        SSE["SSE Endpoint<br/>/sse"]
        Messages["Messages Endpoint<br/>/messages"]
    end

    Agent -->|"Tool Request"| MCPClient
    MCPClient -->|"HTTP POST"| Messages
    Messages --> MCPServer
    MCPServer --> SSE
    SSE -->|"SSE Stream"| MCPClient
    MCPClient -->|"Tool Response"| Agent

    style IDE fill:#e1f5fe
    style Cloud fill:#e8f5e9
```

### How It Works

1. **Server runs independently**: Hosted on a URL (e.g., `https://mcp.devflow.io`)
2. **IDE connects**: Establishes SSE connection for receiving messages
3. **Requests via HTTP**: Tool calls sent as POST requests to `/messages`
4. **Responses via SSE**: Results streamed back through the SSE connection

### Configuration

```json
{
  "mcpServers": {
    "devflow": {
      "url": "https://mcp.devflow.io/sse"
    }
  }
}
```

### Server Code Example

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

app.get("/sse", (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Handle incoming MCP messages
  await transport.handlePostMessage(req, res);
});

app.listen(4059);
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Accessible from anywhere | Requires hosting |
| Shared across team/machines | Network latency |
| Can scale independently | Needs authentication |
| Hot-reload friendly | More complex setup |

---

## 3. DevFlow Data Flow

This diagram shows how data flows through the DevFlow system when an AI agent in Cursor/Claude Code interacts with issues.

### Complete Request Flow

```mermaid
sequenceDiagram
    participant User as Developer
    participant IDE as Cursor/Claude Code
    participant MCP as MCP Server<br/>(STDIO)
    participant API as DevFlow API<br/>(Next.js)
    participant DB as Database<br/>(Prisma/PostgreSQL)

    Note over User,DB: Query Flow: "Get steps for issue #42"

    User->>IDE: "What are the steps for issue #42?"
    IDE->>IDE: AI recognizes MCP tool needed
    IDE->>MCP: get_issue_steps({ issueNumber: 42 })
    MCP->>API: GET /api/mcp/issue-steps?issueNumber=42
    API->>DB: Query Issue + AtomicSteps
    DB-->>API: Issue data with steps
    API-->>MCP: JSON { steps: [...], progress: 45 }
    MCP-->>IDE: Formatted response
    IDE-->>User: "Issue #42 has 5 steps, 45% complete..."

    Note over User,DB: Update Flow: "Mark CODE step complete"

    User->>IDE: "Mark CODE step complete for #42"
    IDE->>IDE: AI recognizes MCP tool needed
    IDE->>MCP: report_step_status({ issueNumber: 42, stepType: "CODE", status: "completed" })
    MCP->>API: POST /api/mcp/report-step
    API->>DB: Update AtomicStep status
    DB-->>API: Updated step
    API->>API: Recalculate progress
    API-->>MCP: { success: true, progress: 60 }
    MCP-->>IDE: "Step CODE marked complete. Progress: 60%"
    IDE-->>User: Confirmation message
```

### Component Responsibilities

```mermaid
flowchart LR
    subgraph IDE["IDE Layer"]
        Agent["AI Agent<br/>Interprets user intent"]
        Client["MCP Client<br/>Manages tool calls"]
    end

    subgraph MCP["MCP Layer"]
        Server["MCP Server<br/>Defines tools & schemas"]
        Transform["Data Transform<br/>Format responses"]
    end

    subgraph App["Application Layer"]
        Routes["API Routes<br/>/api/mcp/*"]
        Logic["Business Logic<br/>Validation & Processing"]
    end

    subgraph Data["Data Layer"]
        Prisma["Prisma ORM"]
        PG["PostgreSQL"]
    end

    Agent --> Client
    Client --> Server
    Server --> Transform
    Transform --> Routes
    Routes --> Logic
    Logic --> Prisma
    Prisma --> PG

    style IDE fill:#e1f5fe
    style MCP fill:#fff3e0
    style App fill:#e8f5e9
    style Data fill:#fce4ec
```

### Available MCP Tools

| Tool | Direction | API Endpoint | Purpose |
|------|-----------|--------------|---------|
| `get_issue_steps` | Read | `GET /api/mcp/issue-steps` | Fetch steps for an issue |
| `list_active_issues` | Read | `GET /api/mcp/active-issues` | List in-progress issues |
| `report_step_status` | Write | `POST /api/mcp/report-step` | Update step completion |
| `create_feature_branch` | Read | `GET /api/mcp/suggest-branch` | Get branch name suggestion |

---

## Key Differences Summary

```mermaid
flowchart TB
    subgraph Local["Local MCP (STDIO)"]
        direction TB
        L1["IDE spawns process"]
        L2["stdin/stdout pipes"]
        L3["No network needed"]
        L1 --> L2 --> L3
    end

    subgraph Remote["Remote MCP (HTTP/SSE)"]
        direction TB
        R1["Server runs independently"]
        R2["HTTP + SSE connection"]
        R3["Network required"]
        R1 --> R2 --> R3
    end

    Local ---|"DevFlow uses this"| Note["Both ultimately call<br/>your application's API"]
    Remote --- Note

    style Local fill:#fff3e0
    style Remote fill:#e8f5e9
    style Note fill:#f3e5f5
```

## Further Reading

- [MCP Specification](https://modelcontextprotocol.io/)
- [DevFlow MCP Server README](../mcp/README.md)
