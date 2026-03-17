import Link from "next/link";
import { requireUser, getProjects } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Video, Film, Zap } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await getProjects(user.organization_id);
  const recent = projects.slice(0, 6);

  const stats = {
    total: projects.length,
    generating: projects.filter((p) => p.status === "generating").length,
    complete: projects.filter((p) => p.status === "complete").length,
    credits: user.organizations.credits_balance,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user.organizations.name}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-slate-400">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Film className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.generating}</p>
                <p className="text-sm text-slate-400">Generating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.complete}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                C
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.credits}</p>
                <p className="text-sm text-slate-400">Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          {projects.length > 6 && (
            <Link href="/projects" className="text-sm text-blue-400 hover:underline">
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-4">
                Create your first video project to get started
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      <StatusBadge status={project.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400">
                      {project.video_scenes[0]?.count || 0} scenes
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    draft: "bg-slate-700 text-slate-300",
    generating: "bg-yellow-500/20 text-yellow-400",
    stitching: "bg-blue-500/20 text-blue-400",
    complete: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variants[status] || variants.draft
      }`}
    >
      {status}
    </span>
  );
}
