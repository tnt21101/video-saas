export const dynamic = "force-dynamic";

import { getProject } from "@/lib/dal";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  return <ProjectDetailClient project={project} />;
}
