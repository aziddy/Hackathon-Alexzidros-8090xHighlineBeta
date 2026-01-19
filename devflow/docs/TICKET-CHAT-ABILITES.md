# LLM Chat Abilities in Ticket Dialog

## READ/QUERY Abilities

### Ticket Data
- Issue title, body/description, GitHub number, URL
- Issue labels (tags/categories)
- Current progress percentage
- All atomic steps (name, description, type, status, check method)
- PR information (number, state, URL)
- Pipeline/CI status

### Step Data
- Step name, description, type, and status (PENDING, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED)
- Check method (MCP_OR_MANUAL, MCP, MANUAL, MCP_OR_API, API)
- Completion timestamp and verification method

### Project Data
- GitHub repo owner and name
- Project name and description

### Chat Context
- Last 10 messages from conversation history

### GitHub API Queries (execute immediately)
| Action | Description |
|--------|-------------|
| `LIST_ISSUES` | List repository issues (open, closed, or all) |
| `LIST_PRS` | List pull requests with state and merge status |
| `LIST_REPOS` | List user's repositories |
| `CHECK_WORKFLOW` | Check CI/CD workflow status and runs |
| `GET_LINKED_BRANCHES` | Get branches linked to an issue (from GitHub Development section) |
| `LIST_BRANCHES` | List branches in the repository |

---

## WRITE/UPDATE Abilities

### Local/UI Actions
- Mark steps as complete (updates status to COMPLETED)
- Records completion timestamp
- Sets verification method as "manual" or "github_api"

### GitHub API Actions (require user confirmation)
| Action | Description |
|--------|-------------|
| `CREATE_ISSUE` | Create new GitHub issues with title, body, labels |
| `ADD_COMMENT` | Add comments to issues or pull requests |
| `CREATE_BRANCH` | Create new branches from specified base branch |
| `CREATE_PR` | Create pull requests with title, body, head branch, base branch |
| `LINK_BRANCH` | Link an existing branch to an issue (visible in GitHub Development section) |

---

## How Abilities Are Fed to the LLM

### System Prompt Injection

The LLM receives its abilities through a **system prompt** built dynamically by `buildChatSystemPrompt()` in [chat-utils.ts](../src/lib/chat-utils.ts:27). The prompt includes:

1. **Issue Context** - Title, description, labels
2. **Repository Context** - GitHub owner and repo name
3. **Steps Context** - All atomic steps with status indicators
4. **Capabilities List** - Enumerated list of what the assistant can do
5. **Action Command Formats** - Documentation on how to trigger actions

### Action Command Format

The LLM outputs special text markers at the end of responses that are parsed and executed:

**Step Completion:**
```
[[ACTION:COMPLETE_STEP:stepNumber]]
```

**GitHub Actions:**
```
[[ACTION:GITHUB:{"type":"ACTION_TYPE","params":{...}}]]
```

### Response Parsing

The `parseActionFromResponse()` function in [chat-utils.ts:120](../src/lib/chat-utils.ts:120) extracts action commands using regex:
- Strips action markers from the displayed message
- Returns parsed action object for execution
- Handles both step completion and GitHub actions

### Execution Flow

1. User sends message → `/api/chat` endpoint
2. System prompt + chat history sent to Cerebras LLM (llama-3.3-70b)
3. LLM response parsed for embedded action commands
4. **Read actions**: Execute immediately, append results to message
5. **Write actions**: Return pending action for user confirmation dialog
6. **Step completions**: Auto-update via `/api/issues/{issueId}/steps/{stepId}`
