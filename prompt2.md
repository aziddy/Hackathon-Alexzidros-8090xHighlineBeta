I want to make an application for a hackathon that is themed around Developer productivity, Code quality, ​Collaboration and workflow

It needs to be flashy as to present to the judges at the end of the hackathon.

Let’s create a software developer focused tool that breaks up tickets/issues (from platforms like jira, linear, GitHub projects) into more atomic steps eg:
– Code/update/fix the feature
– Create the unit tests for the feature
– Unit Test the feature and run all other relevant Unit tests
– Commit
– form/update PR
– Request PR reviews from coworkers
– Resolve comments if any (maybe LOOP back to first step)
– Get Approval for PR
– Merge to main
– Deploy to production, successfully
– Update the ticket/issue to mark as done

I feel like there’s some small voids in the development cycle of a engineer that could use some super powering. But I think we need to meet more where developers are at

I often can be working on 10-20 features in parallel and often can’t keep track about where I am in between “in-progress & done”

Did I approve that build? Did that person approve that PR? Did I merge to main? Did I run those unit tests? Did that build/release pipeline pass?

AI tools are helping developers directly with the code, but how about everything else they have to do? 

Maybe you can call this tool is just agentic adderal for ADHD developers 

But I think it’s the back office secretary that does all the menial tasks for developer. That a developer deserves 

--- 

We will need integrations for this to work, we will connect to github api for data like PRs, Pipelines, Issues, Commits, and other data from the repo to check on progress of atomic steps of a github project issue. We will also use MCP in a IDE like cursor to confirm atomic steps like running unit tests

Main view will be project board that that mimics github project board and actually uses github API to pull in the data from the repo. Developers will be able to click into an issue and see the steps/progress like a bar as a visual indicator of progress (with a percentage indicator)

Ideally the tool can auto poll/check on if a atomic step is complete or not. But for now the user on the expanded ticket view can click a button to check on the status of the atomic step. Wether that it calls github api or somethig or requests the developor to use the MCP tool in their ide to confirm a step like unit tests are written/passing to report back to the tool.

We will use Cerebras AI API for LLM Integration, since they're providing some free credits for the hackathon (https://inference-docs.cerebras.ai/quickstart)


Probably will need technolgies like
- JSON Structured Outputs
- Sub Agents (separate contexts)
- MCP
- Node, Typescript, React, sqlLite, Prisma, shadcn