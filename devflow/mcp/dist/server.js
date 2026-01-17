#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const API_BASE = process.env.DEVFLOW_API_URL || "http://localhost:3000";
// MCP Server for DevFlow
const server = new index_js_1.Server({
    name: "devflow-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Define available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "report_step_status",
                description: "Report that a development step is complete or has failed. Call this after completing tasks like running tests, committing code, or creating a PR.",
                inputSchema: {
                    type: "object",
                    properties: {
                        issueNumber: {
                            type: "number",
                            description: "The GitHub issue number (e.g., 123)",
                        },
                        stepType: {
                            type: "string",
                            enum: [
                                "CREATE_BRANCH",
                                "CODE",
                                "TEST",
                                "RUN_TESTS",
                                "COMMIT",
                                "CREATE_PR",
                                "REQUEST_REVIEW",
                                "ADDRESS_COMMENTS",
                                "GET_APPROVAL",
                                "MERGE",
                                "DEPLOY",
                                "CLOSE_ISSUE",
                            ],
                            description: "The type of step being reported",
                        },
                        status: {
                            type: "string",
                            enum: ["completed", "failed"],
                            description: "Whether the step was completed or failed",
                        },
                        details: {
                            type: "string",
                            description: "Optional details about the completion (e.g., 'All 42 tests passed')",
                        },
                    },
                    required: ["issueNumber", "stepType", "status"],
                },
            },
            {
                name: "get_issue_steps",
                description: "Get the list of atomic steps for a GitHub issue and their current status.",
                inputSchema: {
                    type: "object",
                    properties: {
                        issueNumber: {
                            type: "number",
                            description: "The GitHub issue number",
                        },
                    },
                    required: ["issueNumber"],
                },
            },
            {
                name: "list_active_issues",
                description: "List all issues currently in progress with their step status.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "create_feature_branch",
                description: "Get instructions for creating a feature branch for a GitHub issue. Returns the suggested branch name and git commands to execute. The user should confirm the branch name before proceeding.",
                inputSchema: {
                    type: "object",
                    properties: {
                        issueNumber: {
                            type: "number",
                            description: "The GitHub issue number to create a branch for",
                        },
                    },
                    required: ["issueNumber"],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "report_step_status": {
                const { issueNumber, stepType, status, details } = args;
                // Call the DevFlow API to update step status
                const response = await fetch(`${API_BASE}/api/mcp/report-step`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ issueNumber, stepType, status, details }),
                });
                if (!response.ok) {
                    const error = await response.text();
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to report step status: ${error}`,
                            },
                        ],
                    };
                }
                const result = await response.json();
                return {
                    content: [
                        {
                            type: "text",
                            text: `Step "${stepType}" marked as ${status} for issue #${issueNumber}. Progress: ${result.progress}%`,
                        },
                    ],
                };
            }
            case "get_issue_steps": {
                const { issueNumber } = args;
                const response = await fetch(`${API_BASE}/api/mcp/issue-steps?issueNumber=${issueNumber}`);
                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get steps for issue #${issueNumber}`,
                            },
                        ],
                    };
                }
                const data = await response.json();
                const stepsText = data.steps
                    .map((step, i) => `${i + 1}. [${step.status}] ${step.name} (${step.type})`)
                    .join("\n");
                return {
                    content: [
                        {
                            type: "text",
                            text: `Issue #${issueNumber}: ${data.title}\nProgress: ${data.progress}%\n\nSteps:\n${stepsText}`,
                        },
                    ],
                };
            }
            case "list_active_issues": {
                const response = await fetch(`${API_BASE}/api/mcp/active-issues`);
                if (!response.ok) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "Failed to fetch active issues",
                            },
                        ],
                    };
                }
                const data = await response.json();
                if (data.issues.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: "No active issues found.",
                            },
                        ],
                    };
                }
                const issuesText = data.issues
                    .map((issue) => `#${issue.number}: ${issue.title} (${issue.progress}%)`)
                    .join("\n");
                return {
                    content: [
                        {
                            type: "text",
                            text: `Active Issues:\n${issuesText}`,
                        },
                    ],
                };
            }
            case "create_feature_branch": {
                const { issueNumber } = args;
                // Get branch suggestion from API
                const response = await fetch(`${API_BASE}/api/mcp/suggest-branch?issueNumber=${issueNumber}`);
                if (!response.ok) {
                    const error = await response.text();
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get branch suggestion: ${error}`,
                            },
                        ],
                    };
                }
                const data = await response.json();
                const instructions = `## Create Feature Branch for Issue #${data.issueNumber}

**Issue:** ${data.issueTitle}

**Suggested Branch Name:** \`${data.suggestedBranch}\`

### Instructions:
Please confirm you want to create this branch, then execute these commands:

\`\`\`bash
# Ensure you're on the latest main branch
git checkout ${data.baseBranch}
git pull origin ${data.baseBranch}

# Create and checkout the new branch
git checkout -b ${data.suggestedBranch}

# Push the branch to remote
git push -u origin ${data.suggestedBranch}
\`\`\`

After creating the branch, use \`report_step_status\` with:
- issueNumber: ${data.issueNumber}
- stepType: "CREATE_BRANCH"
- status: "completed"
- details: "Created branch ${data.suggestedBranch}"

Would you like me to proceed with creating this branch?`;
                return {
                    content: [
                        {
                            type: "text",
                            text: instructions,
                        },
                    ],
                };
            }
            default:
                return {
                    content: [
                        {
                            type: "text",
                            text: `Unknown tool: ${name}`,
                        },
                    ],
                };
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
            ],
        };
    }
});
// Start the server
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("DevFlow MCP server running");
}
main().catch(console.error);
