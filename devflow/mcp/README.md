# DevFlow MCP Server

This MCP server allows IDEs like Cursor and Claude Code to interact with DevFlow to report step completions and query issue status.

## Setup

### 1. Build the MCP server

```bash
cd devflow
npm run build:mcp
```

### 2. Configure your IDE

#### For Claude Code

Add to your Claude Code settings (`~/.claude/claude_code_config.json`):

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

#### For Cursor

Add to your Cursor MCP settings:

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

## Available Tools

### `report_step_status`

Report that a development step is complete or failed.

**Parameters:**
- `issueNumber` (number): The GitHub issue number
- `stepType` (string): The type of step (CODE, TEST, RUN_TESTS, COMMIT, CREATE_PR, etc.)
- `status` (string): "completed" or "failed"
- `details` (string, optional): Additional details

**Example usage in your IDE:**
> "Mark the RUN_TESTS step as completed for issue #42 with details 'All 15 tests passed'"

### `get_issue_steps`

Get the atomic steps for a GitHub issue.

**Parameters:**
- `issueNumber` (number): The GitHub issue number

**Example usage:**
> "What are the steps for issue #42?"

### `list_active_issues`

List all issues currently in progress.

**Example usage:**
> "Show me my active issues"

## Usage Example

When working on issue #42, you can use the MCP tools like this:

1. Start working: "Get the steps for issue #42"
2. After writing code: "Report CODE step completed for issue #42"
3. After running tests: "Report RUN_TESTS completed for #42 with details '42 tests passed'"
4. Check progress: "Get steps for issue #42"
