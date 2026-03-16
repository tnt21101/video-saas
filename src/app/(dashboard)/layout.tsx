export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <aside className="w-64 min-h-screen border-r border-slate-800 p-4">
          <div className="font-bold text-lg mb-8">VideoGen</div>
          <nav className="space-y-2 text-sm text-slate-400">
            <div>Dashboard</div>
            <div>Projects</div>
            <div>Settings</div>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
