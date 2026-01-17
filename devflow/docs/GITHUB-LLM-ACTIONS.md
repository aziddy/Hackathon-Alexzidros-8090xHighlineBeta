# GitHub LLM Actions

The DevFlow AI chat can perform GitHub operations on behalf of the authenticated user using their OAuth token.

## How It Works

1. User asks the AI to perform a GitHub action in the chat
2. AI responds with an action command: `[[ACTION:GITHUB:{"type":"...", "params":{...}}]]`
3. **Read actions** execute immediately and show results
4. **Write actions** show a confirmation dialog before executing

## Available Actions

### Read Actions (Execute Immediately)

| Action | Description | Parameters |
|--------|-------------|------------|
| `LIST_ISSUES` | List repository issues | `state`: "open" \| "closed" \| "all", `limit`: number |
| `LIST_PRS` | List pull requests | `state`: "open" \| "closed" \| "all", `limit`: number |
| `CHECK_WORKFLOW` | Check CI/CD workflow status | `branch`: string (optional) |
| `LIST_REPOS` | List user's repositories | `limit`: number |

### Write Actions (Require Confirmation)

| Action | Description | Parameters |
|--------|-------------|------------|
| `CREATE_ISSUE` | Create a new GitHub issue | `title`: string (required), `body`: string, `labels`: string[] |
| `ADD_COMMENT` | Add comment to issue/PR | `issueNumber`: number (required), `body`: string (required) |
| `CREATE_BRANCH` | Create a new branch | `branchName`: string (required), `fromBranch`: string (default: "main") |

## Example Prompts

### Read Operations

```
"Show me the open issues"
"List all pull requests"
"What's the CI status on main?"
"Show my repositories"
```

### Write Operations

```
"Create a branch called feature/add-login for this issue"
"Add a comment to issue #42 saying 'Working on this now'"
"Create a new issue titled 'Bug: Login fails on mobile'"
```

## Action Format

The AI uses this format to trigger actions:

```
[[ACTION:GITHUB:{"type":"ACTION_TYPE","params":{...}}]]
```

### Examples

**List open issues:**
```json
[[ACTION:GITHUB:{"type":"LIST_ISSUES","params":{"state":"open","limit":10}}]]
```

**Create a branch:**
```json
[[ACTION:GITHUB:{"type":"CREATE_BRANCH","params":{"branchName":"feature/new-feature","fromBranch":"main"}}]]
```

**Add a comment:**
```json
[[ACTION:GITHUB:{"type":"ADD_COMMENT","params":{"issueNumber":123,"body":"This is my comment"}}]]
```

**Create an issue:**
```json
[[ACTION:GITHUB:{"type":"CREATE_ISSUE","params":{"title":"Bug report","body":"Description here","labels":["bug"]}}]]
```

## Security

- All actions use the logged-in user's GitHub OAuth token
- OAuth scope includes: `read:user`, `user:email`, `repo`
- Write actions require explicit user confirmation before execution
- Actions are scoped to the current project's repository
