import { NextResponse } from "next/server";
import { requireUser, getProject, updateProject, deleteProject } from "@/lib/dal";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireUser();
    const { projectId } = await params;
    const project = await getProject(projectId);
    return NextResponse.json(project);
  } catch (error) {
    console.error("[project GET] Error:", error);
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireUser();
    const { projectId } = await params;
    const body = await request.json();
    const project = await updateProject(projectId, body);
    return NextResponse.json(project);
  } catch (error) {
    console.error("[project PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireUser();
    const { projectId } = await params;
    await deleteProject(projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[project DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
