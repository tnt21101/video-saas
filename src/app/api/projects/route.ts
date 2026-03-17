import { NextResponse } from "next/server";
import { requireUser, getProjects, createProject } from "@/lib/dal";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await getProjects(user.organization_id);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[projects GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const project = await createProject(
      user.organization_id,
      user.id,
      name,
      description
    );

    return NextResponse.json(project);
  } catch (error) {
    console.error("[projects POST] Error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
