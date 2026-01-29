import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/issues/[issueId]/metadata/branch - Clear branch metadata
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;

    // Verify ownership
    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        project: { userId: session.user.id },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Parse existing metadata, remove branch, keep other data
    let metadata = null;
    try {
      const parsed = issue.metadata ? JSON.parse(issue.metadata) : {};
      delete parsed.branch;
      // Only keep metadata if there's other data
      if (Object.keys(parsed).length > 0) {
        metadata = JSON.stringify(parsed);
      }
    } catch {
      // If parsing fails, just clear all metadata
      metadata = null;
    }

    await prisma.issue.update({
      where: { id: issueId },
      data: { metadata },
    });

    return NextResponse.json({
      success: true,
      message: "Branch metadata cleared",
    });
  } catch (error) {
    console.error("Error clearing branch metadata:", error);
    return NextResponse.json(
      { error: "Failed to clear branch metadata" },
      { status: 500 }
    );
  }
}
