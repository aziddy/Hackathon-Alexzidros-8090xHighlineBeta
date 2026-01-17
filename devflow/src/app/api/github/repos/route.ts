import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOctokit, fetchUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's access token from database
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
    }

    const octokit = createOctokit(account.access_token);
    const repos = await fetchUserRepos(octokit);

    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
